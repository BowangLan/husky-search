from dataclasses import dataclass
import hashlib
import time
import httpx
import uuid
import os


@dataclass
class Course:
    id: str
    courseId: str
    code: str
    subject: str
    level: str
    title: str
    credit: str
    campus: str
    termId: str
    institution: str
    allCredits: list[str]
    genEduReqs: list[any]
    sectionGroups: list[str]
    startTime: int
    endTime: int
    score: int
    latestVersion: bool
    expiringTermId: any
    beginningTermId: any
    prereqs: str
    onlineLearningCodes: list[str]
    meetingDays: list[str]
    versions: list[any]
    gradingSystems: list[str]
    open: bool
    tba: bool
    pce: bool
    enrRestricted: bool


@dataclass
class SubjectArea:
    code: str
    title: str
    campus: str
    collegeCode: str
    collegeTitle: str
    departmentCode: str
    departmentTitle: str
    codeNoSpaces: str
    quotedCode: str


@dataclass
class Instructor:
    name: str
    campus: str


class MyPlanApiClient:
    """Client for interacting with UW MyPlan course API"""

    def __init__(self):
        self.base_url = "https://course-app-api.planning.sis.uw.edu/api"
        self.headers = {
            "accept": "*/*",
            "content-type": "application/json",
            "origin": "https://myplan.uw.edu",
            "referer": "https://myplan.uw.edu/",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
            "cookie": os.getenv("MYPLAN_COOKIE"),
            "x-csrf-token": os.getenv("MYPLAN_CSRF_TOKEN"),
        }

    def _generate_checksum(self, data: str) -> str:
        """Generate API checksum header value"""
        return hashlib.md5(data.encode()).hexdigest()

    def _generate_csrf_token(self) -> str:
        """Generate CSRF token - simplified version"""
        # In real implementation this would need to match MyPlan's token generation
        timestamp = str(int(time.time()))
        return hashlib.sha512(timestamp.encode()).hexdigest()

    async def search_courses(self, query: str) -> list[Course]:
        """Search for courses using the MyPlan API"""

        payload = {
            "username": "GUEST",
            "requestId": str(uuid.uuid4()),
            "sectionSearch": True,
            "instructorSearch": False,
            "queryString": f"{query}",
            "consumerLevel": "UNDERGRADUATE",
            "campus": "seattle",
            # optional
            "startTime": "0630",
            "endTime": "2230",
            "days": [],
        }

        headers = {
            **self.headers,
        }

        try:
            response = httpx.post(
                f"{self.base_url}/courses", headers=headers, json=payload
            )
            response.raise_for_status()
            return [Course(**course) for course in response.json()]
        except httpx.HTTPStatusError as e:
            print(f"Error making request to MyPlan API: {str(e)}")
            return {}

    async def get_subject_areas(self) -> list[SubjectArea]:
        """Get subject areas from the MyPlan API"""
        headers = {
            **self.headers,
        }

        try:
            response = httpx.get(f"{self.base_url}/subjectAreas", headers=headers)
            response.raise_for_status()
            return [SubjectArea(**subject_area) for subject_area in response.json()]
        except httpx.HTTPStatusError as e:
            print(f"Error making request to MyPlan API: {str(e)}")
            return {}

    async def get_instructors(self) -> list[Instructor]:
        """Get instructors from the MyPlan API"""
        headers = {
            **self.headers,
        }

        try:
            response = httpx.get(f"{self.base_url}/instructors", headers=headers)
            response.raise_for_status()
            return [Instructor(**instructor) for instructor in response.json()]
        except httpx.HTTPStatusError as e:
            print(f"Error making request to MyPlan API: {str(e)}")
            return {}

    async def get_course_detail(
        self, course_code: str, course_id: str | None = None
    ) -> dict:
        """Get course details from the MyPlan API

        Args:
            course_code (str): Course code (e.g. "INFO 200")
            course_id (str): Course ID (e.g. "1e8e2a4c-7db3-4283-8cba-31ecb2c928c2")

        Returns:
            dict: Course details response
        """
        try:
            response = httpx.get(
                f"{self.base_url}/courses/{course_code}/details",
                params={"courseId": course_id} if course_id else {},
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"Error making request to MyPlan API: {str(e)}")
            return {}
