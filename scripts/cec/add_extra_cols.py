import asyncio
from scripts.cec.queries import get_all_courses_with_id
from scripts.db import CEC_DATA_TABLE, with_db
from rich import print


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


@with_db
def batch_update_rows(conn, cursor, rows: list[dict]):
    sql_update_subject_num = f"""
    UPDATE {CEC_DATA_TABLE}
    SET "professor" = %s, "role" = %s, "term" = %s, "quarter" = %s, "enrolledCount" = %s, "surveyedCount" = %s, "courseCode" = %s, "sessionCode" = %s
    WHERE id = %s
    """
    batch_size = 100
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        cursor.executemany(
            sql_update_subject_num,
            [
                (
                    course["professor"],
                    course["role"],
                    course["term"],
                    course["quarter"],
                    course["enrolledCount"],
                    course["surveyedCount"],
                    course["courseCode"],
                    course["sessionCode"],
                    course["id"],
                )
                for course in batch
            ],
        )
        print(f"Updated {i + len(batch)}/{len(rows)} rows")
        conn.commit()


async def main():
    print("Fetching courses...")
    rows = get_all_courses_with_id()
    print(f"Found {len(rows)} rows")

    transformed_rows = []
    error_count = 0
    for row in rows:
        parts = row["data"]["h2"].split("   ")
        if len(parts) != 3:
            print("Something is wrong with the this row")
            print(row["data"])
            error_count += 1
            continue

        h1 = row["data"]["h1"]
        code = ""
        session = ""
        first_digit_index = -1
        for i in range(len(h1) - 1, -1, -1):
            if first_digit_index == -1 and h1[i].isdigit():
                first_digit_index = i
                session = h1[i + 1 :].strip()
                # break

            # check if h1[i] is a lower case letter
            if h1[i].islower():
                if first_digit_index == -1:
                    code = h1[i + 2 :]
                else:
                    code = h1[i + 1 : first_digit_index + 1]
                break

        transformed_rows.append(
            {
                "id": row["id"],
                "professor": parts[0].strip(),
                "role": parts[1].strip(),
                "term": parts[2].strip(),
                "quarter": transform_term(parts[2].strip()),
                "enrolledCount": int(row["data"]["caption"]["enrolled"]),
                "surveyedCount": int(row["data"]["caption"]["surveyed"]),
                "courseCode": code,
                "sessionCode": session,
            }
        )

    # print(transformed_rows[0])
    # print(len(transformed_rows[0]["professor"]))

    batch_update_rows(transformed_rows)

    # print("Done")


if __name__ == "__main__":
    asyncio.run(main())
