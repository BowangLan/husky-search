from rich import print
import os
import time

from dotenv import load_dotenv

from convex import ConvexClient

import weaviate
from weaviate.classes.config import Configure
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


def fetch_courses_for_weaviate(convex_client):
    return convex_client.query("myplan:getCoursesForWeaviateFull", {})


def main():
    convex_url = get_env("CONVEX_URL")
    convex_client = ConvexClient(convex_url)

    weaviate_client = connect_weaviate()
    try:
        print(f"Weaviate ready: {weaviate_client.is_ready()}")

        # delete
        weaviate_client.collections.delete("Courses")
        print("Deleted Courses collection")

        # wait for 3 seconds
        time.sleep(3)

        w_courses = weaviate_client.collections.create(
            name="Courses",
            vector_config=Configure.Vectors.text2vec_weaviate(),  # Configure the Weaviate Embeddings integration
            generative_config=Configure.Generative.cohere(),  # Configure the Cohere generative AI integration
        )
        print(f"Created Courses collection: {w_courses.name}")

        # wait for 3 seconds
        time.sleep(3)

        # w_courses = weaviate_client.collections.use("Courses")

        # ingest courses
        # print("Fetching courses...")
        # convex_courses = fetch_courses_for_weaviate(convex_client)
        # try:
        #     count = len(convex_courses["data"])

        #     print(convex_courses["data"])
        # except Exception:
        #     count = "unknown"
        # print(f"Fetched {count} courses for Weaviate ingestion")
        # with w_courses.batch.fixed_size(batch_size=100) as batch:
        #     print(f"Ingesting {len(convex_courses['data'])} courses...")
        #     for d in convex_courses["data"]:
        #         batch.add_object(
        #             {
        #                 "courseCode": d["courseCode"],
        #                 "courseTitle": d["courseTitle"],
        #                 "description": d["description"],
        #             }
        #         )
        #         if batch.number_errors > 10:
        #             print("Batch import stopped due to excessive errors.")
        #             break

        # # print(f"Ingested {batch.number_objects} courses")
        # failed_objects = w_courses.batch.failed_objects
        # if failed_objects:
        #     print(f"Number of failed imports: {len(failed_objects)}")
        #     print(f"First failed object: {failed_objects[0]}")
        # print("Continue cursor: ", convex_courses["continueCursor"])

    finally:
        weaviate_client.close()


if __name__ == "__main__":
    main()
