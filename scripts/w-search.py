from rich import print
import os
import json
import argparse

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
    # openai_key = get_env("OPENAI_API_KEY")
    cohere_key = os.getenv("COHERE_API_KEY")

    client = weaviate.connect_to_weaviate_cloud(
        cluster_url=weaviate_url,
        auth_credentials=Auth.api_key(weaviate_api_key),
        headers={
            # "X-OpenAI-Api-Key": openai_key,
            "X-Cohere-Api-Key": cohere_key,
        },
    )
    return client


def parse_args():
    parser = argparse.ArgumentParser(description="Semantic search against Weaviate")
    parser.add_argument("query", help="Search query text")
    parser.add_argument(
        "-l", "--limit", type=int, default=10, help="Number of results to return"
    )
    parser.add_argument(
        "-g",
        "--grouped-task",
        default=None,
        help="Optional generative grouped task prompt",
    )
    parser.add_argument(
        "-c", "--collection", default="Courses", help="Weaviate collection name"
    )
    return parser.parse_args()


def main():
    args = parse_args()

    weaviate_client = connect_weaviate()
    try:
        print(f"Weaviate ready: {weaviate_client.is_ready()}")

        w_collection = weaviate_client.collections.use(args.collection)

        response = w_collection.generate.near_text(
            query=args.query,
            limit=args.limit,
            grouped_task="Recommend courses based on the query",
        )
        print(response.generative.text)

        # if args.grouped_task:
        # else:
        #     results = w_collection.query.near_text(args.query, limit=args.limit)
        #     for obj in results.objects:
        #         print(json.dumps(obj.properties, indent=2))

    finally:
        weaviate_client.close()


if __name__ == "__main__":
    main()
