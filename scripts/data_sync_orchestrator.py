# sync_orchestrator.py
import asyncio
import signal
import sys
import time
from typing import List, Dict, Any, Callable, Optional, TypeVar, Generic
from dataclasses import dataclass, asdict
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

T = TypeVar("T")


@dataclass
class SyncConfig:
    """Configuration for data synchronization"""

    name: str  # Display name for the sync operation
    batch_delay: float = 1.0  # Delay between API calls
    batch_size: int = 1  # Number of concurrent operations per batch
    show_progress: bool = True
    show_stats: bool = True
    cache_location: Optional[str] = None


@dataclass
class SyncStats:
    """Statistics tracking for sync operations"""

    total: int = 0
    processed: int = 0
    skipped: int = 0
    errors: int = 0
    total_items_found: int = 0
    total_time: float = 0.0
    concurrent_batches: int = 0

    @property
    def avg_time(self) -> float:
        return self.total_time / self.total if self.total > 0 else 0

    @property
    def avg_items(self) -> float:
        return self.total_items_found / self.processed if self.processed > 0 else 0


class DataSyncOrchestrator(Generic[T]):
    """Generic orchestrator for syncing data with caching and progress tracking"""

    def __init__(self, config: SyncConfig):
        self.config = config
        self.console = Console()
        self.shutdown_requested = False
        self.stats = SyncStats()

        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handle Ctrl+C gracefully"""
        if not self.shutdown_requested:
            self.shutdown_requested = True
            self.console.print(
                "\n\n[bold yellow]⚠️  Shutdown requested...[/bold yellow]"
            )
            self.console.print(
                "[dim]Waiting for current operation to complete...[/dim]"
            )
        else:
            self.console.print("\n[bold red]🛑 Force exit requested[/bold red]")
            sys.exit(1)

    async def sync(
        self,
        items: List[T],
        fetch_func: Callable[[T], Any],  # Async function to fetch data
        cache_controller: Any,  # Cache controller with get/set methods
        get_cache_key: Callable[[T], str],  # Function to get cache key from item
        get_display_name: Callable[[T], str],  # Function to get display name
        should_skip: Optional[Callable[[T, Any], bool]] = None,  # Custom skip logic
        transform_result: Optional[
            Callable[[Any], Any]
        ] = None,  # Transform before caching
    ) -> SyncStats:
        """
        Generic sync method

        Args:
            items: List of items to process
            fetch_func: Async function that takes an item and returns data
            cache_controller: Object with get(key) and set(key, value) methods
            get_cache_key: Function to extract cache key from item
            get_display_name: Function to extract display name from item
            should_skip: Optional function to determine if item should be skipped
            transform_result: Optional function to transform result before caching
        """
        start_time = time.time()
        self.stats.total = len(items)

        self.console.print(
            Panel(
                f"Starting {self.config.name} sync for [bold cyan]{self.stats.total}[/bold cyan] items\n"
                f"Batch size: [bold blue]{self.config.batch_size}[/bold blue] concurrent operations",
                title=f"🚀 {self.config.name} Sync Started",
                border_style="green",
            )
        )

        if self.config.show_progress:
            await self._sync_with_progress(
                items,
                fetch_func,
                cache_controller,
                get_cache_key,
                get_display_name,
                should_skip,
                transform_result,
            )
        else:
            await self._sync_without_progress(
                items,
                fetch_func,
                cache_controller,
                get_cache_key,
                get_display_name,
                should_skip,
                transform_result,
            )

        # Calculate final statistics
        self.stats.total_time = time.time() - start_time

        if self.config.show_stats:
            self._print_stats()

        return self.stats

    async def _sync_with_progress(
        self,
        items,
        fetch_func,
        cache_controller,
        get_cache_key,
        get_display_name,
        should_skip,
        transform_result,
    ):
        """Sync with progress bar"""
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            MofNCompleteColumn(),
            BarColumn(),
            TaskProgressColumn(),
            TimeElapsedColumn(),
            console=self.console,
        ) as progress:
            task = progress.add_task(
                f"[cyan]Processing items...", total=self.stats.total
            )

            await self._process_items_concurrent(
                items,
                fetch_func,
                cache_controller,
                get_cache_key,
                get_display_name,
                should_skip,
                transform_result,
                progress,
                task,
            )

    async def _sync_without_progress(
        self,
        items,
        fetch_func,
        cache_controller,
        get_cache_key,
        get_display_name,
        should_skip,
        transform_result,
    ):
        """Sync without progress bar"""
        await self._process_items_concurrent(
            items,
            fetch_func,
            cache_controller,
            get_cache_key,
            get_display_name,
            should_skip,
            transform_result,
        )

    async def _process_items_concurrent(
        self,
        items,
        fetch_func,
        cache_controller,
        get_cache_key,
        get_display_name,
        should_skip,
        transform_result,
        progress=None,
        task=None,
    ):
        """Process items concurrently in batches"""
        # Process items in batches
        for i in range(0, len(items), self.config.batch_size):
            if self.shutdown_requested:
                self.console.print(
                    "\n[bold yellow]⚠️ Shutdown requested, stopping gracefully...[/bold yellow]"
                )
                break

            batch = items[i : i + self.config.batch_size]
            self.stats.concurrent_batches += 1

            if progress:
                progress.update(
                    task,
                    description=f"[cyan]Processing batch {self.stats.concurrent_batches} ({len(batch)} items)...",
                )

            # Process batch concurrently
            tasks = [
                self._process_single_item(
                    item,
                    fetch_func,
                    cache_controller,
                    get_cache_key,
                    get_display_name,
                    should_skip,
                    transform_result,
                )
                for item in batch
            ]

            # Wait for all tasks in the batch to complete
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Update progress for the entire batch
            if progress:
                progress.advance(task, len(batch))

            # Rate limiting between batches
            if self.config.batch_delay > 0 and i + self.config.batch_size < len(items):
                await asyncio.sleep(self.config.batch_delay)

    async def _process_single_item(
        self,
        item,
        fetch_func,
        cache_controller,
        get_cache_key,
        get_display_name,
        should_skip,
        transform_result,
    ):
        """Process a single item"""
        cache_key = get_cache_key(item)
        display_name = get_display_name(item)

        # Check cache
        if cache_controller.get(cache_key) is not None:
            self.console.print(
                f"[dim]⏭️ Skipping {display_name} (already cached)[/dim]"
            )
            self.stats.skipped += 1
            return

        try:
            result = await fetch_func(item)

            # Custom skip logic
            if should_skip and should_skip(item, result):
                self.console.print(
                    f"[dim]⏭️ Skipping {display_name} (custom skip logic)[/dim]"
                )
                self.stats.skipped += 1
                return

            # Transform result if needed
            if transform_result:
                result = transform_result(result)

            # Cache the result
            cache_controller.set(cache_key, result)

            # Update stats
            item_count = (
                1
                if isinstance(result, dict)
                else len(result)
                if hasattr(result, "__len__")
                else 1
            )
            self.stats.total_items_found += item_count
            self.stats.processed += 1

            self.console.print(
                f"[green]✅ {display_name}[/green] - Found [bold]{item_count}[/bold] items"
            )

        except Exception as e:
            self.console.print(
                f"[red]❌ Error processing {display_name}: {str(e)}[/red]"
            )
            self.stats.errors += 1

    async def _process_items(
        self,
        items,
        fetch_func,
        cache_controller,
        get_cache_key,
        get_display_name,
        should_skip,
        transform_result,
        progress=None,
        task=None,
    ):
        """Process all items sequentially (legacy method)"""
        for item in items:
            if self.shutdown_requested:
                self.console.print(
                    "\n[bold yellow]⚠️  Shutdown requested, stopping gracefully...[/bold yellow]"
                )
                break

            cache_key = get_cache_key(item)
            display_name = get_display_name(item)

            if progress:
                progress.update(task, description=f"[cyan]Processing {display_name}...")

            # Check cache
            if cache_controller.get(cache_key) is not None:
                self.console.print(
                    f"[dim]⏭️  Skipping {display_name} (already cached)[/dim]"
                )
                self.stats.skipped += 1
                if progress:
                    progress.advance(task)
                continue

            try:
                result = await fetch_func(item)

                # Custom skip logic
                if should_skip and should_skip(item, result):
                    self.console.print(
                        f"[dim]⏭️  Skipping {display_name} (custom skip logic)[/dim]"
                    )
                    self.stats.skipped += 1
                    if progress:
                        progress.advance(task)
                    continue

                # Transform result if needed
                if transform_result:
                    result = transform_result(result)

                # Cache the result
                cache_controller.set(cache_key, result)

                # Update stats
                item_count = len(result) if hasattr(result, "__len__") else 1
                self.stats.total_items_found += item_count
                self.stats.processed += 1

                self.console.print(
                    f"[green]✅ {display_name}[/green] - Found [bold]{item_count}[/bold] items"
                )

                # Rate limiting
                if self.config.batch_delay > 0:
                    await asyncio.sleep(self.config.batch_delay)

            except Exception as e:
                self.console.print(
                    f"[red]❌ Error processing {display_name}: {str(e)}[/red]"
                )
                self.stats.errors += 1

            if progress:
                progress.advance(task)

    def _print_stats(self):
        """Print final statistics"""
        table = Table(
            title=f"📊 {self.config.name} Sync Statistics",
            show_header=True,
            header_style="bold magenta",
        )
        table.add_column("Metric", style="cyan", no_wrap=True)
        table.add_column("Value", style="green")
        table.add_column("Details", style="dim")

        table.add_row("Total Items", str(self.stats.total), "Items processed")
        table.add_row("Processed", str(self.stats.processed), "New API calls made")
        table.add_row("Skipped (Cached)", str(self.stats.skipped), "Already in cache")
        table.add_row(
            "Total Items Found", str(self.stats.total_items_found), "Across all items"
        )
        table.add_row(
            "Average Items/Item",
            f"{self.stats.avg_items:.1f}",
            "Items per processed item",
        )
        table.add_row(
            "Concurrent Batches",
            str(self.stats.concurrent_batches),
            "Batches processed",
        )
        table.add_row(
            "Total Time", f"{self.stats.total_time:.2f}s", "Total execution time"
        )
        table.add_row(
            "Average Time/Item", f"{self.stats.avg_time:.2f}s", "Time per item"
        )

        self.console.print(table)

        if self.config.cache_location:
            cache_info = Panel(
                f"Cache Location: [cyan]{self.config.cache_location}[/cyan]\n"
                f"Cache Status: [green]Active[/green]",
                title="💾 Cache Information",
                border_style="blue",
            )
            self.console.print(cache_info)

        # Print summary
        if self.stats.errors == 0:
            self.console.print(
                Panel(
                    f"🎉 Sync completed successfully!\n"
                    f"Processed [bold green]{self.stats.processed}[/bold green] items\n"
                    f"Found [bold blue]{self.stats.total_items_found}[/bold blue] total items\n"
                    f"Used [bold yellow]{self.stats.concurrent_batches}[/bold yellow] concurrent batches",
                    title="✅ Sync Complete",
                    border_style="green",
                )
            )
        else:
            self.console.print(
                Panel(
                    f"⚠️  Sync completed with [bold red]{self.stats.errors}[/bold red] errors\n"
                    f"Processed [bold green]{self.stats.processed}[/bold green] items\n"
                    f"Found [bold blue]{self.stats.total_items_found}[/bold blue] total items\n"
                    f"Used [bold yellow]{self.stats.concurrent_batches}[/bold yellow] concurrent batches",
                    title="⚠️  Sync Complete (with errors)",
                    border_style="yellow",
                )
            )
