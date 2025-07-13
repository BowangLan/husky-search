from scripts.update_course_utils import DataSource, LocalJsonDataSource, CourseUpdater
import asyncio
import httpx
import uuid
import json
import time
import hashlib
from rich import print
from dataclasses import dataclass
from scripts.myplan_api import MyPlanApiClient


class MyPlanDataSource(DataSource):
    def load_data(self):
        return []


async def main():
    # data_source = MyPlanDataSource()
    # updater = CourseUpdater(data_source)
    # updater.update_courses()

    # test search_courses
    client = MyPlanApiClient()
    subject_areas = await client.get_subject_areas()
    s1 = subject_areas[0]
    # print(s1)
    courses = await client.search_courses(f"{s1.code}")
    print(courses)
    print(f"Total courses for '{s1.code}': {len(courses)}")


if __name__ == "__main__":
    asyncio.run(main())
