from scripts.db import with_db
from scripts.db_queries import get_subject_areas_from_db, get_myplan_courses
from rich import print
from rich.panel import Panel


def main():
    subject_areas = get_subject_areas_from_db()
    total_subject_areas = len(subject_areas)
    myplan_courses = get_myplan_courses()

    course_code_to_section_count = {}
    subject_area_to_course_count = {}
    for course in myplan_courses:
        course_code = course["code"]
        if course_code not in course_code_to_section_count:
            course_code_to_section_count[course_code] = 0
        course_code_to_section_count[course_code] += len(
            course["data"]["sectionGroups"]
        )

        subject_area = course["subjectAreaCode"]
        if subject_area not in subject_area_to_course_count:
            subject_area_to_course_count[subject_area] = 0
        subject_area_to_course_count[subject_area] += len(
            course["data"]["sectionGroups"]
        )

    # top N courses by section count
    n = 10
    top_n_courses = sorted(
        course_code_to_section_count.items(), key=lambda x: x[1], reverse=True
    )[:n]
    print(top_n_courses)

    # top N subject areas by course count
    top_n_subject_areas = sorted(
        subject_area_to_course_count.items(), key=lambda x: x[1], reverse=True
    )[:n]
    print(top_n_subject_areas)

    # print(
    #     Panel(
    #         f"Total subject areas: {total_subject_areas}\n"
    #         f"Total subject areas with courses: {total_subject_areas_with_courses} ({total_subject_areas_with_courses / total_subject_areas * 100:.2f}%)\n"
    #         f"Total subject areas with section groups: {total_subject_areas_with_section_groups} ({total_subject_areas_with_section_groups / total_subject_areas * 100:.2f}%)"
    #     )
    # )


if __name__ == "__main__":
    main()
