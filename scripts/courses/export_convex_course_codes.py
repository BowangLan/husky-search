#!/usr/bin/env python3
"""
Export all course codes from Convex myplanCourses table to a local JSON file.
This script fetches all course codes and saves them as a simple string array.
"""

import json
from pathlib import Path
from typing import Set
import time
import argparse

# Add parent directory to path to import convex module
from python.convex_client import get_convex_client


def fetch_all_course_codes() -> Set[str]:
    """
    Fetch all course codes from Convex myplanCourses table
    """
    print("Connecting to Convex...")

    try:
        convex_client = get_convex_client()
        all_course_codes = set()
        cursor = None
        page_num = 1

        print("Fetching course codes from myplanCourses table...")

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
            page_codes = 0
            for item in data:
                if isinstance(item, dict) and "courseCode" in item:
                    all_course_codes.add(item["courseCode"])
                    page_codes += 1
                elif isinstance(item, str):
                    all_course_codes.add(item)
                    page_codes += 1

            print(f"    Added {page_codes} course codes from page {page_num}")
            page_num += 1

            if is_done:
                break

        print(f"✅ Successfully fetched {len(all_course_codes)} unique course codes")
        return all_course_codes

    except Exception as e:
        print(f"❌ Error fetching course codes: {e}")
        raise


def save_course_codes_to_file(course_codes: Set[str], output_file: Path) -> None:
    """
    Save course codes to a JSON file as a simple string array
    """
    print(f"Saving course codes to {output_file}...")

    # Create output directory if it doesn't exist
    output_file.parent.mkdir(parents=True, exist_ok=True)

    try:
        # Convert set to sorted list for consistent output
        course_codes_list = sorted(list(course_codes))

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(course_codes_list, f, ensure_ascii=False)

        print(f"✅ Saved {len(course_codes_list)} course codes to {output_file}")

        # Print some statistics
        print(f"\nStatistics:")
        print(f"  Total course codes: {len(course_codes_list)}")
        print(f"  File size: {output_file.stat().st_size:,} bytes")

        # Show sample course codes
        print(f"\nSample course codes:")
        for i, code in enumerate(course_codes_list[:10]):
            print(f"  {i + 1:2d}. {code}")
        if len(course_codes_list) > 10:
            print(f"  ... and {len(course_codes_list) - 10} more")

    except Exception as e:
        print(f"❌ Error saving course codes: {e}")
        raise


def analyze_course_codes(course_codes: Set[str]) -> None:
    """
    Analyze the course codes and print statistics
    """
    print(f"\n📊 Course Code Analysis:")

    # Analyze subject areas
    subjects = {}
    for code in course_codes:
        # Extract subject (everything before the last space and number)
        parts = code.split()
        if len(parts) >= 2:
            subject = parts[0]
            subjects[subject] = subjects.get(subject, 0) + 1

    print(f"  Total subjects: {len(subjects)}")
    print(f"  Top 10 subjects by course count:")

    for subject, count in sorted(subjects.items(), key=lambda x: x[1], reverse=True)[
        :10
    ]:
        print(f"    {subject}: {count} courses")

    # Analyze course number ranges
    course_levels = {"100-199": 0, "200-299": 0, "300-399": 0, "400-499": 0, "500+": 0}

    for code in course_codes:
        parts = code.split()
        if len(parts) >= 2:
            try:
                number = int(parts[1])
                if 100 <= number <= 199:
                    course_levels["100-199"] += 1
                elif 200 <= number <= 299:
                    course_levels["200-299"] += 1
                elif 300 <= number <= 399:
                    course_levels["300-399"] += 1
                elif 400 <= number <= 499:
                    course_levels["400-499"] += 1
                elif number >= 500:
                    course_levels["500+"] += 1
            except ValueError:
                pass  # Skip non-numeric course numbers

    print(f"  Course level distribution:")
    for level, count in course_levels.items():
        percentage = (count / len(course_codes)) * 100
        print(f"    {level}: {count} courses ({percentage:.1f}%)")


def main():
    parser = argparse.ArgumentParser(
        description="Export all course codes from Convex myplanCourses table"
    )
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default="temp/convex_course_codes.json",
        help="Output file path (default: temp/convex_course_codes.json)",
    )
    parser.add_argument(
        "--analyze", action="store_true", help="Show detailed analysis of course codes"
    )

    args = parser.parse_args()

    print("=== Convex Course Codes Exporter ===\n")

    output_file = Path(args.output)

    try:
        # Fetch all course codes from Convex
        course_codes = fetch_all_course_codes()

        # Save to file
        save_course_codes_to_file(course_codes, output_file)

        # Show analysis if requested
        if args.analyze:
            analyze_course_codes(course_codes)

        print(f"\n✅ Export completed successfully!")
        print(f"   Course codes saved to: {output_file}")

    except Exception as e:
        print(f"\n❌ Export failed: {e}")
        exit(1)


if __name__ == "__main__":
    main()
