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


def insert_program(cursor, program):
    # SQL insert statement matching schema
    sql = """
        INSERT INTO uw_programs 
        (name, code)
        VALUES (%s, %s)
        ON CONFLICT (code) DO NOTHING
    """

    cursor.execute(
        sql,
        (
            program["text"].split("(")[0].strip(),
            program["href"].split(".")[0],
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

    try:
        # Process each department
        for i, program in enumerate(data):
            try:
                insert_program(cursor, program)
                print(f"({i + 1}/{len(data)}) Inserted program '{program['text']}'")
                if i % 100 == 0:
                    conn.commit()
                    print("Committed transaction")
            except Exception as e:
                print(f"Error inserting program {program['name']}: {str(e)}")

        # Commit the transaction
        conn.commit()
        print("Successfully uploaded programs to database")

    except Exception as e:
        conn.rollback()
        print(f"Error: {str(e)}")

    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
