import psycopg
import os
from dotenv import load_dotenv

load_dotenv()


def with_db(func):
    def wrapper(*args, **kwargs):
        conn = psycopg.connect(os.getenv("DATABASE_URL"))
        cursor = conn.cursor()
        result = func(conn, cursor, *args, **kwargs)
        conn.commit()
        cursor.close()
        conn.close()
        return result

    return wrapper


@with_db
def run_query(conn, cursor, query):
    cursor.execute(query)
    return cursor.fetchall()


MYPLAN_SUBJECTS_TABLE = "myplan_subject_areas"
PROGRAMS_TABLE = "uw_programs"
COURSES_TABLE = "uw_courses"
MYPLAN_COURSES_TABLE = "myplan_quarter_courses"
MYPLAN_COURSE_DETAILS_TABLE = "myplan_course_details"
CEC_DATA_TABLE = "course_cec_data"
