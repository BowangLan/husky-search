import asyncio
from scripts.myplan_api import MyPlanApiClient, SubjectArea
from scripts.db_queries import (
    get_empty_myplan_data_courses,
    sql_update_course_myplan_data,
    sql_update_course_myplan_not_found,
)
from scripts.db import with_db
from rich import print
from dataclasses import asdict
import json


@with_db
def get_empty_myplan_data_courses_from_db(conn, cursor):
    return get_empty_myplan_data_courses(cursor)


@with_db
def insert_myplan_courses(conn, cursor, courses: list[dict]):
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


@with_db
def get_all_myplan_courses_from_db(conn, cursor):
    data = cursor.execute(
        """SELECT code, "subjectAreaCode" FROM myplan_quarter_courses"""
    ).fetchall()
    return [{"code": row[0], "subjectAreaCode": row[1]} for row in data]


@with_db
def get_subject_areas_from_db(conn, cursor):
    data = cursor.execute("""
    SELECT s."quotedCode", s.code, s."courseDuplicate",
                        (
                          SELECT count(c.id)
                          FROM myplan_quarter_courses c
                          WHERE c."subjectAreaCode" = s.code
                        ) as count
    FROM myplan_subject_areas s
    """).fetchall()
    return [
        {
            "quotedCode": row[0],
            "code": row[1],
            "courseDuplicate": row[2],
            "count": row[3],
        }
        for row in data
    ]


@with_db
def set_myplan_subject_course_duplicate(conn, cursor, subject_area_code: str):
    cursor.execute(
        """UPDATE myplan_subject_areas SET "courseDuplicate" = TRUE WHERE code = %s""",
        (subject_area_code,),
    )


async def main():
    print("Getting all myplan courses from db...")
    all_myplan_courses = get_all_myplan_courses_from_db()
    print(f"Found {len(all_myplan_courses)} myplan courses")

    print("Getting subject areas from db...")
    subject_areas = get_subject_areas_from_db()
    print(f"Found {len(subject_areas)} subject areas")

    # filter out subject areas that have no courses
    total_subject_areas = len(subject_areas)
    subject_areas = [
        subject_area for subject_area in subject_areas if subject_area["count"] == 0
    ]
    print(f"Total subject areas: {total_subject_areas}")
    print(
        f"Subject areas with no courses: {len(subject_areas)} / {total_subject_areas}"
    )

    # filter out subject areas that have courseDuplicate
    subject_areas = [
        subject_area
        for subject_area in subject_areas
        if not subject_area["courseDuplicate"]
    ]
    has_duplicate_subject_areas_count = len(
        [
            subject_area
            for subject_area in subject_areas
            if subject_area["courseDuplicate"]
        ]
    )
    print(
        f"Subject areas with courseDuplicate: {has_duplicate_subject_areas_count} / {total_subject_areas}"
    )

    client = MyPlanApiClient()

    count = 0
    problematic_subject_areas = []
    for subject_area in subject_areas:
        print(
            f"\n\n--------\nSearching for courses in {subject_area['quotedCode']}...\n--------\n"
        )
        courses = await client.search_courses(f"{subject_area['quotedCode']}")

        print(
            f"Found {len(courses)} courses for subject area {subject_area['quotedCode']}"
        )

        # unique check
        courses_set = set(f"{course.code}-{course.termId}" for course in courses)
        # courses_set = set(f"{course.courseId}-{course.termId}" for course in courses)
        if len(courses_set) != len(courses):
            print(
                f"⚠️ Duplicate courses found for subject area {subject_area['code']} {len(courses_set)} / {len(courses)}"
            )
            set_myplan_subject_course_duplicate(subject_area["code"])
            problematic_subject_areas.append(subject_area)

            # remove duplicate by selecting the first one
            # new_courses = []
            # seen_courses = set()
            # for course in courses:
            #     if f"{course.code}-{course.termId}" not in seen_courses:
            #         seen_courses.add(f"{course.code}-{course.termId}")
            #         new_courses.append(course)
            # print(f"Removing {len(courses) - len(new_courses)} duplicate courses")
            # courses = new_courses

        insert_myplan_courses(
            [
                {
                    "code": course.code,
                    "quarter": course.termId if course.termId else "null",
                    "data": json.dumps(asdict(course)),
                    "subjectAreaCode": subject_area["code"],
                }
                for course in courses
            ]
        )
        print(f"Inserted {len(courses)} courses for {subject_area['quotedCode']}\n\n")
        count += len(courses)

    print("Done")
    print(f"Inserted {count} courses")
    print(f"Problematic subject areas: {problematic_subject_areas}")


if __name__ == "__main__":
    asyncio.run(main())
