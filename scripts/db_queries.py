import json
from scripts.db import run_query

COURSES_TABLE = "uw_courses"
MYPLAN_SUBJECT_AREAS_TABLE = "myplan_subject_areas"
MYPLAN_COURSES_TABLE = "myplan_quarter_courses"


def get_all_courses_with_id() -> list[dict]:
    """Get all courses from the database"""
    data = run_query(f"""
    SELECT id, code, subject, number FROM {COURSES_TABLE}
    """)
    return [
        {"id": row[0], "code": row[1], "subject": row[2], "number": row[3]}
        for row in data
    ]


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


def get_myplan_courses():
    data = run_query(
        f"""
    SELECT c.id, c.code, c.quarter, c.data, c."subjectAreaCode", c.detail
    FROM {MYPLAN_COURSES_TABLE} c
    """
    )
    return [
        {
            "id": row[0],
            "code": row[1],
            "quarter": row[2],
            "data": row[3],
            "subjectAreaCode": row[4],
            "detail": row[5],
        }
        for row in data
    ]


def get_myplan_courses_short():
    data = run_query(
        f"""
    SELECT c.id, c.code, c.quarter, c.data, c."subjectAreaCode"
    FROM {MYPLAN_COURSES_TABLE} c
    """
    )
    return [
        {
            "id": row[0],
            "code": row[1],
            "quarter": row[2],
            "data": row[3],
            "subjectAreaCode": row[4],
        }
        for row in data
    ]


def get_myplan_subjects():
    data = run_query(
        f"""
    SELECT code, title FROM {MYPLAN_SUBJECT_AREAS_TABLE}
    """
    )
    return [{"code": row[0], "title": row[1]} for row in data]


def insert_myplan_courses(cursor, courses: list[dict]):
    cursor.executemany(
        """INSERT INTO myplan_quarter_courses 
        (code, quarter, data, "subjectAreaCode", "myplanId")
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (code, quarter) DO UPDATE SET
            "hasDuplicate" = TRUE
        """,
        [
            (
                course["code"],
                course["quarter"],
                course["data"],
                course["subjectAreaCode"],
                course["myplanId"],
            )
            for course in courses
        ],
    )


def get_subject_areas_from_db():
    data = run_query(
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
    )

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
