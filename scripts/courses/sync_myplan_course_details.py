# sync_myplan_course_details.py
import asyncio
from dataclasses import asdict
from scripts.data_sync_orchestrator import DataSyncOrchestrator, SyncConfig
from scripts.myplan_api import MyPlanApiClient
from scripts.db_queries import get_myplan_courses
from scripts.myplan_local_cache import DistributedCacheController


async def main():
    # Minimal configuration
    config = SyncConfig(
        name="MyPlan Course Details",
        batch_delay=0,
        batch_size=5,
        cache_location="temp/sync_myplan_courses/myplan_course_details",
    )

    cache_controller = DistributedCacheController(
        "temp/sync_myplan_courses/myplan_course_details"
    )
    cache_controller.load()

    # Initialize orchestrator and client
    orchestrator = DataSyncOrchestrator(config)
    client = MyPlanApiClient()

    # Get data to sync
    myplan_courses = get_myplan_courses()

    # Define sync behavior
    async def fetch_courses(course):
        d = await client.get_course_detail(course["code"])
        return d

    def should_skip_empty(subject_area, courses):
        return not courses  # Skip if no courses found

    def transform_courses(course_detail):
        return course_detail

    # Run the sync
    await orchestrator.sync(
        items=myplan_courses,
        fetch_func=fetch_courses,
        cache_controller=cache_controller,
        get_cache_key=lambda sa: sa["code"],
        get_display_name=lambda sa: sa["code"],
        should_skip=should_skip_empty,
        transform_result=transform_courses,
    )


if __name__ == "__main__":
    asyncio.run(main())
