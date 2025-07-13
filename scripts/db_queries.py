import json

COURSES_TABLE = "uw_courses"
MYPLAN_SUBJECT_AREAS_TABLE = "myplan_subject_areas"
MYPLAN_COURSES_TABLE = "myplan_courses"


def get_all_courses_with_id(cursor) -> str:
    """Get all courses from the database"""
    data = cursor.execute(f"""
    SELECT id, code FROM {COURSES_TABLE}
    """).fetchall()
    return [{"id": row[0], "code": row[1]} for row in data]


def sql_get_course_by_subject_and_number(subject: str, number: str) -> str:
    """Get a course by subject and number"""
    return f"""
    SELECT * FROM {COURSES_TABLE}
    WHERE subject = '{subject}'
    AND number = '{number}'
    """


def sql_get_course_by_code(code: str) -> str:
    """Get a course by code"""
    return f"""
    SELECT * FROM {COURSES_TABLE}
    WHERE code = '{code}'
    """


def get_empty_myplan_data_courses(cursor) -> set:
    """Get courses with empty myplanData"""
    """
    where c."myplanData" IS NULL
    """
    data = cursor.execute(f"""
    SELECT code, subject, number, c."myplanData", c."myplanNotFound" FROM {COURSES_TABLE} c
    """).fetchall()
    return [
        {
            "code": row[0],
            "subject": row[1],
            "number": row[2],
            "myplanData": row[3],
            "myplanNotFound": row[4],
        }
        for row in data
    ]


def sql_update_course_myplan_data():
    """Update course myplan data"""
    return f"""
    UPDATE {COURSES_TABLE}
    SET "myplanData" = %s::jsonb
    WHERE code = %s
    """


def sql_update_course_myplan_not_found():
    """Update course myplan not found"""
    return f"""
    UPDATE {COURSES_TABLE}
    SET "myplanNotFound" = true
    WHERE code = %s
    """
