def duplicate_check(l: list, key_fn, no_print=False):
    all_map = {}
    du_map = {}
    unique_map = {}
    for item in l:
        key = key_fn(item)
        if key in all_map:
            if key in unique_map:
                del unique_map[key]
            if key not in du_map:
                du_map[key] = [all_map[key], item]
            else:
                du_map[key].append(item)
        else:
            all_map[key] = item
            unique_map[key] = item

    if not no_print:
        print(f"Found {len(du_map)} duplicates\n")
    for key, items in du_map.items():
        if not no_print:
            print(f"\n{key}: {len(items)}")
            for item in items:
                print(f"  {item}")

    du_item_count = sum(len(items) for items in du_map.values())

    print()
    if len(du_map) > 0:
        print(
            f"⚠️ Found {du_item_count} duplicates with {len(du_map)} unique keys out of {len(all_map)} keys"
        )
        print(f"Unique keys: {len(unique_map)}")
        print(f"All keys: {len(all_map)}")
    else:
        print("✅ No duplicates found")

    return du_map, unique_map, all_map
