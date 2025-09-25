import httpx
import json
from lxml import html
import asyncio
from rich import print
import re
import time
from pathlib import Path


CAMPUSES = {
    "seattle": {
        "name": "Seattle",
        "url": "https://www.washington.edu/students/crscat/",
        "code": "seattle",
    },
    "tacoma": {
        "name": "Tacoma",
        "url": "https://www.washington.edu/students/crscatt/",
        "code": "tacoma",
    },
    "bothell": {
        "name": "Bothell",
        "url": "https://www.washington.edu/students/crscatb/",
        "code": "bothell",
    },
}


def extract_links_under_h2(html_content: str) -> list[dict]:
    """
    Extracts all links under h2 headings using XPath
    """
    doc = html.fromstring(html_content)

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

    return links


async def scrape_courses_from_catalog_page(
    url: str, campus_code: str = "seattle"
) -> list[dict]:
    """
    Scrapes courses from a single catalog page - using exact logic from original script
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()

        doc = html.fromstring(response.text)

        # Use exact xpath from original script
        xpath = "//b"
        links = list(
            map(
                lambda x: {
                    "name": x.text,
                    "code": x.xpath("./../../@name"),
                    "myplan_url": x.xpath("./../../p/a/@href"),
                    "description": x.xpath("../text()"),
                },
                doc.xpath(xpath),
            )
        )

        # Filter out entries without code (exact logic from original)
        links = list(
            filter(
                lambda x: len(x["code"]) > 0,
                links,
            )
        )

        # Process links exactly like original script
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
                "name": x["name"].strip() if x["name"] else "",
                "credits": re.search(r"\(([^)]+)\)", x["name"]).group(1)
                if x["name"] and re.search(r"\(([^)]+)\)", x["name"])
                else "",
                "quarters": quarters,
                "subject": x["code"][0][:-3].upper() if len(x["code"][0]) > 3 else "",
                "number": x["code"][0][-3:] if len(x["code"][0]) > 3 else "",
            }
            new_links.append(new_link)

        # Convert to desired format
        courses = []
        for link in new_links:
            course = {
                "uwCourseCode": link["code"],
                "myplanCode": link["myplan_code"],
                "myplanUrl": link["myplan_url"],
                "title": link["name"],
                "description": link["description"],
                "credits": link["credits"],
                "quarters": link["quarters"],
                "subject": link["subject"],
                "number": link["number"],
                "campus": campus_code,
            }

            # Only add courses that have myplan codes
            if link["myplan_code"]:
                courses.append(course)

        print(f"Scraped {len(courses)} courses from {url}")
        return courses


async def scrape_all_uw_courses(campuses: list[str] = None) -> list[dict]:
    """
    Main function to scrape all UW courses from the catalog
    """
    if campuses is None:
        campuses = ["seattle"]  # Default to Seattle campus

    print(f"Starting UW course catalog scraping for campuses: {', '.join(campuses)}...")

    all_courses = []

    for campus_code in campuses:
        if campus_code not in CAMPUSES:
            print(f"Unknown campus: {campus_code}. Skipping.")
            continue

        campus = CAMPUSES[campus_code]
        print(f"\nScraping {campus['name']} campus...")

        # Get department links for this campus
        async with httpx.AsyncClient() as client:
            response = await client.get(campus["url"])
            response.raise_for_status()

            department_links = extract_links_under_h2(response.text)
            print(
                f"Found {len(department_links)} department links for {campus['name']}"
            )

        # Create temp directory if it doesn't exist
        if not Path("temp").exists():
            Path("temp").mkdir(parents=True)

        # Process departments in batches to avoid overwhelming the server
        batch_size = 10
        for i in range(0, len(department_links), batch_size):
            batch = department_links[i : i + batch_size]
            print(
                f"Processing batch {i // batch_size + 1}/{(len(department_links) + batch_size - 1) // batch_size} for {campus['name']}"
            )

            # Create tasks for this batch
            tasks = [
                scrape_courses_from_catalog_page(
                    f"{campus['url']}{link['href']}", campus_code
                )
                for link in batch
            ]

            # Execute batch in parallel
            try:
                batch_results = await asyncio.gather(*tasks, return_exceptions=True)

                for result in batch_results:
                    if isinstance(result, Exception):
                        print(f"Error in batch: {result}")
                    else:
                        all_courses.extend(result)

            except Exception as e:
                print(f"Error processing batch: {e}")

            # Add delay between batches
            if i + batch_size < len(department_links):
                await asyncio.sleep(1)

    print(f"Total courses scraped: {len(all_courses)}")

    # Save to JSON file
    output_file = "temp/all_uw_courses.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(
            {
                "courses": all_courses,
                "total_count": len(all_courses),
                "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            },
            f,
            indent=2,
            ensure_ascii=False,
        )

    print(f"Saved {len(all_courses)} courses to {output_file}")
    return all_courses


async def test_single_department(campus_code: str = "seattle"):
    """
    Test function to scrape a single department
    """
    if campus_code not in CAMPUSES:
        print(f"Unknown campus: {campus_code}")
        return

    campus = CAMPUSES[campus_code]
    print(f"Testing with INFO department on {campus['name']} campus...")
    courses = await scrape_courses_from_catalog_page(
        f"{campus['url']}info.html", campus_code
    )

    print(f"Found {len(courses)} INFO courses")
    for course in courses[:3]:  # Show first 3 courses
        print(
            f"  {course['uwCourseCode']} -> {course['myplanCode']}: {course['title'][:50]}... (Campus: {course['campus']})"
        )


if __name__ == "__main__":
    # Uncomment to test with single department first
    # asyncio.run(test_single_department("seattle"))
    # asyncio.run(test_single_department("tacoma"))
    # asyncio.run(test_single_department("bothell"))

    # Run full scrape for all campuses
    start_time = time.time()
    # asyncio.run(scrape_all_uw_courses(["seattle", "tacoma", "bothell"]))
    # asyncio.run(scrape_all_uw_courses(["seattle"]))
    # asyncio.run(scrape_all_uw_courses(["tacoma"]))
    asyncio.run(scrape_all_uw_courses(["bothell"]))
    print(f"Total scraping time: {time.time() - start_time:.2f} seconds")
