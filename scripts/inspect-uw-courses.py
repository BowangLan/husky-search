import json
from rich import print

UW_COURSE_FILENAME = "temp/uw-courses.json"

with open(UW_COURSE_FILENAME, "r", encoding="utf-8") as f:
    data = json.load(f)

course_count = 0
for department in data:
    # print(department["text"])
    if "courses" in department:
        # print(f"  {len(department['courses'])} courses")
        course_count += len(department["courses"])
    else:
        pass
        # print("  No courses")

print(f"Total courses: {course_count}")
