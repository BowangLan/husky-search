import asyncio
import signal
import sys
from datetime import datetime
from scripts.myplan_api import MyPlanApiClient, SubjectArea
from scripts.db_queries import (
    get_empty_myplan_data_courses,
    get_myplan_courses,
)
from scripts.db import (
    with_db,
    run_query,
    MYPLAN_SUBJECTS_TABLE,
    MYPLAN_COURSES_TABLE,
    MYPLAN_SUBJECTS_TABLE,
)
from rich import print
from rich.console import Console
from rich.progress import (
    Progress,
    SpinnerColumn,
    TextColumn,
    BarColumn,
    TaskProgressColumn,
    TimeElapsedColumn,
)
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.live import Live
from rich.align import Align
from dataclasses import asdict
import json
import time

from scripts.utils import duplicate_check
from scripts.cache import LocalCacheController, DistributedCacheController

# Configure console
console = Console()

# Global flag for graceful shutdown
shutdown_requested = False

# cache_controller = LocalCacheController("temp/sync_myplan_courses.json")
cache_controller = DistributedCacheController("temp/sync_myplan_courses")
cache_controller.load()
myplan_search_result_cache_controller = DistributedCacheController(
    "temp/sync_myplan_courses/myplan_search_result"
)
myplan_search_result_cache_controller.load()


def signal_handler(signum, frame):
    """Handle Ctrl+C gracefully"""
    global shutdown_requested
    if not shutdown_requested:
        shutdown_requested = True
        console.print("\n\n[bold yellow]⚠️  Shutdown requested...[/bold yellow]")
        console.print("[dim]Waiting for current operation to complete...[/dim]")
    else:
        console.print("\n[bold red]🛑 Force exit requested[/bold red]")
        sys.exit(1)


# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)


@with_db
def get_empty_myplan_data_courses_from_db(conn, cursor):
    return get_empty_myplan_data_courses(cursor)


@with_db
def insert_myplan_courses(conn, cursor, courses: list[dict]):
    """
    Insert myplan courses into the database
    args:
        courses: list of dicts, each with the following keys:
            - code: str
            - quarter: str
            - data: dict
            - subjectAreaCode: str
    """
    console.print(f"📥 [blue]Inserting[/blue] {len(courses)} courses into database...")

    try:
        cursor.executemany(
            """INSERT INTO myplan_quarter_courses 
            (code, quarter, data, "subjectAreaCode")
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (code, quarter) DO UPDATE SET
                "hasDuplicate" = TRUE
            """,
            [
                (
                    course["code"],
                    course["quarter"],
                    course["data"],
                    course["subjectAreaCode"],
                )
                for course in courses
            ],
        )
        console.print(f"✅ [green]Successfully inserted[/green] {len(courses)} courses")
    except Exception as e:
        console.print(f"❌ [red]Failed to insert courses:[/red] {e}")
        raise


@with_db
def update_myplan_courses(conn, cursor, courses: list[dict]):
    console.print(f"🔄 [yellow]Updating[/yellow] {len(courses)} courses in database...")

    try:
        cursor.executemany(
            """UPDATE myplan_quarter_courses SET data = %s WHERE code = %s AND quarter = %s""",
            [(course["data"], course["code"], course["quarter"]) for course in courses],
        )
        conn.commit()
        console.print(f"✅ [green]Successfully updated[/green] {len(courses)} courses")
    except Exception as e:
        console.print(f"❌ [red]Failed to update courses:[/red] {e}")
        raise


@with_db
def get_all_myplan_courses_from_db(conn, cursor):
    data = cursor.execute(
        """SELECT code, "subjectAreaCode" FROM myplan_quarter_courses"""
    ).fetchall()
    return [{"code": row[0], "subjectAreaCode": row[1]} for row in data]


@with_db
def get_subject_areas_from_db(conn, cursor):
    data = cursor.execute(
        """
    SELECT s."quotedCode", s.code, s."courseDuplicate",
    (
        SELECT count(c.id)
        FROM myplan_quarter_courses c
        WHERE c."subjectAreaCode" = s.code
    ) as count,
    (
        SELECT count(c.id)
        FROM myplan_quarter_courses c
        WHERE c."subjectAreaCode" = s.code and jsonb_array_length(c.data->'sectionGroups') > 0
    ) as count_with_section_groups
    FROM myplan_subject_areas s
    """
    ).fetchall()

    result = [
        {
            "quotedCode": row[0],
            "code": row[1],
            "courseDuplicate": row[2],
            "count": row[3],
            "count_with_section_groups": row[4],
        }
        for row in data
    ]
    return result


@with_db
def set_myplan_subject_course_duplicate(conn, cursor, subject_area_code: str):
    cursor.execute(
        """UPDATE myplan_subject_areas SET "courseDuplicate" = TRUE WHERE code = %s""",
        (subject_area_code,),
    )


def get_myplan_sa_by_code(code: str):
    data = run_query(
        f"""
    SELECT * FROM {MYPLAN_SUBJECTS_TABLE} WHERE code = '{code}'
    """
    )
    return data[0]


def get_courses_by_subject_area_code(subject_area_code: str):
    data = run_query(
        f"""
    SELECT * FROM {MYPLAN_COURSES_TABLE} WHERE "subjectAreaCode" = '{subject_area_code}'
    """
    )
    return data


SQL_SYNC_MYPLAN_COURSE = f"""
UPDATE {MYPLAN_COURSES_TABLE}
SET data = %s WHERE id = %s
"""


def local_get_courses_by_code_and_termId(courses, code, termId):
    t = [
        course
        for course in courses
        if course["code"] == code and course["quarter"] == termId
    ]
    return t[0] if t else None


def local_get_courses_by_code(courses, code):
    t = [course for course in courses if course["code"] == code]
    return t[0] if t else None


def sync_myplan_sa_courses(
    subject_area_code: str,
    new_courses: list[dict],
    existing_db_courses: list[dict],
):
    """
    Sync myplan courses for a subject area
    args:
        subject_area_code: str
        new_courses: list of dicts, each with the following keys:
            - code: str
    """
    console.print(
        f"\n[bold cyan]🔄 SYNCING[/bold cyan] [bold]{subject_area_code}[/bold]"
    )
    console.print(
        f"   📊 Processing {len(new_courses)} new courses vs {len(existing_db_courses)} existing courses"
    )

    code_du_map, code_unique_map, code_all_map = duplicate_check(
        new_courses, lambda x: x.code, no_print=True
    )

    courses_to_insert = []
    courses_to_update = []

    # for courses with unique code, update it
    for code, c in code_unique_map.items():
        local_course = local_get_courses_by_code(existing_db_courses, code)
        if local_course:
            courses_to_update.append(c)
        else:
            courses_to_insert.append(c)

    for code, c in code_du_map.items():
        local_course = local_get_courses_by_code(existing_db_courses, code)
        if local_course:
            courses_to_update.append(c[0])
            courses_to_insert += c[1:]
        else:
            courses_to_insert += c

    # Create summary table
    table = Table(title=f"Sync Plan for {subject_area_code}")
    table.add_column("Action", style="cyan", no_wrap=True)
    table.add_column("Count", justify="right", style="green")
    table.add_column("Percentage", justify="right", style="yellow")

    total = len(new_courses)
    insert_pct = (len(courses_to_insert) / total * 100) if total > 0 else 0
    update_pct = (len(courses_to_update) / total * 100) if total > 0 else 0

    table.add_row("📥 Insert", str(len(courses_to_insert)), f"{insert_pct:.1f}%")
    table.add_row("🔄 Update", str(len(courses_to_update)), f"{update_pct:.1f}%")
    table.add_row("📊 Total", str(total), "100.0%")

    console.print(table)

    courses_to_insert = [
        {
            "code": course.code,
            "quarter": course.termId if course.termId else "null",
            "data": json.dumps(asdict(course)),
            "subjectAreaCode": subject_area_code,
        }
        for course in courses_to_insert
    ]

    courses_to_update = [
        {
            "code": course.code,
            "quarter": course.termId if course.termId else "null",
            "data": json.dumps(asdict(course)),
        }
        for course in courses_to_update
    ]

    if courses_to_update:
        update_myplan_courses(courses_to_update)

    if courses_to_insert:
        insert_myplan_courses(courses_to_insert)

    console.print(
        f"✅ [bold green]COMPLETED[/bold green] {subject_area_code} - 📥 {len(courses_to_insert)} inserted, 🔄 {len(courses_to_update)} updated\n"
    )
    return courses_to_insert, courses_to_update


async def sync_myplan_subject_area(subject_area_code: str, all_myplan_courses):
    global shutdown_requested

    # Check for shutdown request before starting
    if shutdown_requested:
        console.print(
            f"⏸️  [yellow]Skipping {subject_area_code} due to shutdown request[/yellow]"
        )
        return

    start_time = datetime.now()

    if cache_controller.get(subject_area_code):
        console.print(f"🔄 [yellow]Skipping {subject_area_code} due to cache[/yellow]")
        return

    sa_courses = [
        course
        for course in all_myplan_courses
        # if course["subjectAreaCode"] == subject_area_code
    ]
    console.print(
        f"📋 Found {len(sa_courses)} existing courses for {subject_area_code} in database"
    )

    try:
        client = MyPlanApiClient()
        console.print(f"🌐 Fetching courses from MyPlan API for {subject_area_code}...")
        new_courses = await client.search_courses(f"{subject_area_code}")

        # Check for shutdown request after API call
        if shutdown_requested:
            console.print(
                f"⏸️  [yellow]Stopping {subject_area_code} processing due to shutdown request[/yellow]"
            )
            return

        # filter out courses not in the subject area
        new_courses = [
            course for course in new_courses if course.subject == subject_area_code
        ]
        console.print(f"📥 Retrieved {len(new_courses)} courses from MyPlan API")

        # Search results duplicate check
        # doing duplicate check
        # du_keys = duplicate_check(new_courses, lambda x: x.id) # passed
        du_keys, u_map, a_map = duplicate_check(
            new_courses, lambda x: f"{x.code}-{x.termId}", no_print=True
        )

        if du_keys:
            console.print(
                f"⚠️  [yellow]Found {len(du_keys)} duplicate course codes[/yellow]"
            )
            for key, items in du_keys.items():
                console.print(
                    f"   🔄 {key}: {len(items)} duplicates → keeping {a_map[key].id}"
                )

        new_courses = list(a_map.values())
        console.print(f"✨ After duplicate removal: {len(new_courses)} unique courses")

        # stats
        # courses with session groups
        courses_with_session_groups = [
            course for course in new_courses if course.sectionGroups
        ]
        courses_with_non_null_termId = [
            course for course in new_courses if course.termId
        ]

        # Create stats table
        stats_table = Table(title=f"Course Statistics for {subject_area_code}")
        stats_table.add_column("Metric", style="cyan")
        stats_table.add_column("Count", justify="right", style="green")
        stats_table.add_column("Percentage", justify="right", style="yellow")

        total = len(new_courses)
        if total > 0:
            stats_table.add_row("📚 Total Courses", str(total), "100.0%")
            stats_table.add_row(
                "📖 With Section Groups",
                str(len(courses_with_session_groups)),
                f"{len(courses_with_session_groups) / total * 100:.1f}%",
            )
            stats_table.add_row(
                "📅 With Term ID",
                str(len(courses_with_non_null_termId)),
                f"{len(courses_with_non_null_termId) / total * 100:.1f}%",
            )
            stats_table.add_row(
                "❓ Null Term ID",
                str(total - len(courses_with_non_null_termId)),
                f"{(total - len(courses_with_non_null_termId)) / total * 100:.1f}%",
            )

        console.print(stats_table)

        # Check for shutdown request before database operations
        if shutdown_requested:
            console.print(
                f"⏸️  [yellow]Skipping database operations for {subject_area_code} due to shutdown request[/yellow]"
            )
            return

        sync_myplan_sa_courses(subject_area_code, new_courses, sa_courses)

        end_time = datetime.now()
        duration = end_time - start_time
        console.print(
            f"⏱️  [dim]Completed in {duration.total_seconds():.2f} seconds[/dim]"
        )

        cache_controller.set(
            subject_area_code,
            {
                "last_synced": datetime.now().isoformat(),
                "duration": duration.total_seconds(),
                "new_courses": len(new_courses),
                "sa_courses": len(sa_courses),
                "courses_with_session_groups": len(courses_with_session_groups),
                "courses_with_non_null_termId": len(courses_with_non_null_termId),
                "courses_with_null_termId": len(new_courses)
                - len(courses_with_non_null_termId),
            },
        )
        cache_controller.save()

    except Exception as e:
        console.print(
            f"❌ [bold red]ERROR[/bold red] Failed to sync {subject_area_code}: {e}"
        )
        raise


async def main_test():
    console.print("[bold yellow]🧪 TESTING MODE[/bold yellow]")
    subject_area_code = "CSE"
    # myplan_sa = get_myplan_sa_by_code(subject_area_code)
    # print(myplan_sa)

    all_myplan_courses = get_myplan_courses()
    sa_courses = [
        course
        for course in all_myplan_courses
        if course["subjectAreaCode"] == subject_area_code
    ]
    console.print(f"📋 Found {len(sa_courses)} courses for {subject_area_code} from DB")

    client = MyPlanApiClient()
    new_courses = await client.search_courses(f"{subject_area_code}")
    # filter out courses not in the subject area
    new_courses = [
        course for course in new_courses if course.subject == subject_area_code
    ]
    console.print(
        f"📥 Found {len(new_courses)} courses for subject '{subject_area_code}' from MyPlan"
    )

    # Search results for (CSE) is much more than db (242 vs 117)
    # doing duplicate check
    # du_keys = duplicate_check(new_courses, lambda x: x.id) # passed
    du_keys, u_map, a_map = duplicate_check(
        new_courses, lambda x: f"{x.code}-{x.termId}", no_print=True
    )
    for key, items in du_keys.items():
        console.print(f"🔄 {key}: {len(items)} duplicates")
        # for item in items:
        #     print(f"  {item}")

    # stats
    # courses with session groups
    courses_with_session_groups = [
        course for course in new_courses if course.sectionGroups
    ]
    console.print(f"📖 Courses with session groups: {len(courses_with_session_groups)}")
    # courses with non-null termId
    courses_with_non_null_termId = [course for course in new_courses if course.termId]
    console.print(
        f"📅 Courses with non-null termId: {len(courses_with_non_null_termId)}"
    )
    console.print(
        f"❓ Courses with null termId: {len(new_courses) - len(courses_with_non_null_termId)}"
    )

    # print first 5
    # for course in sa_courses[:5]:
    #     print(course)

    for course in new_courses:
        local_course = local_get_courses_by_code_and_termId(
            all_myplan_courses, course.code, course.termId
        )
        if local_course:
            # print(f"Found local course for {course.code}-{course.termId}")
            pass
        else:
            # print(f"No local course found for {course.code}-{course.termId}")
            pass

    """
    Seems like all INFO courses have null termId
    Since in db unique constraint is on (code, quarter/termId)
    We can assume the code is unique for db courses

    Goal: update the db with the new courses
    Problem: match the new courses with db courses
    Solution: use the code to match the new courses with db courses

    New problem: code is not unique for new courses, (code, termId) is NOT??? too?
    Solution: 
    - for a code, update the db with the first new courses with that code
    - insert the rest of the new courses with that code
    """

    code_du_map, code_unique_map, code_all_map = duplicate_check(
        new_courses, lambda x: x.code, no_print=True
    )
    # for code, items in code_du_map.items():
    #     print(f"{code}: {len(items)}")

    sync_myplan_sa_courses(subject_area_code, new_courses, sa_courses)

    # async sleep
    await asyncio.sleep(2)


async def main():
    global shutdown_requested
    start_time = datetime.now()
    # Header
    console.print(
        Panel.fit(
            "[bold blue]🚀 MyPlan Course Synchronization[/bold blue]\n"
            "[dim]Synchronizing course data from MyPlan API to database[/dim]\n"
            "[dim]Press Ctrl+C to gracefully stop the process[/dim]",
            border_style="blue",
        )
    )

    subject_areas = get_subject_areas_from_db()
    subject_areas = [
        sa
        for sa in subject_areas
        # if sa["count"] > 0
        # and sa["count_with_section_groups"] == 0
    ]
    subject_areas.sort(key=lambda x: x["count"], reverse=True)

    total_courses = sum(sa["count"] for sa in subject_areas)

    # Summary table
    summary_table = Table(title="📊 Synchronization Summary")
    summary_table.add_column("Metric", style="cyan")
    summary_table.add_column("Value", justify="right", style="green")
    summary_table.add_row("📚 Subject Areas", str(len(subject_areas)))
    summary_table.add_row("📖 Total Courses", str(total_courses))
    summary_table.add_row(
        "🏆 Largest Subject",
        f"{subject_areas[0]['code']} ({subject_areas[0]['count']} courses)",
    )

    console.print(summary_table)
    console.print()

    successful_syncs = 0
    failed_syncs = 0
    skipped_syncs = 0

    # Progress tracking
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        overall_task = progress.add_task(
            f"[cyan]Processing {len(subject_areas)} subject areas...",
            total=len(subject_areas),
        )

        for i, sa in enumerate(subject_areas):
            # Check for shutdown request before processing each subject area
            if shutdown_requested:
                console.print(
                    f"\n[bold yellow]🛑 Shutdown requested. Stopping at {sa['code']} ({i + 1}/{len(subject_areas)})[/bold yellow]"
                )
                skipped_syncs = len(subject_areas) - i
                break

            progress.update(
                overall_task,
                description=f"[cyan]Processing {sa['code']} ({i + 1}/{len(subject_areas)})",
            )

            try:
                await sync_myplan_subject_area(sa["code"], get_myplan_courses())
                if (
                    not shutdown_requested
                ):  # Only count as successful if not interrupted
                    successful_syncs += 1
                progress.advance(overall_task)
            except Exception as e:
                if not shutdown_requested:  # Only count as failed if not interrupted
                    failed_syncs += 1
                    console.print(f"❌ [red]Failed to sync {sa['code']}: {e}[/red]")
                progress.advance(overall_task)
                continue

    end_time = datetime.now()
    duration = end_time - start_time

    # Final summary
    console.print()

    if shutdown_requested:
        console.print(
            Panel.fit(
                f"[bold yellow]⚠️  Synchronization Interrupted[/bold yellow]\n\n"
                f"⏱️  Time Elapsed: {duration.total_seconds():.2f} seconds\n"
                f"✅ Completed: {successful_syncs} subject areas\n"
                f"❌ Failed: {failed_syncs} subject areas\n"
                f"⏸️  Skipped: {skipped_syncs} subject areas\n"
                f"📊 Progress: {successful_syncs + failed_syncs}/{len(subject_areas)} ({((successful_syncs + failed_syncs) / len(subject_areas) * 100):.1f}%)",
                border_style="yellow",
            )
        )
    else:
        console.print(
            Panel.fit(
                f"[bold green]✅ Synchronization Complete![/bold green]\n\n"
                f"⏱️ Total Time: {duration.total_seconds():.2f} seconds\n"
                f"✅ Successful: {successful_syncs} subject areas\n"
                f"❌ Failed: {failed_syncs} subject areas\n"
                f"📊 Success Rate: {successful_syncs / (successful_syncs + failed_syncs) * 100:.1f}%",
                border_style="green" if failed_syncs == 0 else "yellow",
            )
        )


if __name__ == "__main__":
    try:
        console.print("[bold blue]🚀 Starting MyPlan course sync script[/bold blue]")
        asyncio.run(main())
        # asyncio.run(main_test())
    except KeyboardInterrupt:
        console.print("\n[bold red]🛑 Script interrupted by user[/bold red]")
        sys.exit(1)
    except Exception as e:
        console.print(f"\n[bold red]💥 Unexpected error: {e}[/bold red]")
        sys.exit(1)
