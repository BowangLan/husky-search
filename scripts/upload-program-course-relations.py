import json
import os
from dotenv import load_dotenv
import psycopg
from datetime import datetime
from rich import print

# Load environment variables
load_dotenv()

# Database connection parameters
DATABASE_URL = os.getenv("DATABASE_URL")

# Load course data
UW_COURSE_FILENAME = "temp/uw-courses.json"

def update_course_programs(cursor, pairs):
    # SQL insert statement matching schema
    sql = """
        UPDATE uw_courses as c
        SET "programCode" = %s
        WHERE c.code = %s
    """

    # Convert pairs to list of tuples for psycopg execute_values
    values = [(pair["program_code"], pair["course_code"]) for pair in pairs]
    
    cursor.executemany(sql, values)



def update_course_program(cursor, course_code, program_code):
    # SQL insert statement matching schema
    sql = """
        UPDATE uw_courses
        SET "programCode" = %s
        WHERE code = %s
    """

    cursor.execute(
        sql,
        (
            program_code,
            course_code,
        ),
    )


def flatten_courses(data):
    courses = []
    for department in data:
        if "courses" in department:
            for course in department["courses"]:
                courses.append(
                    {
                        **course,
                        "programCode": department["href"].split(".")[0],
                        "subject": course["code"][:-3].upper(),
                        "number": course["code"][-3:],
                    }
                )
    return courses


def get_existing_courses(cursor):
    sql = """
        SELECT c.code, c."programCode" FROM uw_courses as c where c."programCode" is not null
    """
    cursor.execute(sql)
    return [
        {
            "code": row[0],
            "programCode": row[1],
        }
        for row in cursor.fetchall()
    ]


def main():
    # Load course data
    with open(UW_COURSE_FILENAME, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Connect to database
    conn = psycopg.connect(DATABASE_URL)
    cursor = conn.cursor()

    existing_courses = get_existing_courses(cursor)
    existing_course_code_set = set([course["code"] for course in existing_courses])

    courses = flatten_courses(data)

    total_courses = len(courses)

    # filter out courses that already have a program code
    courses = [
        course for course in courses if course["code"] not in existing_course_code_set
    ]

    print(f"Found {len(existing_courses)} courses with program code")
    print(f"{len(courses)} courses to update")

    # cursor.close()
    # conn.close()
    # return

    try:
        # for i, course in enumerate(courses):
        #     try:
        #         update_course_program(cursor, course["code"], course["programCode"])
        #         i_shifted = i + 1 + len(existing_courses)
        #         print(
        #             f"({i_shifted}/{total_courses} {round(i_shifted / total_courses * 100, 2)}%) Updated course '{course['code']}'"
        #         )
        #         if i % 100 == 0:
        #             conn.commit()
        #             print("Committed transaction")
        #     except Exception as e:
        #         print(f"Error updating course {course['code']}: {str(e)}")

        # Process courses in batches of 100
        batch_size = 100
        for i in range(0, len(courses), batch_size):
            try:
                batch = courses[i:i+batch_size]
                pairs = [{"course_code": c["code"], "program_code": c["programCode"]} for c in batch]
                update_course_programs(cursor, pairs)
                
                i_shifted = i + len(batch) + len(existing_courses)
                print(
                    f"({i_shifted}/{total_courses} {round(i_shifted / total_courses * 100, 2)}%) Updated {len(batch)} courses"
                )
                conn.commit()
                print("Committed transaction")
            except Exception as e:
                print(f"Error updating batch starting at index {i}: {str(e)}")

        # Commit the transaction
        conn.commit()
        print("Successfully updated course program relations")

    except Exception as e:
        conn.rollback()
        print(f"Error: {str(e)}")

    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
