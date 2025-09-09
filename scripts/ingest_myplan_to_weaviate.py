from rich import print
import os
import json
from pathlib import Path

from dotenv import load_dotenv

import weaviate
from weaviate.classes.init import Auth


load_dotenv(".env.local")
load_dotenv(".env")


def get_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def connect_weaviate():
    weaviate_url = get_env("WEAVIATE_URL")
    weaviate_api_key = get_env("WEAVIATE_API_KEY")
    client = weaviate.connect_to_weaviate_cloud(
        cluster_url=weaviate_url,
        auth_credentials=Auth.api_key(weaviate_api_key),
    )
    return client


def load_courses(in_path: Path):
    if not in_path.exists():
        raise FileNotFoundError(f"Input file not found: {in_path}")
    with in_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise RuntimeError("Expected a list of course objects in JSON input")
    return data


def main():
    input_path = Path(os.getenv("MYPLAN_COURSES_IN", "temp/myplan_courses.json"))
    courses = load_courses(input_path)
    print(f"Loaded {len(courses)} courses from {input_path}")

    weaviate_client = connect_weaviate()
    try:
        print(f"Weaviate ready: {weaviate_client.is_ready()}")

        w_courses = weaviate_client.collections.use("Courses")

        # Ingest in batches
        batch_size = int(os.getenv("WEAVIATE_BATCH_SIZE", "100"))
        success_count = 0

        with w_courses.batch.fixed_size(batch_size=batch_size) as batch:
            print(f"Ingesting {len(courses)} courses in batches of {batch_size} ...")
            for c in courses:
                batch.add_object(
                    {
                        "courseCode": c.get("courseCode", ""),
                        "courseTitle": c.get("courseTitle", ""),
                        "description": c.get("description", ""),
                    }
                )
                success_count += 1
                if batch.number_errors > 10:
                    print("Batch import stopped due to excessive errors.")
                    break

        failed_objects = w_courses.batch.failed_objects
        if failed_objects:
            print(f"[red]Number of failed imports: {len(failed_objects)}[/red]")
            print(f"First failed object: {failed_objects[0]}")
        print(f"Completed ingestion. Attempted: {success_count}")

    finally:
        weaviate_client.close()


if __name__ == "__main__":
    main()
