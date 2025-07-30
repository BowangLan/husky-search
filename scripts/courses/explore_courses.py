from scripts.db import (
    with_db,
    run_query,
    MYPLAN_SUBJECTS_TABLE,
    PROGRAMS_TABLE,
    COURSES_TABLE,
    MYPLAN_COURSES_TABLE,
)
from rich import print
from scripts.db_queries import get_all_courses_with_id, get_myplan_courses
from scripts.utils import duplicate_check
import json


def get_sessions(course_detail: dict) -> list[dict]:
    sessions = []

    for ins in course_detail["courseOfferingInstitutionList"]:
        for termList in ins["courseOfferingTermList"]:
            for offering in termList["activityOfferingItemList"]:
                sessions.append({"term": termList["term"], **offering})

    return sessions


def get_course_detail_seats(course_detail: dict) -> list[dict]:
    sessions = get_sessions(course_detail)
    term_session_map = {}

    for session in sessions:
        if session["term"] not in term_session_map:
            term_session_map[session["term"]] = {
                "enrollCount": 0,
                "enrollMax": 0,
            }

        if len(session["code"]) == 1:
            term_session_map[session["term"]]["enrollCount"] += int(
                session["enrollCount"]
            )
            term_session_map[session["term"]]["enrollMax"] += int(
                session["enrollMaximum"]
            )

    return term_session_map


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
    raw_courses = get_all_courses_with_id()
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

    # ------------------------------------------------------------
    # get courses with no raw course data
    courses_with_no_raw_course_data = [
        course for course in courses if not course["detail"]
    ]
    print(
        f"Courses with no raw course data: {len(courses_with_no_raw_course_data)} / {len(courses)}"
    )

    # ------------------------------------------------------------
    # sample course
    # print(courses[0])
    # with open("temp/course_0.json", "w") as f:
    # json.dump(courses[0], f, indent=2)

    courses_riched = {}
    course_quarter_map = {}
    for c in courses:
        key = f"{c['code']}"
        if key not in courses_riched:
            seats = get_course_detail_seats(c["detail"])
            courses_riched[key] = {
                "code": c["code"],
            }
            for term, seats in seats.items():
                quarter_key = f"{c['code']}-{term}"
                if quarter_key not in course_quarter_map:
                    course_quarter_map[quarter_key] = {
                        "code": c["code"],
                        "term": term,
                        "enrollCount": seats["enrollCount"],
                        "enrollMax": seats["enrollMax"],
                    }

    # top k courses by seats
    top_k = 20
    top_k_courses = sorted(
        course_quarter_map.values(), key=lambda x: x["enrollMax"], reverse=True
    )[:top_k]
    print(f"\nTop {top_k} courses by seats:")
    for c in top_k_courses:
        print(f"{c['code']} - {c['term']} - {c['enrollCount']} / {c['enrollMax']}")


if __name__ == "__main__":
    main()
