#!/usr/bin/env python3
"""
Examples of using the CourseUpdater for different field updates and data sources.
This file demonstrates the flexibility of the refactored course updater.
"""

from update_course_1 import (
    CourseUpdater, 
    LocalJsonDataSource, 
    RemoteDataSource,
    update_courses_title,
    update_courses_description,
    update_courses_credits,
    transform_title_data,
    transform_description_data,
    transform_credits_data,
    flatten_courses
)


def example_update_titles():
    """Example: Update course titles from local JSON file"""
    print("=== Updating Course Titles ===")
    
    # Create data source
    data_source = LocalJsonDataSource(
        file_path="temp/uw-courses.json",
        data_transformer=flatten_courses
    )
    
    # Create updater
    updater = CourseUpdater(
        data_source=data_source,
        progress_file="temp/uw-courses-title-updated.json",
        batch_size=100
    )
    
    # Update titles
    updater.update_courses(
        update_function=update_courses_title,
        data_transformer=transform_title_data,
        field_name="titles"
    )


def example_update_descriptions():
    """Example: Update course descriptions from local JSON file"""
    print("=== Updating Course Descriptions ===")
    
    # Create data source
    data_source = LocalJsonDataSource(
        file_path="temp/uw-courses-with-descriptions.json",
        data_transformer=flatten_courses
    )
    
    # Create updater
    updater = CourseUpdater(
        data_source=data_source,
        progress_file="temp/uw-courses-description-updated.json",
        batch_size=50  # Smaller batch size for descriptions
    )
    
    # Update descriptions
    updater.update_courses(
        update_function=update_courses_description,
        data_transformer=transform_description_data,
        field_name="descriptions"
    )


def example_update_credits():
    """Example: Update course credits from local JSON file"""
    print("=== Updating Course Credits ===")
    
    # Create data source
    data_source = LocalJsonDataSource(
        file_path="temp/uw-courses-with-credits.json",
        data_transformer=flatten_courses
    )
    
    # Create updater
    updater = CourseUpdater(
        data_source=data_source,
        progress_file="temp/uw-courses-credits-updated.json",
        batch_size=200  # Larger batch size for credits
    )
    
    # Update credits
    updater.update_courses(
        update_function=update_courses_credits,
        data_transformer=transform_credits_data,
        field_name="credits"
    )


def example_remote_data_source():
    """Example: Update from remote API (when implemented)"""
    print("=== Updating from Remote API ===")
    
    # Create remote data source
    data_source = RemoteDataSource(
        url="https://api.example.com/courses",
        headers={"Authorization": "Bearer your-token"}
    )
    
    # Create updater
    updater = CourseUpdater(
        data_source=data_source,
        progress_file="temp/remote-courses-updated.json",
        batch_size=100
    )
    
    # Update titles from remote source
    updater.update_courses(
        update_function=update_courses_title,
        data_transformer=transform_title_data,
        field_name="remote titles"
    )


def example_custom_data_transformer():
    """Example: Custom data transformer for specific data format"""
    print("=== Using Custom Data Transformer ===")
    
    def custom_title_transformer(course):
        """Custom transformer for a different data format"""
        return {
            "code": course["course_code"],
            "title": course["course_title"].upper()  # Convert to uppercase
        }
    
    # Create data source with custom transformer
    data_source = LocalJsonDataSource(
        file_path="temp/custom-format-courses.json",
        data_transformer=flatten_courses
    )
    
    # Create updater
    updater = CourseUpdater(
        data_source=data_source,
        progress_file="temp/custom-courses-updated.json",
        batch_size=100
    )
    
    # Update with custom transformer
    updater.update_courses(
        update_function=update_courses_title,
        data_transformer=custom_title_transformer,
        field_name="custom titles"
    )


def example_multiple_updates():
    """Example: Update multiple fields in sequence"""
    print("=== Updating Multiple Fields ===")
    
    # Create data source
    data_source = LocalJsonDataSource(
        file_path="temp/uw-courses-complete.json",
        data_transformer=flatten_courses
    )
    
    # Update titles
    title_updater = CourseUpdater(
        data_source=data_source,
        progress_file="temp/uw-courses-title-updated.json",
        batch_size=100
    )
    title_updater.update_courses(
        update_function=update_courses_title,
        data_transformer=transform_title_data,
        field_name="titles"
    )
    
    # Update descriptions
    desc_updater = CourseUpdater(
        data_source=data_source,
        progress_file="temp/uw-courses-description-updated.json",
        batch_size=100
    )
    desc_updater.update_courses(
        update_function=update_courses_description,
        data_transformer=transform_description_data,
        field_name="descriptions"
    )
    
    # Update credits
    credits_updater = CourseUpdater(
        data_source=data_source,
        progress_file="temp/uw-courses-credits-updated.json",
        batch_size=100
    )
    credits_updater.update_courses(
        update_function=update_courses_credits,
        data_transformer=transform_credits_data,
        field_name="credits"
    )


if __name__ == "__main__":
    # Run examples
    example_update_titles()
    print("\n" + "="*50 + "\n")
    
    # Uncomment to run other examples:
    # example_update_descriptions()
    # example_update_credits()
    # example_custom_data_transformer()
    # example_multiple_updates()
    
    # Note: Remote example requires implementation
    # example_remote_data_source() 