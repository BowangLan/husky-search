from typing import Any, Dict, List

from scripts.db import with_db
from scripts.update_course_utils import (
    CourseUpdater,
    DatabaseDataSource,
    LocalJsonDataSource,
)


# Specific update functions for different fields
def update_courses_code(cursor, courses: List[Dict[str, Any]]):
    """Update course codes"""
    sql = """
        UPDATE uw_courses 
        SET code = %s
        WHERE id = %s
    """
    cursor.executemany(
        sql,
        [(course["code"], course["id"]) for course in courses],
    )


# Data transformers
def transform_code_data(item) -> List[Dict[str, Any]]:
    """Transform course data for code updates"""
    # Remove the course code prefix (e.g. "A A 101 ") to get just the title
    return {
        "id": item["id"],
        "code": f"{item['subject']} {item['number']}",
    }


def flatten_courses(data):
    """Flatten department data into individual courses"""
    courses = []
    for department in data:
        if "courses" in department:
            for course in department["courses"]:
                courses.append(
                    {
                        **course,
                        "department": department["href"].split(".")[0],
                    }
                )
    return courses


@with_db
def main(conn, cursor):
    """Example usage of the CourseUpdater"""
    # Create data source with transformer
    data_source = DatabaseDataSource(
        cursor=cursor,
        sql="""SELECT id, code, subject, number FROM uw_courses""",
        transform_function=lambda x: [
            {"id": row[0], "code": row[1], "subject": row[2], "number": row[3]}
            for row in x
        ],
    )

    # Create updater - change dry_run=True to preview, dry_run=False to actually update
    dry_run = False  # Set to False to perform actual database updates
    updater = CourseUpdater(
        data_source=data_source,
        progress_file="temp/uw-courses-code-updated.json",
        batch_size=500,
        dry_run=dry_run,
    )

    # Update course titles
    updater.update_courses(
        update_function=update_courses_code,
        data_transformer=transform_code_data,
        field_name="codes",
    )


if __name__ == "__main__":
    main()
