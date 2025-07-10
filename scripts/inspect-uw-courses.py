import json
from rich import print

UW_COURSE_FILENAME = "temp/uw-courses.json"

with open(UW_COURSE_FILENAME, "r", encoding="utf-8") as f:
    data = json.load(f)

def remove_duplicate_courses(data):
    course_map = {}
    duplicate_course_map = {}
    for department in data:
        if "courses" in department:
            for course in department["courses"]:
                if course["code"] not in course_map:
                    course_map[course["code"]] = course
                else:
                    if course["code"] not in duplicate_course_map:
                        duplicate_course_map[course["code"]] = [
                            course_map[course["code"]],
                            course,
                        ]
                    else:
                        duplicate_course_map[course["code"]].append(course)
    return course_map, duplicate_course_map

# print(f"Total courses: {course_count}")
# print(f"Total unique courses: {len(course_code_set)}")
# print(f"Total duplicate courses: {course_count - len(course_code_set)}")
# # print(duplicate_course_map)
# for course_code, courses in duplicate_course_map.items():
#     if len(courses) == 2:
#         print("[green]2[/green]", end="")
#     elif len(courses) == 3:
#         print("[red]3[/red]", end="")
#     else:

def flatten_courses(data):
    courses = []
    for department in data:
        if "courses" in department:
            for course in department["courses"]:
                courses.append({
                    **course,
                    "department": department["href"].split(".")[0],
                    "subject": course["code"][:-3].upper(),
                    "number": course["code"][-3:],
                })
    return courses

def check_course_code(courses):
    invalid_course_codes = []
    for course in courses:
        number = course["number"]
        # number should be 3 digits
        if len(number) != 3 or not number.isdigit() or int(number) < 0 or int(number) > 999:
            invalid_course_codes.append(course["code"])
    return invalid_course_codes

courses = flatten_courses(data)
print(f"Total courses: {len(courses)}")
invalid_course_codes = check_course_code(courses)
print(f"Total invalid course codes: {len(invalid_course_codes)}")
print(invalid_course_codes)


