import asyncio
from scripts.myplan_api import MyPlanApiClient, SubjectArea
from scripts.db import with_db
from rich import print
from dataclasses import asdict
import json


@with_db
def insert_subject_areas(conn, cursor, subject_areas: list[SubjectArea]):
    cursor.executemany(
        """INSERT INTO myplan_subject_areas 
        (code, title, campus, "collegeCode", "collegeTitle", "departmentCode", "departmentTitle", "codeNoSpaces", "quotedCode") 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (code) DO NOTHING""",
        [
            (
                subject_area.code,
                subject_area.title,
                subject_area.campus,
                subject_area.collegeCode,
                subject_area.collegeTitle,
                subject_area.departmentCode,
                subject_area.departmentTitle,
                subject_area.codeNoSpaces,
                subject_area.quotedCode,
            )
            for subject_area in subject_areas
        ],
    )


async def main():
    client = MyPlanApiClient()
    print("Getting subject areas...")
    subject_areas = await client.get_subject_areas()

    # unique check
    subject_areas_set = set(subject_area.code for subject_area in subject_areas)
    if len(subject_areas_set) != len(subject_areas):
        print("Duplicate subject areas found")
        return

    batch_size = 100
    for i in range(0, len(subject_areas), batch_size):
        insert_subject_areas(subject_areas[i : i + batch_size])
        print(
            f"Inserted {i + batch_size} of {len(subject_areas)} subject areas ({i // batch_size + 1} / {len(subject_areas) // batch_size + 1})"
        )

    print("Done")


if __name__ == "__main__":
    asyncio.run(main())
