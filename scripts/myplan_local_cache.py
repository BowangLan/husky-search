from scripts.cache import DistributedCacheController


myplan_search_result_cache_controller = DistributedCacheController(
    "temp/sync_myplan_courses/myplan_search_result"
)
myplan_search_result_cache_controller.load()
