# sync_myplan_courses.py
import asyncio
from dataclasses import asdict
from scripts.data_sync_orchestrator import DataSyncOrchestrator, SyncConfig
from scripts.myplan_api import MyPlanApiClient
from scripts.db_queries import get_subject_areas_from_db
from scripts.myplan_local_cache import myplan_search_result_cache_controller


async def main():
    # Minimal configuration
    config = SyncConfig(
        name="MyPlan Courses",
        batch_delay=1.0,
        cache_location="temp/sync_myplan_courses/myplan_search_result_2",
    )

    # Initialize orchestrator and client
    orchestrator = DataSyncOrchestrator(config)
    client = MyPlanApiClient()

    # Get data to sync
    subject_areas = get_subject_areas_from_db()

    # Define sync behavior
    async def fetch_courses(subject_area):
        return await client.search_courses(subject_area["quotedCode"])

    def should_skip_empty(subject_area, courses):
        return not courses  # Skip if no courses found

    def transform_courses(courses):
        return [asdict(c) for c in courses]

    # Run the sync
    await orchestrator.sync(
        items=subject_areas,
        fetch_func=fetch_courses,
        cache_controller=myplan_search_result_cache_controller,
        get_cache_key=lambda sa: sa["code"],
        get_display_name=lambda sa: sa["code"],
        should_skip=should_skip_empty,
        transform_result=transform_courses,
    )


if __name__ == "__main__":
    asyncio.run(main())
