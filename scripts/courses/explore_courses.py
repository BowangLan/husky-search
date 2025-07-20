from scripts.db import (
    with_db,
    run_query,
    MYPLAN_SUBJECTS_TABLE,
    PROGRAMS_TABLE,
    COURSES_TABLE,
    MYPLAN_COURSES_TABLE,
)
from rich import print
from scripts.db_queries import get_myplan_courses
from scripts.utils import duplicate_check


def get_course_by_code(courses, code: str):
    for course in courses:
        if course["code"] == code:
            return course
    return None


def split_courses_by_null_quarter(courses):
    null_quarter_courses = []
    non_null_quarter_courses = []

    for course in courses:
        # if course["quarter"] == "null":
        if course["data"]["termId"] is None:
            null_quarter_courses.append(course)
        else:
            non_null_quarter_courses.append(course)

    return non_null_quarter_courses, null_quarter_courses


def main():
    courses = get_myplan_courses()
    # print(courses[:5])

    # filter out non-quarter courses
    # courses = [course for course in courses if course["quarter"] != "null"]

    # ------------------------------------------------------------
    # get course by code
    course = get_course_by_code(courses, "INFO 102")
    if course:
        print(
            f"({course['data']['id']}) {course['code']} ({course['quarter']}) - Sections: {len(course['data']['sectionGroups'])}"
        )
    else:
        print(f"Course not found")

    # ------------------------------------------------------------
    # sort by len(course['data']['secionGroups'])
    courses.sort(key=lambda x: len(x["data"]["sectionGroups"]), reverse=True)
    # print the first 5 courses
    print("Top 5 courses by sectionGroups")
    for course in courses[:5]:
        print(f"{course['code']} - {len(course['data']['sectionGroups'])}")

    # ------------------------------------------------------------
    # get courses with null termId
    non_null_quarter_courses, null_quarter_courses = split_courses_by_null_quarter(
        courses
    )
    print(f"Courses with null termId: {len(null_quarter_courses)} / {len(courses)}")
    print(
        f"Courses with non-null quarter: {len(non_null_quarter_courses)} / {len(courses)}"
    )

    # for course in null_termId_courses:
    #     print(f"{course['code']} - {course['data']['termId']}")
    # print(null_quarter_courses[0])

    # ------------------------------------------------------------
    # duplicate_check(courses, lambda x: x["code"], no_print=True)

    # ------------------------------------------------------------
    # get courses by credit
    courses_by_credit = [
        course for course in courses if "1" in course["data"]["allCredits"]
    ]
    print(f"Courses by credit: {len(courses_by_credit)}")
    # check if all courses's data['allCredits'] is a string array
    for course in courses_by_credit:
        if not isinstance(course["data"]["allCredits"], list):
            print(f"Course {course['code']} has non-string allCredits")
            print(course["data"]["allCredits"])
            break
    # print the first 5 courses
    # print("Top 5 courses by credit")

    # ------------------------------------------------------------
    # get courses with detail
    courses_with_detail = [course for course in courses if course["detail"]]
    print(f"Courses with detail: {len(courses_with_detail)} / {len(courses)}")


if __name__ == "__main__":
    main()
