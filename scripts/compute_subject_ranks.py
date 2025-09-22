#!/usr/bin/env python3
"""
Script to compute subject area seat count rankings and update Convex database.

This script:
1. Fetches all courses from Convex iteratively
2. Calculates total seat counts for each subject area
3. Ranks subject areas by total seat count
4. Updates the seatCountRank field in myplanSubjects table
"""

import sys
import os
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple

# Add parent directory to path to import convex_client
sys.path.append(str(Path(__file__).parent.parent))

from python.convex_client import get_convex_client, fetch_all_courses_paginated

def fetch_all_courses() -> List[Dict]:
    """
    Fetch all courses from Convex, handling pagination to avoid memory limits.
    """
    print("Fetching courses from Convex...")

    convex_client = get_convex_client()
    all_courses = fetch_all_courses_paginated(convex_client, batch_size=200)

    print(f"Total courses fetched: {len(all_courses)}")
    return all_courses

def calculate_subject_rankings(courses: List[Dict]) -> List[Tuple[str, int, int]]:
    """
    Calculate seat count rankings for each subject area.

    Returns:
        List of tuples: (subject_code, total_seat_count, rank)
    """
    print("Calculating subject area seat counts...")

    subject_seat_counts = defaultdict(int)

    for course in courses:
        subject_area = course.get("subjectArea")
        if not subject_area:
            continue

        # Get current term data
        current_term_data = course.get("currentTermData", [])
        if not current_term_data:
            continue

        # Calculate max enrollment for this course across all terms
        max_enrollment = 0
        for term_data in current_term_data:
            enroll_max = term_data.get("enrollMax", 0)
            max_enrollment = max(max_enrollment, enroll_max)

        subject_seat_counts[subject_area] += max_enrollment

    # Sort by seat count (descending) and assign ranks
    sorted_subjects = sorted(
        subject_seat_counts.items(),
        key=lambda x: x[1],
        reverse=True
    )

    rankings = []
    for rank, (subject_code, seat_count) in enumerate(sorted_subjects, 1):
        rankings.append((subject_code, seat_count, rank))
        print(f"Rank {rank}: {subject_code} - {seat_count} seats")

    return rankings

def update_subject_ranks(rankings: List[Tuple[str, int, int]]) -> None:
    """
    Update the seatCountRank field for each subject in Convex.
    """
    print("Updating subject rankings in Convex...")

    convex_client = get_convex_client()

    # Batch updates for efficiency
    batch_data = []
    for subject_code, _, rank in rankings:  # seat_count not needed for update
        batch_data.append({
            "code": subject_code,
            "data": {
                "seatCountRank": rank
            }
        })

    try:
        result = convex_client.mutation("myplan1/subjectAreas:updateByCodeBatch", {
            "data": batch_data
        })

        if result and result.get("success"):
            print(f"Successfully updated rankings for {len(batch_data)} subjects")
        else:
            print(f"Update completed but got unexpected result: {result}")

    except Exception as e:
        print(f"Error updating rankings: {e}")
        return

def main():
    """
    Main function to compute and update subject area rankings.
    """
    print("Starting subject area ranking computation...")

    try:
        # Step 1: Fetch all courses
        courses = fetch_all_courses()

        if not courses:
            print("No courses found. Exiting.")
            return

        # Step 2: Calculate rankings
        rankings = calculate_subject_rankings(courses)

        if not rankings:
            print("No rankings calculated. Exiting.")
            return

        # Step 3: Update Convex database
        update_subject_ranks(rankings)

        print("Subject area ranking computation completed successfully!")

    except Exception as e:
        print(f"Error during execution: {e}")
        raise

if __name__ == "__main__":
    main()