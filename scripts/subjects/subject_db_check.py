from scripts.db import with_db, run_query
from rich import print

MYPLAN_SUBJECTS_TABLE = "myplan_subject_areas"
PROGRAMS_TABLE = "uw_programs"


def get_all_myplan_subjects():
    data = run_query(
        f"""
    SELECT id,code,title,campus,"collegeCode","collegeTitle","departmentCode","departmentTitle","codeNoSpaces","quotedCode","programId" FROM {MYPLAN_SUBJECTS_TABLE}
    """
    )
    return [
        {
            "id": row[0],
            "code": row[1],
            "title": row[2],
            "campus": row[3],
            "collegeCode": row[4],
            "collegeTitle": row[5],
            "departmentCode": row[6],
            "departmentTitle": row[7],
            "codeNoSpaces": row[8],
            "quotedCode": row[9],
            "programId": row[10],
        }
        for row in data
    ]


def get_all_programs():
    data = run_query(
        f"""
    SELECT id,name,code,"myplanSubjectAreaId" FROM {PROGRAMS_TABLE}
    """
    )
    return [
        {
            "id": row[0],
            "name": row[1],
            "code": row[2],
            "myplanSubjectAreaId": row[3],
        }
        for row in data
    ]


def find_one(l: list, fn):
    for item in l:
        if fn(item):
            return item
    return None


def info_program_test(myplan_subjects, programs):
    info_myplan = find_one(myplan_subjects, lambda p: "info" in p["code"].lower())
    print(info_myplan)
    info_program = find_one(programs, lambda s: "Informatics" in s["name"])
    print(info_program)


def cross_check(
    myplan_subjects_map,
    programs_map,
    myplan_title_map,
    program_name_map,
    myplan_subjects,
    programs,
):
    # test 1
    total = len(myplan_subjects)
    matched = 0
    for myplan_code, myplan_subject in myplan_subjects_map.items():
        program = programs_map.get(myplan_code)
        if program:
            matched += 1
    print(f"Matched: {matched} / {total} for code")

    # test 2
    total = len(myplan_subjects)
    matched = 0
    for myplan_title, myplan_subject in myplan_title_map.items():
        program = program_name_map.get(myplan_title)
        if program:
            matched += 1
    print(f"Matched: {matched} / {total} for title")

    # test 3
    total = len(programs)
    matched = 0
    for program_code, program in programs_map.items():
        myplan_subject = myplan_subjects_map.get(program_code)
        if myplan_subject:
            matched += 1
    print(f"Matched: {matched} / {total} for program code")

    # test 4
    total = len(programs)
    matched = 0
    for program_name, program in program_name_map.items():
        myplan_subject = myplan_subjects_map.get(program_name)
        if myplan_subject:
            matched += 1
    print(f"Matched: {matched} / {total} for program name")


def get_best_combo(myplan_map: dict, program_map: dict):
    output = []
    for myplan_code, myplan_subject in myplan_map.items():
        program = program_map.get(myplan_code)
        if program:
            output.append({"myplan_subject": myplan_subject, "program": program})
    return output


def sql_update_program_for_myplan_subject():
    return f"""
    UPDATE {MYPLAN_SUBJECTS_TABLE}
    SET "programId" = (SELECT id FROM {PROGRAMS_TABLE} WHERE {PROGRAMS_TABLE}.code = %s)
    WHERE {MYPLAN_SUBJECTS_TABLE}.code = %s
    """


def sql_update_myplan_subject_for_program():
    return f"""
    UPDATE {PROGRAMS_TABLE}
    SET "myplanSubjectAreaId" = (SELECT id FROM {MYPLAN_SUBJECTS_TABLE} WHERE {MYPLAN_SUBJECTS_TABLE}.code = %s)
    WHERE {PROGRAMS_TABLE}.code = %s
    """


@with_db
def sync_combo(conn, cursor, pairs: list[dict]):
    """
    Args:
        pairs: list of dicts with "myplan_subject" and "program" keys
    Returns:
        None
    Example:
        [
            {"myplan_subject_code": "INFO", "program_code": "INFO"},
            ...
        ]
    """
    for i in range(0, len(pairs), 50):
        batch = pairs[i : i + 50]
        print(f"Processing batch {i // 50 + 1} ({len(batch)} items)")
        print(f"Syncing {len(batch)} pairs...")
        cursor.executemany(
            sql_update_program_for_myplan_subject(),
            [(pair["program_code"], pair["myplan_subject_code"]) for pair in batch],
        )
        cursor.executemany(
            sql_update_myplan_subject_for_program(),
            [(pair["myplan_subject_code"], pair["program_code"]) for pair in batch],
        )
        conn.commit()


def duplicate_check(l, key_fn):
    all_map = {}
    du_map = {}
    for item in l:
        key = key_fn(item)
        if key in all_map:
            if key not in du_map:
                du_map[key] = [all_map[key], item]
            else:
                du_map[key].append(item)
        else:
            all_map[key] = item

    print(f"Found {len(du_map)} duplicates\n")
    for key, items in du_map.items():
        print(f"\n{key}: {len(items)}")
        for item in items:
            print(f"  {item}")

    du_item_count = sum(len(items) for items in du_map.values())

    print()
    if len(du_map) > 0:
        print(f"⚠️ Found {du_item_count} duplicates with {len(du_map)} unique keys")
    else:
        print("✅ No duplicates found")

    return du_map


def existing_combo_check(myplan_subjects_map, programs_map):
    error_pairs = []
    for myplan_code, myplan_subject in myplan_subjects_map.items():
        if not myplan_subject["programId"]:
            continue
        program = programs_map.get(myplan_code)
        if program and myplan_subject["programId"] != program["id"]:
            error_pairs.append(
                {
                    "myplan_subject": myplan_subject,
                    "program": program,
                }
            )
    for pair in error_pairs:
        print(f"{pair['myplan_subject']['code']} - {pair['program']['code']}")
    if len(error_pairs) > 0:
        print(f"⚠️ Found {len(error_pairs)} error pairs")
    else:
        print("✅ No error pairs found")
    return error_pairs


def main():
    myplan_subjects = get_all_myplan_subjects()
    programs = get_all_programs()

    # print basic stats
    print(f"Total MyPlan Subjects: {len(myplan_subjects)}")
    print(f"Total Programs: {len(programs)}")
    myplan_subjects_with_program_id = [s for s in myplan_subjects if s["programId"]]
    programs_with_myplan_subject_id = [p for p in programs if p["myplanSubjectAreaId"]]
    print(
        f"Total MyPlan Subjects with programId: {len(myplan_subjects_with_program_id)}"
    )
    print(
        f"Total Programs with myplanSubjectAreaId: {len(programs_with_myplan_subject_id)}"
    )
    myplan_codes_to_skip_set = set(s["code"] for s in myplan_subjects_with_program_id)
    programs_codes_to_skip_set = set(p["code"] for p in programs_with_myplan_subject_id)
    print(f"Total MyPlan Subjects to skip: {len(myplan_codes_to_skip_set)}")
    print(f"Total Programs to skip: {len(programs_codes_to_skip_set)}")
    # print(myplan_subjects_with_program_id)

    # Build maps
    myplan_subjects_map = {
        myplan_subject["code"].lower(): myplan_subject
        for myplan_subject in myplan_subjects
    }
    programs_map = {program["code"].lower(): program for program in programs}
    myplan_title_map = {
        myplan_subject["title"].lower(): myplan_subject
        for myplan_subject in myplan_subjects
    }
    program_name_map = {program["name"].lower(): program for program in programs}

    # ------------------------------------------------------------
    # Get "Informatics" program
    # info_program_test(myplan_subjects, programs)
    # conclusion:
    # 1. possible: myplan_subjects['title'].lower() = programs['name'].lower()
    # 2. possible: myplan_subjects['code'].lower() = programs['code'].lower()

    # ------------------------------------------------------------
    # cross_check(
    #     myplan_subjects_map,
    #     programs_map,
    #     myplan_title_map,
    #     program_name_map,
    #     myplan_subjects,
    #     programs,
    # )
    # conclusion:
    # Best combo: myplan_subjects['title'].lower() left join programs['name'].lower()
    # but with name and title is not unique
    # second best combo: myplan_subjects['code'].lower() left join programs['code'].lower()
    """
    Matched: 183 / 473 for code with myplan base
    Matched: 253 / 473 for title with myplan base
    Matched: 183 / 342 for program code with program base
    Matched: 31 / 342 for program name with program base
    """

    # ------------------------------------------------------------
    best_combo = get_best_combo(myplan_subjects_map, programs_map)
    # print(f"Best combo: {len(best_combo)}")

    # ------------------------------------------------------------
    # duplicate_check(myplan_subjects, lambda x: x["code"])
    # duplicate_check(programs, lambda x: x["code"])
    # duplicate_check(myplan_subjects, lambda x: x["title"])
    # duplicate_check(programs, lambda x: x["name"])

    # ------------------------------------------------------------
    print("\n\n--------------------------------")
    print("Existing combo check...")
    print("--------------------------------")
    existing_combo_check(myplan_subjects_map, programs_map)

    # ------------------------------------------------------------
    print("\n\n--------------------------------")
    print("Syncing...")
    print("--------------------------------")
    sync_combo(
        [
            {
                "myplan_subject_code": item["myplan_subject"]["code"],
                "program_code": item["program"]["code"],
            }
            for item in best_combo
            if item["myplan_subject"]["code"] not in myplan_codes_to_skip_set
        ]
    )


if __name__ == "__main__":
    main()
