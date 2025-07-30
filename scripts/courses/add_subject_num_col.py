import asyncio
from scripts.db import MYPLAN_COURSES_TABLE, with_db
from scripts.db_queries import get_myplan_courses, get_myplan_subjects
from rich import print


@with_db
def batch_update_courses(conn, cursor, courses: list[dict]):
    sql_update_subject_num = f"""
    UPDATE {MYPLAN_COURSES_TABLE}
    SET "number" = %s
    WHERE id = %s
    """
    batch_size = 100
    for i in range(0, len(courses), batch_size):
        batch = courses[i : i + batch_size]
        cursor.executemany(
            sql_update_subject_num,
            [(course["number"], course["id"]) for course in batch],
        )
        print(f"Updated {i + len(batch)}/{len(courses)} courses")
        conn.commit()


async def main():
    print("Fetching courses...")
    courses = get_myplan_courses()
    print(f"Found {len(courses)} courses")

    print("Fetching subjects...")
    subjects = get_myplan_subjects()
    print(f"Found {len(subjects)} subjects")
    subject_codes_set = set(subject["code"] for subject in subjects)

    print(courses[0])

    print("Checking courses...")
    missing_count = 0
    for course in courses:
        if course["data"]["subject"] not in subject_codes_set:
            print(
                f"Course {course['code']} has subject area {course['data']['subject']} that is not in subjects"
            )
            missing_count += 1

    print(f"Found {missing_count} courses with missing subjects")

    for course in courses:
        if course["data"]["subject"] not in subject_codes_set:
            print(
                f"Course {course['code']} has subject area {course['data']['subject']} that is not in subjects"
            )
            missing_count += 1
            # run_query(sql_update_subject_num, (course["data"]["number"], course["id"]))
        # courseNumber = course["detail"]["courseSummaryDetails"]["courseNumber"]

    batch_update_courses(
        [
            {
                "id": course["id"],
                "number": course["detail"]["courseSummaryDetails"]["courseNumber"],
            }
            for course in courses
        ]
    )

    print("Done")


if __name__ == "__main__":
    asyncio.run(main())
