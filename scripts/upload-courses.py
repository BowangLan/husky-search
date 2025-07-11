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


# def insert_courses(cursor, courses):
#     # Parse the course name to get subject and number
#     # Extract title by removing subject, number and credits from name
    
#     # SQL insert statement matching schema
#     sql = """
#         INSERT INTO uw_courses 
#         (code, title, description, credit, subject, number, quarters)
#         VALUES
#     """

#     for course in courses:
#         name_parts = course["name"].split(")")
#         title = name_parts[0].split(" ", 2)[2].rsplit("(", 1)[0].strip()
#         sql += f"({course['code']}, {title}, {course['description']}, {course['credits']}, {course['subject']}, {course['number']}, {course['quarters']}),"
#     sql += "ON CONFLICT (code) DO NOTHING"
#     cursor.execute(sql)


def insert_course(cursor, course):
    # Parse the course name to get subject and number
    # Extract title by removing subject, number and credits from name
    name_parts = course["name"].split(")")
    title = name_parts[0].split(" ", 2)[2].rsplit("(", 1)[0].strip()

    # SQL insert statement matching schema
    sql = """
        INSERT INTO uw_courses 
        (code, title, description, credit, subject, number, quarters)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (code) DO NOTHING
    """

    cursor.execute(
        sql,
        (
            course["code"],
            title,
            course["description"],
            course["credits"],
            course["subject"],
            course["number"],
            course["quarters"],
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
                        "department": department["href"].split(".")[0],
                        "subject": course["code"][:-3].upper(),
                        "number": course["code"][-3:],
                    }
                )
    return courses


def main():
    # Load course data
    with open(UW_COURSE_FILENAME, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Connect to database
    conn = psycopg.connect(DATABASE_URL)
    cursor = conn.cursor()

    # flatten departments into courses
    courses = flatten_courses(data)

    try:
        # Process each department
        for i, course in enumerate(courses):
            try:
                insert_course(cursor, course)
                print(f"({i + 1}/{len(courses)}) Inserted course '{course['code']}'")
                if i % 100 == 0:
                    conn.commit()
                    print("Committed transaction")
            except Exception as e:
                print(f"Error inserting course {course['code']}: {str(e)}")

        # Commit the transaction
        conn.commit()
        print("Successfully uploaded courses to database")

    except Exception as e:
        conn.rollback()
        print(f"Error: {str(e)}")

    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
