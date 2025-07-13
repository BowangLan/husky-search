import json
import os
from dotenv import load_dotenv
import psycopg
from datetime import datetime
from rich import print
from pathlib import Path
from typing import List, Dict, Any, Callable, Optional
from abc import ABC, abstractmethod

# Load environment variables
load_dotenv()

# Database connection parameters
DATABASE_URL = os.getenv("DATABASE_URL")


class DataSource(ABC):
    """Abstract base class for data sources"""

    @abstractmethod
    def load_data(self) -> List[Dict[str, Any]]:
        """Load and return course data"""
        pass


class LocalJsonDataSource(DataSource):
    """Data source for local JSON files"""

    def __init__(self, file_path: str, data_transformer: Optional[Callable] = None):
        self.file_path = file_path
        self.data_transformer = data_transformer

    def load_data(self) -> List[Dict[str, Any]]:
        with open(self.file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if self.data_transformer:
            return self.data_transformer(data)
        return data


class RemoteDataSource(DataSource):
    """Data source for remote APIs (placeholder for future implementation)"""

    def __init__(self, url: str, headers: Optional[Dict] = None):
        self.url = url
        self.headers = headers or {}

    def load_data(self) -> List[Dict[str, Any]]:
        # TODO: Implement remote data fetching
        raise NotImplementedError("Remote data source not yet implemented")


class CourseUpdater:
    """Generic course updater that handles batch updates with progress tracking"""

    def __init__(
        self,
        data_source: DataSource,
        progress_file: str = "temp/updated-courses.json",
        batch_size: int = 100,
        dry_run: bool = False,
    ):
        self.data_source = data_source
        self.progress_file = progress_file
        self.batch_size = batch_size
        self.dry_run = dry_run
        self.updated_course_codes = self._load_progress()

    def _load_progress(self) -> set:
        """Load the set of already updated course codes"""
        if not Path(self.progress_file).exists():
            with open(self.progress_file, "w", encoding="utf-8") as f:
                json.dump([], f)
            return set()

        with open(self.progress_file, "r", encoding="utf-8") as f:
            return set(json.load(f))

    def _save_progress(self):
        """Save the updated course codes to progress file"""
        with open(self.progress_file, "w", encoding="utf-8") as f:
            json.dump(list(self.updated_course_codes), f)

    def update_courses(
        self,
        update_function: Callable,
        data_transformer: Callable[[Dict], Dict],
        field_name: str = "unknown",
    ):
        """
        Update courses using the provided update function and data transformer

        Args:
            update_function: Function that takes cursor and courses list
            data_transformer: Function that transforms raw course data to update format
            field_name: Name of the field being updated (for logging)
        """
        # Load course data
        courses = self.data_source.load_data()
        total_courses = len(courses)
        existing_count = len(self.updated_course_codes)

        # Filter out already updated courses
        courses = [
            course
            for course in courses
            if course.get("code") not in self.updated_course_codes
        ]

        if not courses:
            print(f"No new courses to update for {field_name}")
            return

        if self.dry_run:
            print(f"=== DRY RUN MODE: Previewing {field_name} updates ===")
            print(f"Total courses to process: {len(courses)}")
            print(f"Sample of transformed data:")
            print("-" * 50)

            # Show sample of transformed data
            sample_size = min(5, len(courses))
            for i, course in enumerate(courses[:sample_size]):
                transformed = data_transformer(course)
                print(
                    f"Original: {course.get('code', 'N/A')} - {course.get('name', 'N/A')}"
                )
                print(f"Transformed: {transformed}")
                print()

            if len(courses) > sample_size:
                print(f"... and {len(courses) - sample_size} more courses")

            print(f"Would update {len(courses)} courses for {field_name}")
            return

        # Connect to database
        conn = psycopg.connect(DATABASE_URL)
        cursor = conn.cursor()

        try:
            for i in range(0, len(courses), self.batch_size):
                batch = courses[i : i + self.batch_size]

                # Transform data for update
                transformed_batch = [data_transformer(course) for course in batch]

                # Update courses
                update_function(cursor, transformed_batch)
                conn.commit()

                # Update progress tracking
                for course in batch:
                    self.updated_course_codes.add(course["code"])

                # Save progress
                self._save_progress()

                # Calculate and display progress
                shifted_i = i + existing_count
                percentage = min(
                    (shifted_i + self.batch_size) / total_courses * 100, 100
                )
                print(
                    f"Updated {shifted_i + len(batch)} / {total_courses} "
                    f"({percentage:.2f}%) courses for {field_name}"
                )

            print(f"Successfully updated {field_name}")

        except Exception as e:
            conn.rollback()
            print(f"Error updating {field_name}: {str(e)}")
            raise

        finally:
            cursor.close()
            conn.close()


# Specific update functions for different fields
def update_courses_title(cursor, courses: List[Dict[str, Any]]):
    """Update course titles"""
    sql = """
        UPDATE uw_courses 
        SET title = %s, 
        subject = %s
        WHERE code = %s
    """
    cursor.executemany(
        sql,
        [(course["title"], course["subject"], course["code"]) for course in courses],
    )


def update_courses_description(cursor, courses: List[Dict[str, Any]]):
    """Update course descriptions"""
    sql = """
        UPDATE uw_courses 
        SET description = %s
        WHERE code = %s
    """
    cursor.executemany(
        sql,
        [(course["description"], course["code"]) for course in courses],
    )


def update_courses_credits(cursor, courses: List[Dict[str, Any]]):
    """Update course credits"""
    sql = """
        UPDATE uw_courses 
        SET credits = %s
        WHERE code = %s
    """
    cursor.executemany(
        sql,
        [(course["credits"], course["code"]) for course in courses],
    )


# Data transformers
def transform_title_data(course: Dict[str, Any]) -> Dict[str, Any]:
    """Transform course data for title updates"""
    # Remove the course code prefix (e.g. "A A 101 ") to get just the title
    title_parts = course["name"].split(f" {course['number']} ", 1)
    title = title_parts[1] if len(title_parts) > 1 else course["name"]

    return {
        "code": course["code"],
        "title": title.split(" (")[0].strip(),
        "old_title": course["name"],
        "subject": title_parts[0].strip(),
        # "updated_code":
    }


def transform_description_data(course: Dict[str, Any]) -> Dict[str, Any]:
    """Transform course data for description updates"""
    return {"code": course["code"], "description": course.get("description", "")}


def transform_credits_data(course: Dict[str, Any]) -> Dict[str, Any]:
    """Transform course data for credits updates"""
    return {"code": course["code"], "credits": course.get("credits", 0)}


def flatten_courses(data):
    """Flatten department data into individual courses"""
    courses = []
    for department in data:
        if "courses" in department:
            for course in department["courses"]:
                courses.append(
                    {
                        **course,
                        "department": department["href"].split(".")[0],
                    }
                )
    return courses


def main():
    """Example usage of the CourseUpdater"""
    # Create data source with transformer
    data_source = LocalJsonDataSource(
        file_path="temp/uw-courses.json", data_transformer=flatten_courses
    )

    # Create updater - change dry_run=True to preview, dry_run=False to actually update
    dry_run = False  # Set to False to perform actual database updates
    updater = CourseUpdater(
        data_source=data_source,
        progress_file="temp/uw-courses-title-updated.json",
        batch_size=500,
        dry_run=dry_run,
    )

    # Update course titles
    updater.update_courses(
        update_function=update_courses_title,
        data_transformer=transform_title_data,
        field_name="titles and subjects",
    )


if __name__ == "__main__":
    main()
