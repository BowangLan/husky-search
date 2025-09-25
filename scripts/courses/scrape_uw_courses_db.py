import httpx
import json
from lxml import html
import asyncio
from rich import print
import re
import time
from pathlib import Path
from scripts.db import with_db, COURSES_TABLE
from scripts.db_queries import get_all_courses_with_id


def extract_links_under_h2(html_content: str) -> list[str]:
    """
    Extracts all links under h2 headings using XPath
    Args:
        html_content: The HTML string to parse
    Returns:
        Array of link URLs found under h2 headings
    """
    # Parse HTML
    doc = html.fromstring(html_content)

    # Use XPath to select all links
    links = list(
        map(
            lambda x: {
                "href": x.attrib["href"],
                "text": x.text,
            },
            doc.xpath("//h2/following-sibling::ul//a"),
        )
    )

    links = list(
        filter(
            lambda x: x["href"] is not None and not x["href"].startswith("#"),
            links,
        )
    )

    # Extract href values
    return links


async def scrape_catalog_pages() -> None:
    """
    Scrapes the UW course catalog starting page
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get("https://www.washington.edu/students/crscat/")
            response.raise_for_status()
            data = response.text

            # Extract links from the HTML
            links = extract_links_under_h2(data)

            print(f"Scraped {len(links)} department links")

            return links

        except httpx.RequestError as e:
            print(f"Error making request: {e}")
        except Exception as e:
            print(f"Error: {e}")


async def scrape_courses_from_catelog_detail_page(url: str) -> None:
    """
    Scrapes a single catalog page
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()

        doc = html.fromstring(response.text)

        # print out the structure of the html
        # print(html.tostring(doc.xpath("//b/../../p/a")[0], pretty_print=True).decode("utf-8"))

        # xpath = "//a/@name"
        xpath = "//b"
        links = list(
            map(
                lambda x: {
                    "name": x.text,
                    # "code": x.xpath("../../@name"),
                    "code": x.xpath("./../../@name"),
                    "myplan_url": x.xpath("./../../p/a/@href"),
                    "description": x.xpath("../text()"),
                    # "url": x.xpath("../following-sibling::*/text()"),
                    # "html": x.xpath("../../text()"),
                    # "myplan": x.xpath("../../following-sibling::a/@href"),
                },
                doc.xpath(xpath),
            )
        )

        links = list(
            filter(
                lambda x: len(x["code"]) > 0,
                links,
            )
        )
        new_links = []
        for x in links:
            description = ""
            if len(x["description"]) > 0:
                description = x["description"][0]

            quarters = ""
            if "Offered: " in description:
                quarters = description.split("Offered: ")[1].split(".")[0]

            new_link = {
                **x,
                "code": x["code"][0],
                "description": description,
                "myplan_code": x["myplan_url"][0].split("/")[-1]
                if len(x["myplan_url"]) > 0
                else "",
                "myplan_url": x["myplan_url"][0] if len(x["myplan_url"]) > 0 else "",
                "name": x["name"].strip(),
                "credits": re.search(r"\(([^)]+)\)", x["name"]).group(1)
                if re.search(r"\(([^)]+)\)", x["name"])
                else "",
                "quarters": quarters,
                "subject": x["code"][0][:-3].upper(),
                "number": x["code"][0][-3:],
            }
            new_links.append(new_link)
        links = new_links

        # with open("uw-2.html", "w", encoding="utf-8") as f:
        #     f.write(response.text)

        # with open("uw-2.json", "w", encoding="utf-8") as f:
        #     json.dump({"courseLinks": links}, f, indent=2)

        print(f"Scraped {len(links)} course links for {url}")

        return links


@with_db
def batch_update_course_myplan_code(conn, cursor, params: list[dict]) -> None:
    cursor.executemany(
        f"""UPDATE {COURSES_TABLE} SET "myplanCode" = %s WHERE id = %s""",
        [(param["myplan_code"], param["id"]) for param in params],
    )
    conn.commit()


@with_db
def batch_insert_courses(conn, cursor, params: list[dict]) -> None:
    cursor.executemany(
        f"""
        INSERT INTO {COURSES_TABLE} 
        ("code", "myplanCode", "title", "description", "credit", "subject", "number", "quarters", "programCode") 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        [
            (
                param["code"],
                param["myplan_code"],
                param["name"],
                param["description"],
                param["credits"],
                param["subject"],
                param["number"],
                param["quarters"],
                param["program_code"],
            )
            for param in params
        ],
    )
    conn.commit()


async def run_upload():
    all_db_courses = get_all_courses_with_id()
    db_course_map = {
        course["code"].replace(" ", "").lower(): course for course in all_db_courses
    }

    with open("temp/uw-courses.json", "r", encoding="utf-8") as f:
        programs = json.load(f)

    update_params = []
    insert_params = []

    for program in programs:
        for course in program["courses"]:
            course_code = course["code"]
            if course_code in db_course_map:
                update_params.append(
                    {
                        "id": db_course_map[course["code"]]["id"],
                        "myplan_code": course["myplan_code"],
                    }
                )
            else:
                insert_params.append(
                    {
                        **course,
                        "program_code": program["href"].split(".")[0],
                    }
                )

    print(f"Found {len(update_params)} courses to update")
    print(f"Found {len(insert_params)} courses to insert")

    batch_size = 100
    # for i in range(0, len(update_params), batch_size):
    #     batch_update_course_myplan_code(update_params[i : i + batch_size])
    #     print(f"({i + batch_size}/{len(update_params)}) Updated course myplan codes")

    for i in range(0, len(insert_params), batch_size):
        batch_insert_courses(insert_params[i : i + batch_size])
        print(f"({i + batch_size}/{len(insert_params)}) Inserted courses")


async def run_scrape() -> None:
    links = await scrape_catalog_pages()

    if not Path("temp").exists():
        Path("temp").mkdir(parents=True)

    # Save to JSON file
    # with open("uw-departments.json", "w", encoding="utf-8") as f:
    #     json.dump({"departmentLinks": links}, f, indent=2)
    # Create list of tasks for parallel execution
    tasks = [
        scrape_courses_from_catelog_detail_page(
            f"https://www.washington.edu/students/crscat/{link['href']}",
        )
        for link in links
    ]
    # Execute tasks in parallel and get results
    start_time = time.time()
    course_links_list = []
    for i in range(0, len(tasks), 5):
        batch = tasks[i : i + 5]
        batch_results = await asyncio.gather(*batch)
        course_links_list.extend(batch_results)
    print(
        f"Took {time.time() - start_time:.2f} seconds to scrape {len(course_links_list)} links"
    )

    # Assign results back to links
    for link, course_links in zip(links, course_links_list):
        link["courses"] = course_links

    with open("temp/uw-courses.json", "w", encoding="utf-8") as f:
        json.dump(links, f, indent=2)
        print(f"Saved {len(links)} courses to temp/uw-courses.json")


def load_uw_courses() -> list[dict]:
    with open("temp/uw-courses.json", "r", encoding="utf-8") as f:
        return json.load(f)


async def test_main():
    info_courses = await scrape_courses_from_catelog_detail_page(
        "https://www.washington.edu/students/crscat/bse.html"
    )

    db_courses = get_all_courses_with_id()
    db_course_map = {
        course["code"].replace(" ", "").lower(): course for course in db_courses
    }

    update_params = [
        {
            "id": db_course_map[course["code"].replace(" ", "").lower()]["id"],
            "myplan_code": course["myplan_code"],
        }
        for course in info_courses
    ]
    batch_update_course_myplan_code(update_params)
    print("Updated course myplan codes for BSE")


if __name__ == "__main__":
    asyncio.run(test_main())
    # asyncio.run(run_scrape())
    # asyncio.run(run_upload())
    print("Scraping completed")
