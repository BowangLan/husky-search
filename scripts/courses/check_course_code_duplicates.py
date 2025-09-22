#!/usr/bin/env python3
"""
DevOps script to check for course code duplications in Convex myplanCourses table.
This script identifies duplicate course codes and provides detailed analysis for cleanup.
"""

import json
from pathlib import Path
from typing import Dict, List
import time
import argparse
from collections import defaultdict

# Add parent directory to path to import convex module
from python.convex_client import get_convex_client


def fetch_all_course_entries() -> List[Dict]:
    """
    Fetch all course entries from Convex myplanCourses table
    """
    print("Connecting to Convex...")

    try:
        convex_client = get_convex_client()
        all_courses = []
        cursor = None
        page_num = 1

        print("Fetching course entries from myplanCourses table...")

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

            # Collect course entries with their IDs
            page_courses = 0
            for item in data:
                if isinstance(item, dict) and "courseCode" in item:
                    all_courses.append(item)
                    page_courses += 1

            print(f"    Added {page_courses} course entries from page {page_num}")
            page_num += 1

            if is_done:
                break

        print(f"✅ Successfully fetched {len(all_courses)} course entries")
        return all_courses

    except Exception as e:
        print(f"❌ Error fetching course entries: {e}")
        raise


def analyze_duplicates(course_entries: List[Dict]) -> Dict:
    """
    Analyze course entries to find duplicates and provide detailed information
    """
    print("\n🔍 Analyzing course code duplications...")

    # Group course entries by course code
    course_groups = defaultdict(list)
    for entry in course_entries:
        course_code = entry.get("courseCode", "").strip()
        if course_code:
            course_groups[course_code].append(entry)

    # Find duplicates
    duplicates = {
        code: entries for code, entries in course_groups.items() if len(entries) > 1
    }
    unique_courses = {
        code: entries[0] for code, entries in course_groups.items() if len(entries) == 1
    }

    analysis = {
        "total_entries": len(course_entries),
        "unique_course_codes": len(course_groups),
        "duplicate_course_codes": len(duplicates),
        "total_duplicate_entries": sum(len(entries) for entries in duplicates.values()),
        "unique_courses": len(unique_courses),
        "duplicates": duplicates,
    }

    return analysis


def print_duplicate_analysis(analysis: Dict) -> None:
    """
    Print detailed analysis of duplicate course codes
    """
    print("\n📊 Duplicate Course Code Analysis:")
    print(f"  Total entries in database: {analysis['total_entries']:,}")
    print(f"  Unique course codes: {analysis['unique_course_codes']:,}")
    print(f"  Duplicate course codes: {analysis['duplicate_course_codes']:,}")
    print(f"  Total duplicate entries: {analysis['total_duplicate_entries']:,}")
    print(f"  Courses without duplicates: {analysis['unique_courses']:,}")

    if analysis["duplicate_course_codes"] > 0:
        redundant_entries = (
            analysis["total_duplicate_entries"] - analysis["duplicate_course_codes"]
        )
        print(f"  Redundant entries that could be cleaned: {redundant_entries:,}")
        cleanup_percentage = (redundant_entries / analysis["total_entries"]) * 100
        print(f"  Database cleanup potential: {cleanup_percentage:.2f}%")
    else:
        print("  ✅ No duplicate course codes found!")


def print_duplicate_details(analysis: Dict, max_examples: int = 10) -> None:
    """
    Print detailed information about duplicate course codes
    """
    duplicates = analysis["duplicates"]

    if not duplicates:
        return

    print("\n🔍 Duplicate Course Code Details:")
    print(f"  Showing up to {max_examples} examples of duplicate course codes:\n")

    # Sort duplicates by number of occurrences (highest first)
    sorted_duplicates = sorted(
        duplicates.items(), key=lambda x: len(x[1]), reverse=True
    )

    for i, (course_code, duplicate_entries) in enumerate(
        sorted_duplicates[:max_examples]
    ):
        print(f"  {i + 1}. {course_code} ({len(duplicate_entries)} duplicates)")

        for j, entry in enumerate(duplicate_entries):
            entry_id = entry.get("_id", "unknown")

            print(f"     #{j + 1}: ID={entry_id}")
            print(f"         Course Code: {entry.get('courseCode', 'unknown')}")
        print()

    if len(sorted_duplicates) > max_examples:
        remaining = len(sorted_duplicates) - max_examples
        print(f"  ... and {remaining} more duplicate course codes")


def generate_cleanup_recommendations(analysis: Dict) -> List[str]:
    """
    Generate recommendations for cleaning up duplicate course codes
    """
    recommendations = []
    duplicates = analysis["duplicates"]

    if not duplicates:
        recommendations.append(
            "✅ No cleanup needed - no duplicate course codes found!"
        )
        return recommendations

    recommendations.append("🔧 Cleanup Recommendations:")
    recommendations.append("")

    # Calculate total redundant entries
    total_redundant = 0
    for course_code, duplicate_entries in duplicates.items():
        redundant_count = len(duplicate_entries) - 1
        total_redundant += redundant_count

    recommendations.append(
        f"1. Priority: Remove {total_redundant} redundant course entries"
    )
    recommendations.append(f"2. {len(duplicates)} course codes have duplicate entries")
    recommendations.append("")
    recommendations.append("Suggested approach:")
    recommendations.append(
        "- Keep only one entry per course code (preferably the most recent)"
    )
    recommendations.append(
        "- Consider implementing unique constraints on courseCode field"
    )
    recommendations.append("- Add data validation to prevent future duplicates")
    recommendations.append(
        "- Review duplicate IDs in the detailed report for targeted cleanup"
    )

    return recommendations


def cleanup_duplicate_entries(analysis: Dict, batch_size: int = 100, dry_run: bool = True) -> Dict:
    """
    Remove redundant duplicate entries, keeping only one entry per course code
    """
    duplicates = analysis['duplicates']

    if not duplicates:
        print("✅ No duplicates to clean up")
        return {"deleted_count": 0, "batches_processed": 0}

    print(f"\n🧹 {'DRY RUN: ' if dry_run else ''}Cleaning up duplicate course entries...")

    # Collect IDs of entries to delete (keep the first one, delete the rest)
    ids_to_delete = []
    for course_code, duplicate_entries in duplicates.items():
        # Sort by ID to ensure consistent behavior, keep first, delete rest
        sorted_entries = sorted(duplicate_entries, key=lambda x: x.get("_id", ""))
        entries_to_delete = sorted_entries[1:]  # Keep first, delete rest

        for entry in entries_to_delete:
            ids_to_delete.append(entry["_id"])

    total_to_delete = len(ids_to_delete)
    print(f"  Found {total_to_delete} redundant entries to delete")

    if dry_run:
        print("  🔍 DRY RUN MODE - No actual deletions will be performed")
        print(f"  Would delete {total_to_delete} entries in {(total_to_delete + batch_size - 1) // batch_size} batches")
        return {"deleted_count": total_to_delete, "batches_processed": 0, "dry_run": True}

    # Perform actual deletion in batches
    convex_client = get_convex_client()
    deleted_count = 0
    batches_processed = 0

    for i in range(0, total_to_delete, batch_size):
        batch_ids = ids_to_delete[i:i + batch_size]
        batch_num = batches_processed + 1

        print(f"  Processing batch {batch_num}: deleting {len(batch_ids)} entries...")

        try:
            result = convex_client.mutation("myplan1/courses:deleteByIds", {"ids": batch_ids})

            if isinstance(result, dict) and "deletedCount" in result:
                batch_deleted = result["deletedCount"]
            else:
                batch_deleted = len(batch_ids)  # Assume success if no specific count returned

            deleted_count += batch_deleted
            batches_processed += 1

            print(f"    ✅ Batch {batch_num}: deleted {batch_deleted} entries")

            # Small delay between batches to avoid overwhelming the server
            if i + batch_size < total_to_delete:
                time.sleep(0.1)

        except Exception as e:
            print(f"    ❌ Batch {batch_num} failed: {e}")
            # Continue with next batch rather than failing entirely
            batches_processed += 1

    print(f"  ✅ Cleanup completed: {deleted_count} entries deleted in {batches_processed} batches")

    return {
        "deleted_count": deleted_count,
        "batches_processed": batches_processed,
        "dry_run": False
    }


def save_duplicate_report(analysis: Dict, output_file: Path) -> None:
    """
    Save detailed duplicate analysis to a JSON file
    """
    print(f"\nSaving duplicate analysis report to {output_file}...")

    # Create output directory if it doesn't exist
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # Prepare report data
    report_data = {
        "analysis_timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "summary": {
            "total_entries": analysis["total_entries"],
            "unique_course_codes": analysis["unique_course_codes"],
            "duplicate_course_codes": analysis["duplicate_course_codes"],
            "total_duplicate_entries": analysis["total_duplicate_entries"],
            "unique_courses": analysis["unique_courses"],
        },
        "duplicates": {},
        "recommendations": generate_cleanup_recommendations(analysis),
    }

    # Include duplicate details
    for course_code, duplicate_entries in analysis["duplicates"].items():
        report_data["duplicates"][course_code] = [
            {
                "id": entry.get("_id"),
                "courseCode": entry.get("courseCode"),
            }
            for entry in duplicate_entries
        ]

    try:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)

        print(f"✅ Saved duplicate analysis report to {output_file}")
        print(f"   File size: {output_file.stat().st_size:,} bytes")

    except Exception as e:
        print(f"❌ Error saving report: {e}")
        raise


def main():
    parser = argparse.ArgumentParser(
        description="Check for course code duplications in Convex myplanCourses table and optionally clean them up"
    )
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default="temp/course_duplicate_analysis.json",
        help="Output file path for detailed report (default: temp/course_duplicate_analysis.json)",
    )
    parser.add_argument(
        "--details",
        action="store_true",
        help="Show detailed information about duplicate entries",
    )
    parser.add_argument(
        "--max-examples",
        type=int,
        default=10,
        help="Maximum number of duplicate examples to show (default: 10)",
    )
    parser.add_argument(
        "--cleanup",
        action="store_true",
        help="Enable cleanup mode to remove duplicate entries"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=True,
        help="Perform dry run of cleanup (default: true)"
    )
    parser.add_argument(
        "--no-dry-run",
        action="store_true",
        help="Disable dry run and perform actual cleanup (DANGER: will delete data)"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=100,
        help="Batch size for deletion operations (default: 100)"
    )

    args = parser.parse_args()

    print("=== Course Code Duplication Checker ===\n")

    output_file = Path(args.output)

    try:
        # Fetch all course entries from Convex
        course_entries = fetch_all_course_entries()

        # Analyze duplicates
        analysis = analyze_duplicates(course_entries)

        # Print analysis summary
        print_duplicate_analysis(analysis)

        # Show detailed duplicate information if requested
        if args.details:
            print_duplicate_details(analysis, args.max_examples)

        # Print recommendations
        recommendations = generate_cleanup_recommendations(analysis)
        print(f"\n{chr(10).join(recommendations)}")

        # Save detailed report
        save_duplicate_report(analysis, output_file)

        # Perform cleanup if requested
        cleanup_result = None
        if args.cleanup:
            # Determine if this is a dry run
            dry_run = not args.no_dry_run  # Default to dry run unless explicitly disabled

            cleanup_result = cleanup_duplicate_entries(
                analysis,
                batch_size=args.batch_size,
                dry_run=dry_run
            )

        # Final status
        if analysis["duplicate_course_codes"] > 0:
            print(
                f"\n⚠️  Found {analysis['duplicate_course_codes']} duplicate course codes!"
            )
            redundant_count = analysis['total_duplicate_entries'] - analysis['duplicate_course_codes']
            print(f"   Total redundant entries: {redundant_count}")

            if cleanup_result:
                if cleanup_result.get("dry_run"):
                    print(f"   DRY RUN: Would delete {cleanup_result['deleted_count']} entries")
                else:
                    print(f"   ✅ CLEANUP: Deleted {cleanup_result['deleted_count']} redundant entries")
                    if cleanup_result['deleted_count'] == redundant_count:
                        print("   🎉 All duplicate entries successfully cleaned up!")
                        exit(0)  # Success after cleanup
                    else:
                        print(f"   ⚠️  Partial cleanup: {redundant_count - cleanup_result['deleted_count']} entries remain")

            exit(1)  # Exit with error code for CI/CD integration
        else:
            print("\n✅ No duplicate course codes found - database is clean!")
            exit(0)

    except Exception as e:
        print(f"\n❌ Duplication check failed: {e}")
        exit(1)


if __name__ == "__main__":
    main()
