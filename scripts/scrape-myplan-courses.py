import httpx
import json
import asyncio
import random
from rich import print


async def scrape_myplan_course_detail(course_code: str) -> dict:
    """
    Scrapes detailed course information from MyPlan API
    Args:
        course_code: Course code like "ASTR 425"
    Returns:
        Dictionary containing course details
    """
    url = (
        f"https://course-app-api.planning.sis.uw.edu/api/courses/{course_code}/details"
    )

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            print(f"Error making request for {course_code}: {e}")
            return {}
        except Exception as e:
            print(f"Error scraping {course_code}: {e}")
            return {}


async def search_myplan_courses(query: str) -> dict:
    """
    Searches for courses using MyPlan API
    Args:
        query: Search query string
    Returns:
        Dictionary containing search results
    """
    url = "https://course-app-api.planning.sis.uw.edu/api/courses"

    payload = {
        "username": "blan2",
        "requestId": "976596bb-0bf0-4c13-aa60-f1bd28e10ec5",
        "sectionSearch": True,
        "instructorSearch": False,
        "queryString": query,
        "consumerLevel": "UNDERGRADUATE",
        "campus": "seattle",
        "days": [],
        "startTime": "0630",
        "endTime": "2230",
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            print(f"Error making request: {e}")
            return {}
        except Exception as e:
            print(f"Error searching courses: {e}")
            return {}


async def main() -> None:
    # course_code = "ASTR 425"
    # course_detail = await scrape_myplan_course_detail(course_code)
    # print(course_detail)

    with open("temp/uw-courses.json", "r", encoding="utf-8") as f:
        uw_courses = json.load(f)

    random_department = random.choice(uw_courses)
    random_course = random.choice(random_department["courses"])

    print(random_course)

    def format_course_code(course_code: str) -> str:
        return course_code[:-3].upper() + " " + course_code[-3:]

    course_detail = await scrape_myplan_course_detail(
        format_course_code(random_course["code"])
    )
    print(course_detail)


if __name__ == "__main__":
    asyncio.run(main())
