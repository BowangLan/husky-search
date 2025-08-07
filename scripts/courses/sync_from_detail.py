import asyncio
from scripts.courses.utils import get_course_enroll_count_2
from scripts.db import MYPLAN_COURSES_TABLE, with_db, MYPLAN_COURSE_DETAILS_TABLE
from scripts.db_queries import get_myplan_courses, get_myplan_subjects
from rich import print


@with_db
def batch_update_courses(conn, cursor, courses: list[dict], batch_size: int = 100):
    sql_update_subject_num = f"""
    UPDATE {MYPLAN_COURSES_TABLE}
    SET "enrollMax" = %s, "enrollCount" = %s
    WHERE id = %s
    """
    for i in range(0, len(courses), batch_size):
        batch = courses[i : i + batch_size]
        cursor.executemany(
            sql_update_subject_num,
            [
                (course["enrollMax"], course["enrollCount"], course["id"])
                for course in batch
            ],
        )
        print(f"Updated {i + len(batch)}/{len(courses)} courses")
        conn.commit()


@with_db
def get_myplan_course_details(conn, cursor, page):
    sql_get_myplan_course_details = f"""
    SELECT subject, number, data, id
    FROM {MYPLAN_COURSE_DETAILS_TABLE}
    ORDER BY id DESC
    LIMIT 100
    OFFSET %s
    """
    cursor.execute(sql_get_myplan_course_details, ((page + 1) * 100,))
    return [
        {
            "subject": row[0],
            "number": row[1],
            "data": row[2],
        }
        for row in cursor.fetchall()
    ]


@with_db
def fetch_myplan_quarter_courses_with_zero_enroll(conn, cursor):
    sql_fetch_myplan_quarter_courses = f"""
    SELECT id, code, quarter, data, "subjectAreaCode", number
    FROM {MYPLAN_COURSES_TABLE}
    WHERE "enrollMax" = 0 AND "enrollCount" = 0
    ORDER BY id DESC
    """

    cursor.execute(sql_fetch_myplan_quarter_courses)
    return [
        {
            "id": row[0],
            "code": row[1],
            "quarter": row[2],
            "data": row[3],
            "subjectAreaCode": row[4],
            "number": row[5],
        }
        for row in cursor.fetchall()
    ]


@with_db
def get_detail_by_codes(conn, cursor, params: list[tuple[str, str]]):
    conditions = []
    for subject, number in params:
        conditions.append(f"(subject = '{subject}' AND number = '{number}')")

    sql_get_detail_by_code = f"""
    SELECT subject, number, data, id 
    FROM {MYPLAN_COURSE_DETAILS_TABLE}
    WHERE {" OR ".join(conditions)}
    ORDER BY id DESC
    """
    cursor.execute(sql_get_detail_by_code)
    return [
        {
            "subject": row[0],
            "number": row[1],
            "data": row[2],
            "id": row[3],
        }
        for row in cursor.fetchall()
    ]


def deal_with_special_courses():
    print("Fetching courses...")
    courses = fetch_myplan_quarter_courses_with_zero_enroll()
    print(f"Found {len(courses)} courses with zero enroll")

    missing_courses = []
    updated_courses = []
    update_params = []

    # batch it
    batch_size = 10
    for i in range(0, len(courses), batch_size):
        batch = courses[i : i + batch_size]
        batch_details = get_detail_by_codes(
            [(course["subjectAreaCode"], course["number"]) for course in batch]
        )
        print(f"Found {len(batch_details)} details for batch {i}")
        local_update_params = []
        for course_detail in batch_details:
            enroll_data = get_course_enroll_count_2(course_detail["data"])
            for term, data in enroll_data.items():
                for course in batch:
                    if (
                        course["subjectAreaCode"] == course_detail["subject"]
                        and course["number"] == course_detail["number"]
                        and course["quarter"] == term
                    ):
                        local_update_params.append(
                            {
                                "id": course["id"],
                                "enrollMax": data["enroll_total_count"],
                                "enrollCount": data["enroll_available_count"],
                            }
                        )
                        quarter_course_key = f"{course_detail['subject']}-{course_detail['number']}-{term}"
                        updated_courses.append(quarter_course_key)
                        break

        print(f"Found {len(local_update_params)} courses to update")
        update_params.extend(local_update_params)

    batch_update_courses(update_params)
    print(f"Updated courses: {len(updated_courses)}")
    print(f"Missing courses: {len(missing_courses)}")

    # bug: some details havec zero enroll max and count, so it'll always returned from fetch_myplan_quarter_courses_with_zero_enroll


async def main():
    print("Fetching courses...")
    courses = fetch_myplan_quarter_courses_with_zero_enroll()
    print(f"Found {len(courses)} courses with zero enroll")
    quarter_course_map = {
        f"{course['subjectAreaCode']}-{course['number']}-{course['quarter']}": course
        for course in courses
    }
    print(f"Quarter course map: {len(quarter_course_map)}")

    update_params = []
    updated_count = 0

    for detail_page in range(50, 100):  # 100 000 courses
        print(
            f"Fetching course details... {detail_page * 100} - {(detail_page + 1) * 100}"
        )
        course_details = get_myplan_course_details(detail_page)

        if len(course_details) == 0:
            break

        print(f"Fetched {len(course_details)} course details")

        local_updated_count = 0

        for course_detail in course_details:
            enroll_data = get_course_enroll_count_2(course_detail["data"])
            for term, data in enroll_data.items():
                quarter_course_key = (
                    f"{course_detail['subject']}-{course_detail['number']}-{term}"
                )
                if quarter_course_key not in quarter_course_map:
                    continue
                quarter_course = quarter_course_map[quarter_course_key]
                update_params.append(
                    {
                        "subjectAreaCode": course_detail["subject"],
                        "number": course_detail["number"],
                        "quarter": term,
                        "id": quarter_course["id"],
                        "enrollMax": data["enroll_total_count"],
                        "enrollCount": data["enroll_available_count"],
                    }
                )
                local_updated_count += 1

        # print(f"Not found courses: {len(not_found_courses)}")
        print(f"Found {local_updated_count} courses to update")
        updated_count += local_updated_count

    batch_update_courses(update_params, 500)

    print(f"Updated courses: {updated_count}")

    # print("Done")


if __name__ == "__main__":
    # asyncio.run(main())
    deal_with_special_courses()
