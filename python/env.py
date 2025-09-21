from dotenv import load_dotenv
import os


load_dotenv(".env.local")
load_dotenv(".env")


def get_env(name: str) -> str:
    value = os.getenv(name)
    print(f"Getting env variable: {name} = {value}")
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value
