import asyncio
import signal
import sys
from scripts.myplan_api import MyPlanApiClient
from scripts.db_queries import (
    get_subject_areas_from_db,
)
from rich import print
from rich.console import Console
from rich.progress import (
    Progress,
    SpinnerColumn,
    TextColumn,
    BarColumn,
    MofNCompleteColumn,
    TaskProgressColumn,
    TimeElapsedColumn,
)
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.live import Live
from rich.align import Align
from dataclasses import asdict
import time

from scripts.utils import duplicate_check
from scripts.cache import LocalCacheController, DistributedCacheController
from scripts.myplan_local_cache import myplan_search_result_cache_controller

# Configure console
console = Console()

# Global flag for graceful shutdown
shutdown_requested = False

# cache_controller = LocalCacheController("temp/sync_myplan_courses.json")
# cache_controller = DistributedCacheController("temp/sync_myplan_courses")
# cache_controller.load()


def signal_handler(signum, frame):
    """Handle Ctrl+C gracefully"""
    global shutdown_requested
    if not shutdown_requested:
        shutdown_requested = True
        console.print("\n\n[bold yellow]⚠️  Shutdown requested...[/bold yellow]")
        console.print("[dim]Waiting for current operation to complete...[/dim]")
    else:
        console.print("\n[bold red]🛑 Force exit requested[/bold red]")
        sys.exit(1)


# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)


def print_stats(stats):
    """Print final statistics in a beautiful table"""
    table = Table(
        title="📊 MyPlan Sync Statistics", show_header=True, header_style="bold magenta"
    )
    table.add_column("Metric", style="cyan", no_wrap=True)
    table.add_column("Value", style="green")
    table.add_column("Details", style="dim")

    table.add_row("Total Subject Areas", str(stats["total"]), "Subject areas processed")
    table.add_row("Processed", str(stats["processed"]), "New API calls made")
    table.add_row("Skipped (Cached)", str(stats["skipped"]), "Already in cache")
    table.add_row(
        "Total Courses Found", str(stats["total_courses"]), "Across all subject areas"
    )
    table.add_row(
        "Average Courses/Subject",
        f"{stats['avg_courses']:.1f}",
        "Courses per subject area",
    )
    table.add_row("Total Time", f"{stats['total_time']:.2f}s", "Total execution time")
    table.add_row(
        "Average Time/Subject", f"{stats['avg_time']:.2f}s", "Time per subject area"
    )

    console.print(table)

    # Print cache info
    cache_info = Panel(
        f"Cache Location: [cyan]temp/sync_myplan_courses/myplan_search_result[/cyan]\n"
        f"Cache Status: [green]Active[/green]",
        title="💾 Cache Information",
        border_style="blue",
    )
    console.print(cache_info)


async def main():
    start_time = time.time()
    client = MyPlanApiClient()
    subject_areas = get_subject_areas_from_db()

    # Initialize statistics
    stats = {
        "total": len(subject_areas),
        "processed": 0,
        "skipped": 0,
        "total_courses": 0,
        "errors": 0,
    }

    console.print(
        Panel(
            f"Starting MyPlan sync for [bold cyan]{stats['total']}[/bold cyan] subject areas",
            title="🚀 MyPlan Sync Started",
            border_style="green",
        )
    )

    # Create progress bar
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        MofNCompleteColumn(),
        BarColumn(),
        TaskProgressColumn(),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task(
            "[cyan]Processing subject areas...", total=stats["total"]
        )

        for sa in subject_areas:
            if shutdown_requested:
                console.print(
                    "\n[bold yellow]⚠️  Shutdown requested, stopping gracefully...[/bold yellow]"
                )
                break

            progress.update(task, description=f"[cyan]Processing {sa['code']}...")

            if myplan_search_result_cache_controller.get(sa["code"]) is not None:
                console.print(f"[dim]⏭️  Skipping {sa['code']} (already cached)[/dim]")
                stats["skipped"] += 1
                progress.advance(task)
                continue

            try:
                courses = await client.search_courses(sa["quotedCode"])
                if not courses:
                    console.print(
                        f"[dim]⏭️  Skipping {sa['code']} (no courses found)[/dim]"
                    )
                    stats["skipped"] += 1
                    progress.advance(task)
                    continue

                myplan_search_result_cache_controller.set(
                    sa["code"], [asdict(c) for c in courses]
                )

                course_count = len(courses) if courses else 0
                stats["total_courses"] += course_count
                stats["processed"] += 1

                console.print(
                    f"[green]✅ {sa['code']}[/green] - Found [bold]{course_count}[/bold] courses"
                )

                await asyncio.sleep(1)

            except Exception as e:
                console.print(f"[red]❌ Error processing {sa['code']}: {str(e)}[/red]")
                stats["errors"] += 1

            progress.advance(task)

    # Calculate final statistics
    end_time = time.time()
    total_time = end_time - start_time

    stats.update(
        {
            "total_time": total_time,
            "avg_time": total_time / stats["total"] if stats["total"] > 0 else 0,
            "avg_courses": stats["total_courses"] / stats["processed"]
            if stats["processed"] > 0
            else 0,
        }
    )

    # Print final statistics
    console.print("\n" + "=" * 60)
    print_stats(stats)

    # Print summary message
    if stats["errors"] == 0:
        console.print(
            Panel(
                f"🎉 Sync completed successfully!\n"
                f"Processed [bold green]{stats['processed']}[/bold green] subject areas\n"
                f"Found [bold blue]{stats['total_courses']}[/bold blue] total courses",
                title="✅ Sync Complete",
                border_style="green",
            )
        )
    else:
        console.print(
            Panel(
                f"⚠️  Sync completed with [bold red]{stats['errors']}[/bold red] errors\n"
                f"Processed [bold green]{stats['processed']}[/bold green] subject areas\n"
                f"Found [bold blue]{stats['total_courses']}[/bold blue] total courses",
                title="⚠️  Sync Complete (with errors)",
                border_style="yellow",
            )
        )


if __name__ == "__main__":
    asyncio.run(main())
