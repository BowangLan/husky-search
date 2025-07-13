import json
import os
from dotenv import load_dotenv
import psycopg
from datetime import datetime
from rich import print
from pathlib import Path
import asyncio

# Load environment variables
load_dotenv()

# Database connection parameters
DATABASE_URL = os.getenv("DATABASE_URL")


def get_random_courses(cursor, count: int):
    sql = """
        SELECT code, title FROM uw_courses
        ORDER BY RANDOM()
        LIMIT %s
    """
    cursor.execute(sql, (count,))
    return {course[0]: {"title": course[1]} for course in cursor.fetchall()}


async def main():
    # Connect to database
    conn = psycopg.connect(DATABASE_URL)
    cursor = conn.cursor()

    courses = get_random_courses(cursor, 10)
    print(courses)

    cursor.close()
    conn.close()


if __name__ == "__main__":
    asyncio.run(main())
