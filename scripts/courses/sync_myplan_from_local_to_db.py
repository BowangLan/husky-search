from scripts.myplan_local_cache import myplan_search_result_cache_controller
from scripts.db_queries import get_subject_areas_from_db, insert_myplan_courses
from scripts.db import with_db
import json
from rich import print


def check_subjects_in_db():
    # ------------------------------------------------------------
    # check if all subjects from MyPlan search results are in db's subject areas
    # ------------------------------------------------------------
    db_subject_areas = get_subject_areas_from_db()
    db_subject_areas_map = {sa["code"]: sa for sa in db_subject_areas}

    unique_subject_map = {}
    for i, key in enumerate(list(myplan_search_result_cache_controller.keys())):
        print(
            f"Processing {i} of {len(myplan_search_result_cache_controller.keys())}: {key}..."
        )
        courses = myplan_search_result_cache_controller.get(key)
        for course in courses:
            subject = course["subject"]
            if subject not in unique_subject_map:
                unique_subject_map[subject] = 1
            else:
                unique_subject_map[subject] += 1

    subjects_not_in_db = set()
    for subject, count in unique_subject_map.items():
        if subject not in db_subject_areas_map:
            subjects_not_in_db.add(subject)

    print(f"Found {len(unique_subject_map)} unique subjects from local cache")
    print(f"Found {len(db_subject_areas)} db subject areas")

    if len(subjects_not_in_db) > 0:
        print(f"⚠️ Found {len(subjects_not_in_db)} subjects not in db")
    else:
        print("✅ All subjects in db")


@with_db
def upload_courses_to_db(conn, cursor):
    # ------------------------------------------------------------
    # upload local cache courses to db
    # ------------------------------------------------------------
    total_courses = 0
    total_batches = 0
    batch_size = 200

    print("\n--------\nStarting course upload from local cache to DB...\n--------\n")

    all_course_map = {}
    count = 0
    for i, key in enumerate(list(myplan_search_result_cache_controller.keys())):
        courses = myplan_search_result_cache_controller.get(key)
        for course in courses:
            all_course_map[course["id"]] = course
            # all_course_map[f"{course['code']}-{course['termId']}"] = course
        count += len(courses)
    print(f"Found {len(all_course_map)} / {count} courses to process")

    courses = list(all_course_map.values())
    for i in range(0, len(courses), batch_size):
        batch = courses[i : i + batch_size]
        insert_myplan_courses(
            cursor,
            [
                {
                    "code": course["code"],
                    "quarter": course["termId"],
                    "data": json.dumps(course),
                    "subjectAreaCode": course["subject"],
                    "myplanId": course["id"],
                }
                for course in batch
            ],
        )
        total_batches += 1
        total_courses += len(batch)
        conn.commit()
        print(
            f"Uploaded batch {total_batches} ({i + 1}-{min(i + batch_size, len(courses))} of {len(courses)} courses)"
        )

    print(f"\n--------\nUpload complete!")
    print(f"Total courses uploaded: {total_courses}")
    print(f"Total batches processed: {total_batches}")
    print("--------\n")


def main():
    # check_subjects_in_db()
    upload_courses_to_db()


if __name__ == "__main__":
    main()
