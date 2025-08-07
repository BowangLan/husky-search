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


def get_course_enroll_count(course_detail: dict) -> dict[str, dict[str, int]]:
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


def get_course_enroll_count_2(course_detail: dict) -> dict[str, dict[str, int]]:
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

    # transform term to "20254"
    term_enroll_count_map = {
        transform_term_2(term): value for term, value in term_enroll_count_map.items()
    }

    return term_enroll_count_map


def transform_term(term: str) -> str:
    # transform "AU24" into "2025-3"
    # "24" should stay the same
    seasion_map = {
        "WI": "1",
        "SP": "2",
        "SU": "3",
        "AU": "4",
    }
    seasion = term[:2]
    seasion = seasion_map[seasion]
    year = int(term[2:]) + 2000

    return f"{year}{seasion}"


def transform_term_2(term: str) -> str:
    # transform "Autumn 2025" into "20254"
    # "Autumn" should stay the same
    seasion_map = {
        "Winter": "1",
        "Spring": "2",
        "Summer": "3",
        "Autumn": "4",
    }
    seasion = term.split(" ")[0]
    seasion = seasion_map[seasion]
    year = int(term.split(" ")[1])

    return f"{year}{seasion}"
