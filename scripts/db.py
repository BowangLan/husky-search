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

