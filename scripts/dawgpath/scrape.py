import asyncio
import httpx
from lxml import html
from rich import print
from scripts.db import with_db, CEC_DATA_TABLE
import json

LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

cookies = {
    "_ga_VQZHV3SH3P": "GS2.1.s1746589140$o1$g1$t1746589227$j0$l0$h0",
    "_gcl_au": "1.1.437147894.1747197726",
    "_hjSessionUser_3542396": "eyJpZCI6ImNhYzQ2MjlmLTM4YzgtNTY3Ni1iYmIzLTI0NjMxYzdkNmU4YyIsImNyZWF0ZWQiOjE3NDcxOTc3MjU4ODUsImV4aXN0aW5nIjp0cnVlfQ==",
    "_fbp": "fb.1.1747197726331.115911875945980748",
    "_ga_0V5LFWD2KQ": "GS2.1.s1747935853$o1$g1$t1747936345$j19$l0$h0$dR2YvLwKSS1jCphuMmKjS-bP4T4IWuOGjQA",
    "_ga_YHX5G0W6DX": "GS2.1.s1747937532$o2$g0$t1747937532$j0$l0$h0",
    "_ga_K5Q4WV298H": "GS2.1.s1747933199$o1$g1$t1747938514$j0$l0$h0",
    "_ga_5NP8JDX6NQ": "GS2.1.s1748087044$o3$g0$t1748087046$j58$l0$h0$dG4XvxCAG0rfpOKPrtoRi1AbSSPVA4UkpLA",
    "_ga_MX29D1QWGH": "GS2.1.s1748087044$o3$g0$t1748087046$j58$l0$h0$dxC1HkbqNja6xDBYDEseQwSEKt83uCm8LWw",
    "_ga_0VMRR09G41": "GS2.1.s1748364465$o1$g0$t1748364470$j0$l0$h0",
    "_ga_S51TRWK3R8": "GS2.1.s1750134110$o4$g0$t1750134111$j59$l0$h0",
    "ps_rvm_ZkiN": "%7B%22pssid%22%3A%2238Y0jAzv3GjOFtQ7-1750107949183%22%2C%22last-visit%22%3A%221750134111689%22%7D",
    "_ga": "GA1.1.107335358.1742470468",
    "_uetvid": "c9d07890307d11f0b754537bf5d08d37|kj0mft|1748066424492|2|1|bat.bing.com/p/insights/c/j",
    "_ga_MBEGNXVCWH": "GS2.1.s1750704315$o1$g1$t1750704355$j20$l0$h72956306",
    "_ga_YJ09SKYQ9C": "GS2.1.s1750704315$o1$g1$t1750704355$j20$l0$h0",
    "_ga_WGSVEGE14H": "GS2.1.s1750707773$o11$g1$t1750707795$j38$l0$h0",
    "_ga_B3VH61T4DT": "GS2.1.s1750711023$o40$g0$t1750711023$j60$l0$h0",
    "_clck": "ghtic3%7C2%7Cfx9%7C0%7C2009",
    "_ga_29JYF25HLW": "GS2.1.s1751472063$o2$g1$t1751472878$j60$l0$h1135471766",
    "csrftoken": "z3otQnZUmBdxQWI6Xjvlq2TRxzd8OhM5",
    "sessionid": "5yycdfkqq4zg9apljkl1jfut6nbk3fat",
    "fs_uid": "#o-1V47MT-na1#0d1e305f-fceb-4356-a2f3-2a575a93a39d:bee78d91-2f26-4e73-b56e-b94e4db9b74e:1753348815748::1#efac8273#/1775255921",
    "_ga_TNNYEHDN9L": "GS2.1.s1753348854$o47$g0$t1753348854$j60$l0$h0",
    "_ga_BFQJ094C4L": "GS2.1.s1753860986$o5$g1$t1753861006$j40$l0$h0",
}


async def get_course_dawgpath_detail(code: str):
    full_url = f"https://dawgpath.uw.edu/api/v1/courses/details/{code}"
    async with httpx.AsyncClient() as client:
        response = await client.get(
            full_url,
            cookies=cookies,
            headers={"referer": "https://dawgpath.uw.edu/course"},
        )
    data = response.json()
    return data


async def get_subject_dawgpath_detail(subject: str):
    full_url = f"https://dawgpath.uw.edu/api/v1/curric_prereq/{subject}"
    async with httpx.AsyncClient() as client:
        response = await client.get(
            full_url,
            cookies=cookies,
            headers={"referer": "https://dawgpath.uw.edu/course"},
        )

    data = response.json()
    return data


async def get_all_subjects():
    full_url = "https://dawgpath.uw.edu/api/v1/search/?search_string=*&type[]=major&prev_type[]=major"
    async with httpx.AsyncClient() as client:
        response = await client.get(
            full_url,
            cookies=cookies,
            headers={"referer": "https://dawgpath.uw.edu/course"},
        )
    data = response.json()
    return data["major_matches"]


async def extract_course_cec_data(html_content: str):
    """
    Extracts data from an HTML table with a specific structure using lxml.

    Args:
        html_content (str): A string containing the HTML table.

    Returns:
        dict: A dictionary containing the extracted caption data, headers,
              and table data in both list of lists and list of dictionaries formats.
    """
    tree = html.fromstring(html_content)

    # Extracting caption data
    caption_text = tree.xpath("//caption/text()")
    if caption_text:
        caption_text = caption_text[0].strip().replace("\xa0", " ")
        surveyed_match = tree.xpath("//caption/text()")[0].split('"')
        surveyed = surveyed_match[1] if len(surveyed_match) > 1 else None
        enrolled = surveyed_match[3] if len(surveyed_match) > 3 else None
    else:
        caption_text = None
        surveyed = None
        enrolled = None

    # Extracting headers
    headers = [th.text_content().strip() for th in tree.xpath("//th")]

    # Extracting table data
    table_data_list_of_lists = []
    for row in tree.xpath("//tr")[1:]:  # Skip the header row
        row_data = [td.text_content().strip() for td in row.xpath("./td")]
        table_data_list_of_lists.append(row_data)

    # To access data in a more structured way, e.g., as a list of dictionaries
    table_data_list_of_dicts = []
    if (
        headers and table_data_list_of_lists
    ):  # Ensure headers exist before creating dicts
        for row in table_data_list_of_lists:
            row_dict = {}
            for i, header in enumerate(headers):
                if i < len(
                    row
                ):  # Prevent IndexError if row has fewer columns than headers
                    row_dict[header] = row[i]
            table_data_list_of_dicts.append(row_dict)

    h1 = tree.xpath("//h1/text()")
    if h1:
        h1 = h1[0].strip().replace("\xa0", " ")
    else:
        h1 = None

    h2 = tree.xpath("//h2/text()")
    if h2:
        h2 = h2[0].strip().replace("\xa0", " ")
    else:
        h2 = None

    return {
        "caption": {
            "text": caption_text,
            "surveyed": surveyed,
            "enrolled": enrolled,
        },
        "headers": headers,
        "table_data_list_of_lists": table_data_list_of_lists,
        "table_data_list_of_dicts": table_data_list_of_dicts,
        "h1": h1,
        "h2": h2,
    }


@with_db
def upload_cec_course_data(conn, cursor, data: list[dict]):
    cursor.executemany(
        f"""
        INSERT INTO {CEC_DATA_TABLE} ("courseUrl", "data") VALUES (%s, %s)
        ON CONFLICT ("courseUrl") DO UPDATE SET "data" = EXCLUDED."data"
        """,
        [(item["courseUrl"], json.dumps(item["data"])) for item in data],
    )
    conn.commit()


async def main():
    courses = await get_all_letter_courses()
    print(f"Found {len(courses)} courses in total")

    total_processed = 0
    async with asyncio.TaskGroup() as tg:
        batch_size = 25
        for i in range(0, len(courses), batch_size):
            batch = courses[i : i + batch_size]
            tasks = []
            for course in batch:
                tasks.append(tg.create_task(get_course_cec_detail(course)))

            task_data = []
            for task, course in zip(tasks, batch):
                data = await task
                task_data.append(
                    {
                        "courseUrl": course,
                        "data": data,
                    }
                )

            print(f"Scraped {len(task_data)} courses")

            upload_cec_course_data(task_data)
            print(
                f"Uploaded {len(task_data)} courses ({i + batch_size}/{len(courses)} - {(i + batch_size) / len(courses) * 100:.1f}% complete)"
            )

            total_processed += len(task_data)

    print(f"Total processed: {total_processed} courses")


async def get_all_letter_courses():
    results = []
    async with asyncio.TaskGroup() as tg:
        tasks = []
        for i in range(0, len(LETTERS), 10):
            batch = LETTERS[i : i + 10]
            for letter in batch:
                tasks.append(tg.create_task(get_letter_courses(letter)))

        for task in tasks:
            courses = await task
            results.extend(courses)
            print(f"Found {len(courses)} courses")

    return results


async def test_scrape():
    results = []
    async with asyncio.TaskGroup() as tg:
        tasks = []
        for i in range(0, len(LETTERS), 10):
            batch = LETTERS[i : i + 10]
            for letter in batch:
                tasks.append(tg.create_task(get_letter_courses(letter)))

        for task in tasks:
            courses = await task
            results.extend(courses)
            print(f"Found {len(courses)} courses")

    print(f"Found {len(results)} courses in total")


async def test_extract_course_cec_data():
    data = await get_course_dawgpath_detail("INFO 201")
    print(data)


async def test_get_subject_dawgpath_detail():
    data = await get_subject_dawgpath_detail("INFO")
    print(data)


async def test_get_all_subjects():
    data = await get_all_subjects()
    print(f"Found {len(data)} subjects")


if __name__ == "__main__":
    # asyncio.run(main())
    # asyncio.run(test_scrape())
    # asyncio.run(test_extract_course_cec_data())
    # asyncio.run(test_get_subject_dawgpath_detail())
    asyncio.run(test_get_all_subjects())
