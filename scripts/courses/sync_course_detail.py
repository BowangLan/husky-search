from scripts.myplan_api import MyPlanApiClient
import asyncio
from scripts.db import with_db
from dotenv import load_dotenv
from rich import print

load_dotenv()


def get_sessions(course_detail: dict) -> list[dict]:
    sessions = []

    for ins in course_detail["courseOfferingInstitutionList"]:
        for termList in ins["courseOfferingTermList"]:
            for offering in termList["activityOfferingItemList"]:
                sessions.append({"term": termList["term"], **offering})

    return sessions


def get_sessions_grouped_by_term(course_detail: dict) -> dict[str, list[dict]]:
    sessions = {}

    for ins in course_detail["courseOfferingInstitutionList"]:
        for termList in ins["courseOfferingTermList"]:
            for offering in termList["activityOfferingItemList"]:
                if termList["term"] not in sessions:
                    sessions[termList["term"]] = []
                sessions[termList["term"]].append(offering)

    return sessions


def get_course_enroll_count(course_detail: dict) -> int:
    term_session_map = get_sessions_grouped_by_term(course_detail)
    term_enroll_count_map = {}

    for term, sessions in term_session_map.items():
        term_enroll_count = 0
        term_enroll_available_count = 0
        for session in sessions:
            if len(session["code"]) == 1:
                # only count session with single letter code
                # e.g. A, B, C, D, etc.
                # ignore sessions with multiple letter code
                # e.g. AA, AB, etc.
                term_enroll_count += int(session["enrollMaximum"])
                term_enroll_available_count += int(session["enrollCount"])

        term_enroll_count_map[term] = {
            "enroll_total_count": term_enroll_count,
            "enroll_available_count": term_enroll_available_count,
        }

    return term_enroll_count_map


async def main():
    client = MyPlanApiClient()
    course_detail = await client.get_course_detail("INFO 200")

    # print(course_detail)

    # sessions = get_sessions(course_detail)
    # for session in sessions:
    #     print(session["term"], session["code"])

    # term_session_map = get_sessions_grouped_by_term(course_detail)
    # for term, sessions in term_session_map.items():
    #     print(term)
    #     for session in sessions:
    #         print(session["code"])

    term_enroll_count_map = get_course_enroll_count(course_detail)
    print(term_enroll_count_map)


if __name__ == "__main__":
    asyncio.run(main())
