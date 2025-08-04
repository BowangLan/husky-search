from scripts.db import run_query, CEC_DATA_TABLE


def get_all_courses_with_id() -> list[dict]:
    """Get all courses from the database"""
    data = run_query(f"""
    SELECT id, "courseUrl", data FROM {CEC_DATA_TABLE}
    """)
    return [{"id": row[0], "courseUrl": row[1], "data": row[2]} for row in data]
