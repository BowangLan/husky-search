import httpx
import json
from lxml import html
import asyncio
from rich import print
import re
import time
from pathlib import Path


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


async def scrape_catalog_page(url: str) -> None:
    """
    Scrapes a single catalog page
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()

        doc = html.fromstring(response.text)

        # xpath = "//a/@name"
        xpath = "//b"
        links = list(
            map(
                lambda x: {
                    "name": x.text,
                    # "code": x.xpath("../../@name"),
                    "code": x.xpath("./../../@name"),
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


async def main() -> None:
    links = await scrape_catalog_pages()

    if not Path("temp").exists():
        Path("temp").mkdir(parents=True)

    # Save to JSON file
    # with open("uw-departments.json", "w", encoding="utf-8") as f:
    #     json.dump({"departmentLinks": links}, f, indent=2)
    # Create list of tasks for parallel execution
    tasks = [
        scrape_catalog_page(
            f"https://www.washington.edu/students/crscat/{link['href']}"
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


def load_uw_courses() -> list[dict]:
    with open("temp/uw-courses.json", "r", encoding="utf-8") as f:
        return json.load(f)


if __name__ == "__main__":
    asyncio.run(main())
    print("Scraping completed")
