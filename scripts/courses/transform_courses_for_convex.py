import json
from pathlib import Path
from typing import Dict, Any, List, Set
import time
import sys
import os
import argparse

# Add parent directory to path to import convex module
from python.convex_client import get_convex_client


def transform_course_to_convex_schema(course: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform a scraped course to match myplanCourses Convex table schema
    """
    # Parse quarters into array
    terms_offered = []
    if course.get("quarters"):
        # Split by common separators and clean up
        quarters_str = course["quarters"].replace(",", " ").replace(";", " ")
        terms_offered = [q.strip().upper() for q in quarters_str.split() if q.strip()]

    # Handle credits - extract numeric part if possible
    credit = course.get("credits", "")

    # Transform myplanCode by inserting space between subject and number
    # e.g., "EDSPE601" -> "EDSPE 601"
    myplan_code = course.get("myplanCode", "")
    formatted_course_code = myplan_code
    if myplan_code and len(myplan_code) >= 4:
        # Split at the last 3 characters and insert space
        subject_part = myplan_code[:-3]
        number_part = myplan_code[-3:]
        formatted_course_code = f"{subject_part} {number_part}"

    # Transform to Convex schema
    convex_course = {
        # Required fields from myplanCourseFullFields
        "courseCode": formatted_course_code,  # formatted myplan course code with space
        "courseId": myplan_code,  # original myplan code without space
        "description": course.get("description", ""),
        "title": course.get("title", ""),
        "credit": credit,
        "campus": "seattle",  # default for UW
        "subjectArea": course.get("subject", ""),
        "courseNumber": course.get("number", ""),
        "genEdReqs": [],  # empty array as default
        "termsOffered": terms_offered,
        # Stats fields (default values)
        "statsEnrollPercent": 0,
        "statsEnrollMax": 0,
        # Optional fields
        "currentTermData": [],
        "pastTermData": [],
        # New fields for catalog integration
        "uwCourseCode": course.get("uwCourseCode", ""),  # UW catalog course code
        "url": course.get("myplanUrl", "")
        if course.get("myplanCode")
        else None,  # myplan URL for detail scraping
    }

    return convex_course


def load_cached_course_codes() -> Set[str]:
    """
    Load course codes from cache file if it exists
    """
    cache_file = Path("temp/convex_course_codes_cache.json")
    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                cache_data = json.load(f)
                course_codes = set(cache_data.get("course_codes", []))
                cached_at = cache_data.get("cached_at", "unknown")
                print(
                    f"Loaded {len(course_codes)} cached course codes (cached at: {cached_at})"
                )
                return course_codes
        except Exception as e:
            print(f"Error loading cache: {e}")

    return set()


def save_course_codes_cache(course_codes: Set[str]) -> None:
    """
    Save course codes to cache file
    """
    cache_file = Path("temp/convex_course_codes_cache.json")

    # Create temp directory if it doesn't exist
    cache_file.parent.mkdir(parents=True, exist_ok=True)

    try:
        cache_data = {
            "course_codes": list(course_codes),
            "cached_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_count": len(course_codes),
        }

        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(cache_data, f, indent=2, ensure_ascii=False)

        print(f"Cached {len(course_codes)} course codes to {cache_file}")

    except Exception as e:
        print(f"Error saving cache: {e}")


def fetch_existing_course_codes(
    use_cache: bool = True, force_refresh: bool = False
) -> Set[str]:
    """
    Fetch all existing course codes from Convex myplanCourses table with caching
    """
    # Try to load from cache first
    if use_cache and not force_refresh:
        cached_codes = load_cached_course_codes()
        if cached_codes:
            return cached_codes

    print("Fetching existing course codes from Convex...")

    try:
        convex_client = get_convex_client()
        existing_codes = set()
        cursor = None
        page_num = 1

        while True:
            payload = {"limit": 1000}
            if cursor:
                payload["cursor"] = cursor

            print(f"  Fetching page {page_num}...")
            result = convex_client.query("myplan:listCourseCodes", payload)

            if not isinstance(result, dict):
                raise RuntimeError(
                    "Unexpected response shape from myplan:listCourseCodes"
                )

            data = result.get("data", [])
            is_done = result.get("isDone", True)
            cursor = result.get("continueCursor")

            # Extract course codes from the data
            for item in data:
                if isinstance(item, dict) and "courseCode" in item:
                    existing_codes.add(item["courseCode"])
                elif isinstance(item, str):
                    existing_codes.add(item)

            print(f"    Found {len(data)} courses on page {page_num}")
            page_num += 1

            if is_done:
                break

        print(f"Total existing course codes: {len(existing_codes)}")

        # Save to cache
        if use_cache:
            save_course_codes_cache(existing_codes)

        return existing_codes

    except Exception as e:
        print(f"Error fetching existing course codes: {e}")
        print("Continuing without exclusion filter...")
        return set()


def transform_courses_json(use_cache: bool = True, force_refresh: bool = False) -> None:
    """
    Transform the scraped UW courses JSON file to Convex schema format
    """
    input_file = Path("temp/all_uw_courses.json")
    output_file = Path("temp/convex_courses.json")

    if not input_file.exists():
        print(f"Error: Input file {input_file} not found!")
        print("Please run the scraper first to generate the UW courses JSON file.")
        return

    print(f"Reading courses from {input_file}...")

    # Fetch existing course codes from Convex
    existing_course_codes = fetch_existing_course_codes(
        use_cache=use_cache, force_refresh=force_refresh
    )

    try:
        with open(input_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        courses = data.get("courses", [])
        print(f"Found {len(courses)} courses to transform")

        # Transform each course and filter out existing ones
        transformed_courses = []
        skipped_no_myplan = 0
        skipped_already_exists = 0

        for course in courses:
            # Skip courses without myplan codes
            if not course.get("myplanCode"):
                skipped_no_myplan += 1
                continue

            # Check if course already exists using formatted course code (with space)
            myplan_code = course["myplanCode"]
            formatted_course_code = myplan_code
            if myplan_code and len(myplan_code) >= 4:
                subject_part = myplan_code[:-3]
                number_part = myplan_code[-3:]
                formatted_course_code = f"{subject_part} {number_part}"

            if formatted_course_code in existing_course_codes:
                skipped_already_exists += 1
                continue

            # Transform and add new course
            transformed_course = transform_course_to_convex_schema(course)
            transformed_courses.append(transformed_course)

        # Print transformation statistics
        print(f"\nTransformation Summary:")
        print(f"- Input courses: {len(courses)}")
        print(f"- Transformed (new): {len(transformed_courses)}")
        print(f"- Skipped (no myplan code): {skipped_no_myplan}")
        print(f"- Skipped (already exists): {skipped_already_exists}")
        print(f"- Success rate: {len(transformed_courses) / len(courses) * 100:.1f}%")

        # Save as simple array (no metadata wrapper)
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(transformed_courses, f, indent=2, ensure_ascii=False)

        print(f"Saved transformed courses to {output_file}")

        # Print sample for verification
        if transformed_courses:
            print("\nSample transformed course:")
            sample = transformed_courses[0]
            print(f"  UW Code: {sample['uwCourseCode']}")
            print(f"  MyPlan Code: {sample['courseCode']}")
            print(f"  Title: {sample['title'][:50]}...")
            print(f"  Subject: {sample['subjectArea']}")
            print(f"  Number: {sample['courseNumber']}")
            print(f"  URL: {sample['url'][:50] if sample['url'] else 'None'}...")

        # Print statistics
        print(f"\nTransformation Summary:")
        print(f"- Input courses: {len(courses)}")
        print(f"- Transformed: {len(transformed_courses)}")
        print(f"- Skipped (no myplan code): {skipped_no_myplan}")
        print(f"- Success rate: {len(transformed_courses) / len(courses) * 100:.1f}%")

        # Analyze subjects of new courses
        if transformed_courses:
            subjects = {}
            for course in transformed_courses:
                subject = course["subjectArea"]
                subjects[subject] = subjects.get(subject, 0) + 1

            print(f"\nTop 10 subjects by course count (new courses only):")
            for subject, count in sorted(
                subjects.items(), key=lambda x: x[1], reverse=True
            )[:10]:
                print(f"  {subject}: {count} courses")

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON file: {e}")
    except Exception as e:
        print(f"Error transforming courses: {e}")


def validate_transformed_data() -> None:
    """
    Validate the transformed data against expected schema
    """
    output_file = Path("temp/convex_courses.json")

    if not output_file.exists():
        print(f"Error: Output file {output_file} not found!")
        return

    print(f"Validating transformed data in {output_file}...")

    try:
        with open(output_file, "r", encoding="utf-8") as f:
            courses = json.load(f)  # Now it's directly an array

        # Required fields check
        required_fields = [
            "courseCode",
            "courseId",
            "description",
            "title",
            "credit",
            "campus",
            "subjectArea",
            "courseNumber",
            "genEdReqs",
            "termsOffered",
            "statsEnrollPercent",
            "statsEnrollMax",
            "uwCourseCode",
        ]

        validation_errors = []

        for i, course in enumerate(courses[:100]):  # Check first 100 courses
            for field in required_fields:
                if field not in course:
                    validation_errors.append(f"Course {i}: Missing field '{field}'")

        if validation_errors:
            print(f"Validation errors found:")
            for error in validation_errors[:10]:  # Show first 10 errors
                print(f"  {error}")
        else:
            print("✅ All required fields present in sample courses")

        # Check data types
        type_checks = [
            ("genEdReqs", list),
            ("termsOffered", list),
            ("statsEnrollPercent", (int, float)),
            ("statsEnrollMax", (int, float)),
        ]

        for i, course in enumerate(courses[:10]):  # Check first 10 courses
            for field, expected_type in type_checks:
                if not isinstance(course.get(field), expected_type):
                    print(f"  Course {i}: Field '{field}' has wrong type")

        print(f"✅ Validation complete for {len(courses)} courses")

    except Exception as e:
        print(f"Error validating data: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Transform UW courses to Convex schema"
    )
    parser.add_argument(
        "--no-cache", action="store_true", help="Don't use cached course codes"
    )
    parser.add_argument(
        "--refresh-cache", action="store_true", help="Force refresh cache from Convex"
    )
    args = parser.parse_args()

    print("=== UW Courses to Convex Schema Transformer ===\n")

    use_cache = not args.no_cache
    force_refresh = args.refresh_cache

    if args.refresh_cache:
        print("🔄 Force refreshing cache from Convex...")
    elif args.no_cache:
        print("⚠️  Cache disabled - will fetch fresh from Convex")
    else:
        print("📋 Using cache if available...")

    # Transform the data
    transform_courses_json(use_cache=use_cache, force_refresh=force_refresh)

    print("\n" + "=" * 50 + "\n")

    # Validate the result
    validate_transformed_data()

    print("\n=== Transformation Complete ===")
    print(
        "Next step: Import temp/convex_courses.json into Convex using your import function"
    )

    cache_file = Path("temp/convex_course_codes_cache.json")
    if cache_file.exists():
        print(f"\n💡 Cache file: {cache_file}")
        print("   Use --refresh-cache to update cache with latest data")
        print("   Use --no-cache to ignore cache completely")
