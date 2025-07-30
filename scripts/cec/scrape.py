import asyncio
import httpx
from lxml import html
from rich import print
from scripts.db import with_db, CEC_DATA_TABLE
import json

LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

COOKIE = "nmstat=5347ae69-fc39-017d-5be1-c747cc5c798b; _fbp=fb.1.1742492410804.25217141481684384; cebs=1; _mkto_trk=id:131-AQO-225&token:_mch-washington.edu-3dbd83a75f74029c461961c07ab6a7fa; _opensaml_req_ss%3Amem%3A6aeb88b0ab88a4b2210817afa61ff5d8c4c0e128d14ed406790ded6b8e0f961f=_b1562c4aa2c601517bd26d6b65f4afb5; _ga_DCJXF1RLXE=GS1.1.1745730451.1.1.1745730581.0.0.0; _clck=57sla2%7C2%7Cfvq%7C0%7C1954; mtc_id=2568123; mtc_sid=ujp5udlha0ivv3na1gc0eq2; mautic_device_id=ujp5udlha0ivv3na1gc0eq2; __utmc=80390417; __utmz=80390417.1746903451.1.1.utmcsr=directory.uw.edu|utmccn=(referral)|utmcmd=referral|utmcct=/; _ga_6PNRL82PD4=GS2.1.s1748575255$o1$g1$t1748575287$j28$l0$h0; _ga_VLXYEPDF94=GS2.1.s1748575255$o1$g1$t1748575287$j28$l0$h0; _ga_4DEGMHTN3T=GS2.2.s1749780628$o5$g0$t1749780628$j60$l0$h0; _ga_ZSJL1C6YJ5=GS2.1.s1750584497$o1$g0$t1750584501$j56$l0$h0; _gcl_au=1.1.642359019.1750637329; _ga_25XGC4P1F5=GS2.2.s1750704337$o3$g0$t1750704337$j60$l0$h0; _ga_C854SEMWV6=GS2.2.s1750891748$o3$g1$t1750891771$j37$l0$h0; _ce.s=v~c202540d6dd15891cb1935165499071cb28b967d~lcw~1751471958083~vir~returning~lva~1751471958082~vpv~0~v11.fhb~1746679454978~v11.lhb~1746720818846~v11.cs~458693~v11.s~48af6c90-3b1a-11f0-8022-adac0975c4e4~v11.vs~c202540d6dd15891cb1935165499071cb28b967d~v11.ss~1748364452314~v11ls~48af6c90-3b1a-11f0-8022-adac0975c4e4~v11.fsvd~e30%3D~lcw~1751471958083; cebsp_=22; _ga_XSBFHD17M5=GS2.1.s1751471957$o1$g1$t1751471990$j27$l0$h0; _ga_CPBMNL5L6C=GS2.1.s1751500452$o4$g0$t1751500453$j59$l0$h0; __utma=80390417.1069828593.1742492411.1746903451.1752160883.2; _ga_SHNBKYT066=GS2.1.s1753207920$o13$g0$t1753207920$j60$l0$h0; _ga_67C94ZRNEY=GS2.1.s1753207920$o7$g0$t1753207920$j60$l0$h0; _ga_3L5RZ9EB10=GS2.1.s1753348806$o5$g0$t1753348806$j60$l0$h0; ps_rvm_fZxi=%7B%22pssid%22%3A%22jRcLosy8n1w2LW9l-1753228198277%22%2C%22opening-catcher%22%3A1752785267093%2C%22last-visit%22%3A%221753348806400%22%7D; _gid=GA1.2.597956696.1753849761; _ga_HZC6629TRG=GS2.2.s1753849766$o2$g0$t1753849766$j60$l0$h0; _ga_3T65WK0BM8=GS2.1.s1753849766$o17$g0$t1753849766$j60$l0$h0; _ga_JLHM9WH4JV=GS2.1.s1753849766$o17$g0$t1753849766$j60$l0$h0; _ga=GA1.2.1069828593.1742492411; _shibsession_64656661756c7468747470733a2f2f7777772e77617368696e67746f6e2e6564752f73686962626f6c657468=_6ade4da0dc4bab68d8d636bdb8e618a5; _affinity=w11|aImrs; _ga_E1YV43XFCK=GS2.2.s1753852845$o7$g0$t1753852845$j60$l0$h0"


async def get_letter_courses(letter: str):
    letter = letter.lower()
    url = f"https://www.washington.edu/cec/{letter}-toc.html"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers={"Cookie": COOKIE})
    tree = html.fromstring(response.text)
    links = tree.xpath("//a/@href")
    filtered_links = [link for link in links if link.startswith(letter + "/")]
    return filtered_links


async def get_course_cec_detail(url: str):
    full_url = f"https://www.washington.edu/cec/{url}"
    async with httpx.AsyncClient() as client:
        response = await client.get(full_url, headers={"Cookie": COOKIE})
    data = await extract_course_cec_data(response.text)
    return data


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
    url = "a/AA310A2971.html"
    full_url = f"https://www.washington.edu/cec/{url}"
    async with httpx.AsyncClient() as client:
        response = await client.get(full_url, headers={"Cookie": COOKIE})
    data = await extract_course_cec_data(response.text)
    print(data)


if __name__ == "__main__":
    asyncio.run(main())
    # asyncio.run(test_scrape())
    # asyncio.run(test_extract_course_cec_data())
