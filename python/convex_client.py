from rich import print
import os
import json
from pathlib import Path
from typing import Any, Dict, List, Optional


from convex import ConvexClient
from python.env import get_env


def get_convex_client() -> ConvexClient:
    convex_url = get_env("CONVEX_URL")

    if not convex_url:
        raise RuntimeError("CONVEX_URL is not set")

    return ConvexClient(convex_url)


def fetch_all_courses_via_full(
    convex_client: ConvexClient,
) -> Optional[List[Dict[str, Any]]]:
    try:
        result = convex_client.query("myplan:listFullCourses", {})
    except Exception as e:
        print(f"[yellow]Full export call failed: {e}[/yellow]")
        return None

    if result is None:
        return None

    if isinstance(result, list):
        return result

    if (
        isinstance(result, dict)
        and "data" in result
        and isinstance(result["data"], list)
    ):
        # Be tolerant if server returns shape like { data: [...] }
        return result["data"]

    # Unknown shape
    print(
        "[yellow]Full export returned unexpected shape; falling back to pagination[/yellow]"
    )
    return None


def fetch_all_courses_paginated(
    convex_client: ConvexClient, batch_size: int = 200
) -> List[Dict[str, Any]]:
    all_courses: List[Dict[str, Any]] = []
    cursor: Optional[str] = None
    page_num = 1

    while True:
        payload: Dict[str, Any] = {"limit": batch_size}
        if cursor is not None:
            payload["cursor"] = cursor

        page = convex_client.query("myplan:listFullCourses", payload)

        if not isinstance(page, dict):
            raise RuntimeError("Unexpected response shape from myplan:listFullCourses")

        data = page.get("data", [])
        is_done = page.get("isDone", True)
        cursor = page.get("continueCursor")

        print(f"Fetched page {page_num} with {len(data)} items")
        all_courses.extend(data)
        page_num += 1

        if is_done:
            break

    return all_courses


def main():
    convex_client = get_convex_client()

    output_path = Path(os.getenv("MYPLAN_COURSES_OUT", "temp/myplan_courses.json"))

    print("Paginated fetch via myplan:listFullCourses ...")
    # courses = fetch_all_courses_paginated(convex_client, batch_size=200)
    # courses = f

    # Normalize items to include required fields
    # normalized: List[Dict[str, Any]] = []
    # for item in courses:
    #     normalized.append(
    #         {
    #             "courseCode": item.get("courseCode", ""),
    #             "courseTitle": item.get("courseTitle", ""),
    #             "description": item.get("description", ""),
    #         }
    #     )


if __name__ == "__main__":
    main()
