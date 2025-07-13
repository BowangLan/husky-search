from dataclasses import dataclass
import hashlib
import time
import httpx
import uuid


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
            "cookie": r"_ga_VQZHV3SH3P=GS2.1.s1746589140$o1$g1$t1746589227$j0$l0$h0; _gcl_au=1.1.437147894.1747197726; _hjSessionUser_3542396=eyJpZCI6ImNhYzQ2MjlmLTM4YzgtNTY3Ni1iYmIzLTI0NjMxYzdkNmU4YyIsImNyZWF0ZWQiOjE3NDcxOTc3MjU4ODUsImV4aXN0aW5nIjp0cnVlfQ==; _fbp=fb.1.1747197726331.115911875945980748; _ga_0V5LFWD2KQ=GS2.1.s1747935853$o1$g1$t1747936345$j19$l0$h0$dR2YvLwKSS1jCphuMmKjS-bP4T4IWuOGjQA; _ga_YHX5G0W6DX=GS2.1.s1747937532$o2$g0$t1747937532$j0$l0$h0; _ga_K5Q4WV298H=GS2.1.s1747933199$o1$g1$t1747938514$j0$l0$h0; _ga_5NP8JDX6NQ=GS2.1.s1748087044$o3$g0$t1748087046$j58$l0$h0$dG4XvxCAG0rfpOKPrtoRi1AbSSPVA4UkpLA; _ga_MX29D1QWGH=GS2.1.s1748087044$o3$g0$t1748087046$j58$l0$h0$dxC1HkbqNja6xDBYDEseQwSEKt83uCm8LWw; _ga_0VMRR09G41=GS2.1.s1748364465$o1$g0$t1748364470$j0$l0$h0; _ga_S51TRWK3R8=GS2.1.s1750134110$o4$g0$t1750134111$j59$l0$h0; ps_rvm_ZkiN=%7B%22pssid%22%3A%2238Y0jAzv3GjOFtQ7-1750107949183%22%2C%22last-visit%22%3A%221750134111689%22%7D; _ga=GA1.1.107335358.1742470468; _uetvid=c9d07890307d11f0b754537bf5d08d37|kj0mft|1748066424492|2|1|bat.bing.com/p/insights/c/j; _ga_MBEGNXVCWH=GS2.1.s1750704315$o1$g1$t1750704355$j20$l0$h72956306; _ga_YJ09SKYQ9C=GS2.1.s1750704315$o1$g1$t1750704355$j20$l0$h0; _ga_WGSVEGE14H=GS2.1.s1750707773$o11$g1$t1750707795$j38$l0$h0; _ga_B3VH61T4DT=GS2.1.s1750711023$o40$g0$t1750711023$j60$l0$h0; _clck=ghtic3%7C2%7Cfx9%7C0%7C2009; _ga_29JYF25HLW=GS2.1.s1751472063$o2$g1$t1751472878$j60$l0$h1135471766; _ga_BFQJ094C4L=GS2.1.s1752372313$o1$g1$t1752372371$j2$l0$h0; sessionId=9bdcd4bf3fbe4a7af7bca0707f8f67db245d8059fd6893c7af55d10490342153; _ga_TNNYEHDN9L=GS2.1.s1752421731$o36$g1$t1752421753$j38$l0$h0",
            "x-csrf-token": "a6b0fe520d03bad48f5cbfa20a44b709a877d6b7e07967ee07c336a8c0a8d129b2c98175ff0174ade2ba8d4d91f36c886e731a0edfa354d95f4119cb56624193bfe3f0bba9e541946074b238cfe855f27daae528381bbc396632946980ce775ecb4011f4f0f4813c96efd5b48839c8f2e22b6a23d69942c06724bad33113ace8",
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
            "sectionSearch": False,
            "instructorSearch": False,
            "queryString": f"{query}",
            "consumerLevel": "UNDERGRADUATE",
            "campus": "seattle",
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
