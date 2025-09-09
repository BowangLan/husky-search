from rich import print
import os
import time

from dotenv import load_dotenv

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


def main():
    weaviate_client = connect_weaviate()
    try:
        print(f"Weaviate ready: {weaviate_client.is_ready()}")

        # delete existing collection (if present)
        try:
            weaviate_client.collections.delete("Courses")
            print("Deleted Courses collection")
        except Exception as e:
            print(f"[yellow]Delete skipped or failed: {e}[/yellow]")

        # small pause to let schema changes propagate
        time.sleep(3)

        # recreate collection matching scripts/w.py configuration
        w_courses = weaviate_client.collections.create(
            name="Courses",
            vector_config=Configure.Vectors.text2vec_weaviate(),
            generative_config=Configure.Generative.cohere(),
        )
        print(f"Created Courses collection: {w_courses.name}")

        # small pause to ensure readiness
        time.sleep(3)

    finally:
        weaviate_client.close()


if __name__ == "__main__":
    main()
