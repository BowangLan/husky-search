from scripts.db import with_db
from scripts.db_queries import get_subject_areas_from_db
from rich import print
from rich.panel import Panel


def main():
    subject_areas = get_subject_areas_from_db()
    total_subject_areas = len(subject_areas)
    total_subject_areas_with_courses = len(
        [subject_area for subject_area in subject_areas if subject_area["count"] > 0]
    )
    total_subject_areas_with_section_groups = len(
        [
            subject_area
            for subject_area in subject_areas
            if subject_area["count_with_section_groups"] > 0
        ]
    )

    print(
        Panel(
            f"Total subject areas: {total_subject_areas}\n"
            f"Total subject areas with courses: {total_subject_areas_with_courses} ({total_subject_areas_with_courses / total_subject_areas * 100:.2f}%)\n"
            f"Total subject areas with section groups: {total_subject_areas_with_section_groups} ({total_subject_areas_with_section_groups / total_subject_areas * 100:.2f}%)"
        )
    )


if __name__ == "__main__":
    main()
