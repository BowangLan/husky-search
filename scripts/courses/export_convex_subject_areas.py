#!/usr/bin/env python3
"""
Export all subject areas from Convex myplanSubjects table to a local JSON file.
This script fetches all subject areas with their codes and titles.
"""

import json
from pathlib import Path
from typing import List, Dict
import time
import argparse

# Add parent directory to path to import convex module
from python.convex_client import get_convex_client


def fetch_all_subject_areas() -> List[Dict[str, str]]:
    """
    Fetch all subject areas from Convex myplanSubjects table
    """
    print("Connecting to Convex...")

    try:
        convex_client = get_convex_client()
        all_subject_areas = []
        cursor = None
        page_num = 1

        print("Fetching subject areas from myplanSubjects table...")

        while True:
            payload = {"limit": 1000}
            if cursor:
                payload["cursor"] = cursor

            print(f"  Fetching page {page_num}...")
            result = convex_client.query("myplan1/subjectAreas:listShort", payload)

            if not isinstance(result, dict):
                raise RuntimeError(
                    "Unexpected response shape from myplan1/subjectAreas:listShort"
                )

            data = result.get("data", [])
            is_done = result.get("isDone", True)
            cursor = result.get("continueCursor")

            # Add subject areas from the data
            page_count = 0
            for item in data:
                if isinstance(item, dict) and "code" in item and "title" in item:
                    all_subject_areas.append(
                        {"code": item["code"], "title": item["title"]}
                    )
                    page_count += 1

            print(f"    Added {page_count} subject areas from page {page_num}")
            page_num += 1

            if is_done:
                break

        print(f"✅ Successfully fetched {len(all_subject_areas)} subject areas")
        return all_subject_areas

    except Exception as e:
        print(f"❌ Error fetching subject areas: {e}")
        raise


def save_subject_areas_to_file(
    subject_areas: List[Dict[str, str]], output_file: Path, compressed: bool = False
) -> None:
    """
    Save subject areas to a JSON file
    """
    print(f"Saving subject areas to {output_file}...")

    # Create output directory if it doesn't exist
    output_file.parent.mkdir(parents=True, exist_ok=True)

    try:
        # Sort by code for consistent output
        subject_areas_sorted = sorted(subject_areas, key=lambda x: x["code"])

        if compressed:
            # Convert to compressed string format: "CODE_TITLE"
            compressed_data = [f"{area['code']}_{area['title']}" for area in subject_areas_sorted]
            data_to_save = compressed_data
        else:
            # Keep original format
            data_to_save = subject_areas_sorted

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data_to_save, f, ensure_ascii=False, indent=None if compressed else 2)

        print(f"✅ Saved {len(subject_areas_sorted)} subject areas to {output_file}")

        # Print some statistics
        print(f"\nStatistics:")
        print(f"  Total subject areas: {len(subject_areas_sorted)}")
        print(f"  File size: {output_file.stat().st_size:,} bytes")
        print(f"  Format: {'Compressed strings' if compressed else 'Full objects'}")

        # Show sample subject areas
        print(f"\nSample subject areas:")
        if compressed:
            for i, item in enumerate(data_to_save[:10]):
                print(f"  {i + 1:2d}. {item}")
        else:
            for i, area in enumerate(subject_areas_sorted[:10]):
                print(f"  {i + 1:2d}. {area['code']}: {area['title']}")

        if len(subject_areas_sorted) > 10:
            print(f"  ... and {len(subject_areas_sorted) - 10} more")

    except Exception as e:
        print(f"❌ Error saving subject areas: {e}")
        raise


def analyze_subject_areas(subject_areas: List[Dict[str, str]]) -> None:
    """
    Analyze the subject areas and print statistics
    """
    print(f"\n📊 Subject Area Analysis:")

    # Analyze code lengths
    code_lengths = {}
    for area in subject_areas:
        code_len = len(area["code"])
        code_lengths[code_len] = code_lengths.get(code_len, 0) + 1

    print(f"  Code length distribution:")
    for length in sorted(code_lengths.keys()):
        count = code_lengths[length]
        percentage = (count / len(subject_areas)) * 100
        print(f"    {length} chars: {count} areas ({percentage:.1f}%)")

    # Analyze title lengths
    title_lengths = [len(area["title"]) for area in subject_areas]
    avg_title_length = sum(title_lengths) / len(title_lengths)
    min_title_length = min(title_lengths)
    max_title_length = max(title_lengths)

    print(f"  Title length statistics:")
    print(f"    Average: {avg_title_length:.1f} characters")
    print(f"    Min: {min_title_length} characters")
    print(f"    Max: {max_title_length} characters")

    # Find longest and shortest titles
    longest_title = max(subject_areas, key=lambda x: len(x["title"]))
    shortest_title = min(subject_areas, key=lambda x: len(x["title"]))

    print(f"  Longest title: {longest_title['code']} - {longest_title['title']}")
    print(f"  Shortest title: {shortest_title['code']} - {shortest_title['title']}")


def main():
    parser = argparse.ArgumentParser(
        description="Export all subject areas from Convex myplanSubjects table"
    )
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default="temp/convex_subject_areas.json",
        help="Output file path (default: temp/convex_subject_areas.json)",
    )
    parser.add_argument(
        "--analyze", action="store_true", help="Show detailed analysis of subject areas"
    )
    parser.add_argument(
        "--compressed", action="store_true",
        help="Export as compressed strings in format 'CODE_TITLE' instead of objects"
    )

    args = parser.parse_args()

    print("=== Convex Subject Areas Exporter ===\n")

    output_file = Path(args.output)

    try:
        # Fetch all subject areas from Convex
        subject_areas = fetch_all_subject_areas()

        # Save to file
        save_subject_areas_to_file(subject_areas, output_file, args.compressed)

        # Show analysis if requested
        if args.analyze:
            analyze_subject_areas(subject_areas)

        print(f"\n✅ Export completed successfully!")
        print(f"   Subject areas saved to: {output_file}")

    except Exception as e:
        print(f"\n❌ Export failed: {e}")
        exit(1)


if __name__ == "__main__":
    main()
