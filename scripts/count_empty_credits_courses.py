#!/usr/bin/env python3

from python.convex_client import get_convex_client

def count_empty_credits_courses():
    """Count courses with undefined allCredits fields using myplan:listEmptyAllCreditsCourses"""
    client = get_convex_client()

    total_count = 0
    batch_size = 500
    cursor = None

    print("Counting courses with undefined allCredits...")

    while True:
        # Prepare query arguments
        args = {"limit": batch_size}
        if cursor:
            args["cursor"] = cursor

        # Query the Convex function
        result = client.query("myplan:listEmptyAllCreditsCourses", args)

        # Process the result
        page_count = len(result["page"])
        total_count += page_count

        print(f"Fetched batch with {page_count} courses (total so far: {total_count})")

        # Check if we're done
        if result.get("isDone", True):
            break

        cursor = result.get("continueCursor")
        if not cursor:
            break

    print(f"\nTotal courses with undefined allCredits: {total_count}")
    return total_count

if __name__ == "__main__":
    count_empty_credits_courses()
