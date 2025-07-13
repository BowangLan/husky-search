# Course Updater Documentation

This document explains how to use the refactored `CourseUpdater` class for updating course fields in the PostgreSQL database.

## Overview

The refactored code provides a flexible, reusable solution for updating course fields with the following features:

- **Abstract data sources**: Support for local JSON files and remote APIs
- **Progress tracking**: Resume interrupted updates
- **Batch processing**: Configurable batch sizes for optimal performance
- **Error handling**: Robust error handling with rollback support
- **Field-specific updates**: Separate functions for different field types

## Key Components

### 1. DataSource Classes

#### LocalJsonDataSource
```python
from update_course_1 import LocalJsonDataSource

# Basic usage
data_source = LocalJsonDataSource("temp/uw-courses.json")

# With data transformer
data_source = LocalJsonDataSource(
    file_path="temp/uw-courses.json",
    data_transformer=flatten_courses
)
```

#### RemoteDataSource (Future Implementation)
```python
from update_course_1 import RemoteDataSource

data_source = RemoteDataSource(
    url="https://api.example.com/courses",
    headers={"Authorization": "Bearer your-token"}
)
```

### 2. CourseUpdater Class

The main class that handles the update process:

```python
from update_course_1 import CourseUpdater

updater = CourseUpdater(
    data_source=data_source,
    progress_file="temp/updated-courses.json",
    batch_size=100
)
```

## Usage Examples

### Basic Title Update

```python
from update_course_1 import (
    CourseUpdater, 
    LocalJsonDataSource,
    update_courses_title,
    transform_title_data,
    flatten_courses
)

# Create data source
data_source = LocalJsonDataSource(
    file_path="temp/uw-courses.json",
    data_transformer=flatten_courses
)

# Create updater
updater = CourseUpdater(
    data_source=data_source,
    progress_file="temp/uw-courses-title-updated.json",
    batch_size=100
)

# Update titles
updater.update_courses(
    update_function=update_courses_title,
    data_transformer=transform_title_data,
    field_name="titles"
)
```

### Update Different Fields

#### Descriptions
```python
updater.update_courses(
    update_function=update_courses_description,
    data_transformer=transform_description_data,
    field_name="descriptions"
)
```

#### Credits
```python
updater.update_courses(
    update_function=update_courses_credits,
    data_transformer=transform_credits_data,
    field_name="credits"
)
```

### Custom Data Transformer

For different data formats, create custom transformers:

```python
def custom_title_transformer(course):
    return {
        "code": course["course_code"],
        "title": course["course_title"].upper()
    }

updater.update_courses(
    update_function=update_courses_title,
    data_transformer=custom_title_transformer,
    field_name="custom titles"
)
```

### Multiple Field Updates

```python
# Update titles
title_updater = CourseUpdater(
    data_source=data_source,
    progress_file="temp/uw-courses-title-updated.json"
)
title_updater.update_courses(
    update_function=update_courses_title,
    data_transformer=transform_title_data,
    field_name="titles"
)

# Update descriptions
desc_updater = CourseUpdater(
    data_source=data_source,
    progress_file="temp/uw-courses-description-updated.json"
)
desc_updater.update_courses(
    update_function=update_courses_description,
    data_transformer=transform_description_data,
    field_name="descriptions"
)
```

## Creating New Update Functions

To add support for new fields, create update functions following this pattern:

```python
def update_courses_new_field(cursor, courses: List[Dict[str, Any]]):
    """Update course new_field"""
    sql = """
        UPDATE uw_courses 
        SET new_field = %s
        WHERE code = %s
    """
    cursor.executemany(
        sql,
        [(course["new_field"], course["code"]) for course in courses],
    )
```

And corresponding transformer:

```python
def transform_new_field_data(course: Dict[str, Any]) -> Dict[str, Any]:
    """Transform course data for new_field updates"""
    return {
        "code": course["code"],
        "new_field": course.get("new_field", "")
    }
```

## Progress Tracking

The updater automatically tracks progress in JSON files:

- **Resume capability**: Interrupted updates can be resumed
- **Separate tracking**: Each field type has its own progress file
- **Automatic cleanup**: Progress is saved after each batch

## Error Handling

The updater includes robust error handling:

- **Database rollback**: Failed updates are rolled back
- **Progress preservation**: Progress is saved before each batch
- **Detailed logging**: Clear error messages with field context

## Configuration

### Environment Variables

Ensure your `.env` file contains:
```
DATABASE_URL=postgresql://user:password@localhost:5432/database
```

### Batch Sizes

Choose appropriate batch sizes based on your data:

- **Small data**: 50-100 records
- **Large data**: 200-500 records
- **Complex updates**: Smaller batches for better error recovery

## Best Practices

1. **Test with small datasets first**
2. **Use separate progress files for different field types**
3. **Monitor database performance during large updates**
4. **Backup your database before major updates**
5. **Use appropriate batch sizes for your data volume**

## Troubleshooting

### Common Issues

1. **Database connection errors**: Check `DATABASE_URL` in `.env`
2. **File not found**: Ensure data files exist in specified paths
3. **Progress file corruption**: Delete progress file to restart
4. **Memory issues**: Reduce batch size for large datasets

### Debug Mode

Add debug prints to transformers:

```python
def debug_transformer(course):
    print(f"Processing course: {course}")
    return transform_title_data(course)
```

## Future Enhancements

- [ ] Implement RemoteDataSource with actual HTTP requests
- [ ] Add support for CSV data sources
- [ ] Add validation for data formats
- [ ] Implement parallel processing for large datasets
- [ ] Add support for conditional updates 