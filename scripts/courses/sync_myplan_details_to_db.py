from scripts.cache import DistributedCacheController
from scripts.myplan_local_cache import myplan_search_result_cache_controller
from scripts.db_queries import get_subject_areas_from_db, insert_myplan_courses
from scripts.db import with_db, MYPLAN_COURSES_TABLE
import json
from rich import print


myplan_details_cache_controller = DistributedCacheController(
    "temp/sync_myplan_courses/myplan_course_details"
)
myplan_details_cache_controller.load()

sql_myplan_update_course_detail = f"""
UPDATE {MYPLAN_COURSES_TABLE}
SET "detail" = %s::jsonb
WHERE code = %s
"""


@with_db
def upload_courses_to_db(conn, cursor):
    # ------------------------------------------------------------
    # upload local cache courses to db
    # ------------------------------------------------------------
    total_courses = 0
    total_batches = 0
    batch_size = 20

    print("\n--------\nStarting course upload from local cache to DB...\n--------\n")

    course_codes = myplan_details_cache_controller.keys()

    print(f"Found {len(course_codes)} courses to process")

    for i in range(0, len(course_codes), batch_size):
        batch = course_codes[i : i + batch_size]

        cursor.executemany(
            sql_myplan_update_course_detail,
            [
                (
                    json.dumps(myplan_details_cache_controller.get(course_code)),
                    course_code,
                )
                for course_code in batch
            ],
        )

        total_batches += 1
        total_courses += len(batch)
        conn.commit()
        print(
            f"Uploaded batch {total_batches} ({i + 1}-{min(i + batch_size, len(course_codes))} of {len(course_codes)} courses)"
        )

    print(f"\n--------\nUpload complete!")
    print(f"Total courses uploaded: {total_courses}")
    print(f"Total batches processed: {total_batches}")
    print("--------\n")


def main():
    upload_courses_to_db()


if __name__ == "__main__":
    main()
