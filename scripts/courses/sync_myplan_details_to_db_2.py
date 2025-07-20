# sync_myplan_details_to_db.py
import asyncio
from dataclasses import asdict
from scripts.cache import LocalCacheController
from scripts.data_sync_orchestrator import DataSyncOrchestrator, SyncConfig
from scripts.db import MYPLAN_COURSES_TABLE, with_db
from scripts.myplan_api import MyPlanApiClient
from scripts.db_queries import get_myplan_courses
from scripts.myplan_local_cache import DistributedCacheController
import json


sql_myplan_update_course_detail = f"""
UPDATE {MYPLAN_COURSES_TABLE}
SET "detail" = %s::jsonb
WHERE code = %s
"""


async def main():
    # Minimal configuration
    config = SyncConfig(
        name="MyPlan Details to DB",
        batch_delay=0,
        batch_size=5,
        cache_location="temp/sync_myplan_courses/myplan_details_to_db",
    )

    local_cache_controller = DistributedCacheController(
        "temp/sync_myplan_courses/myplan_course_details"
    )
    local_cache_controller.load()
    upload_cache_controller = LocalCacheController(
        "temp/sync_myplan_courses/myplan_details_db_upload.json"
    )
    upload_cache_controller.load()

    # Initialize orchestrator and client
    orchestrator = DataSyncOrchestrator(config)

    # Get data to sync
    myplan_course_codes = local_cache_controller.keys()[:50]
    # batch_size = 5
    # batched_course_codes = [
    #     myplan_course_codes[i : i + batch_size]
    #     for i in range(0, len(myplan_course_codes), batch_size)
    # ]

    # Define sync behavior
    # async def fetch_courses(course_codes):
    #     # update course detail in db
    #     cursor.executemany(
    #         sql_myplan_update_course_detail,
    #         [
    #             (json.dumps(local_cache_controller.get(course_code)), course_code)
    #             for course_code in course_codes
    #         ],
    #     )
    #     conn.commit()
    #     return course_codes

    @with_db
    async def upload_course_to_db(conn, cursor, course_code):
        # update course detail in db
        cursor.execute(
            sql_myplan_update_course_detail,
            (json.dumps(local_cache_controller.get(course_code)), course_code),
        )
        conn.commit()
        return course_code

    def should_skip_empty(subject_area, course_codes):
        return not course_codes  # Skip if no courses found

    def transform_courses(course_detail):
        return course_detail

    # Run the sync
    await orchestrator.sync(
        items=myplan_course_codes,
        fetch_func=upload_course_to_db,
        cache_controller=upload_cache_controller,
        get_cache_key=lambda sa: sa,
        get_display_name=lambda sa: sa,
        should_skip=should_skip_empty,
        transform_result=transform_courses,
    )


if __name__ == "__main__":
    asyncio.run(main())
