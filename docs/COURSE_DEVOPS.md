# Course Database DevOps Operations

This document covers operational scripts and utilities for managing your course database in Convex.

## Overview

These scripts help with database maintenance, monitoring, and data export operations for the myplanCourses table.

## Export Operations

### Export All Course Codes as Static Assets

**Commands**:

```bash
uv run python -m scripts.courses.export_convex_course_codes -o public/course_codes.json
```

### Export All Subject Areas as Static Assets

**Commands**:

```bash
uv run python -m scripts.courses.export_convex_subject_areas -o public/subject_areas.json --compressed
```


### Export All Subject Areas

**Purpose**: Export all subject areas from your Convex myplanSubjects table with codes and titles.

**Script**: `scripts/courses/export_convex_subject_areas.py`

**Commands**:

```bash
# Basic export (saves to temp/convex_subject_areas.json)
uv run python -m scripts.courses.export_convex_subject_areas

# Custom output file
uv run python -m scripts.courses.export_convex_subject_areas -o my_subject_areas.json

# Export with detailed analysis
uv run python -m scripts.courses.export_convex_subject_areas --analyze
```

**Output Format**:
```json
[
  {
    "code": "AMATH",
    "title": "Applied Mathematics"
  },
  {
    "code": "ANTH",
    "title": "Anthropology"
  },
  {
    "code": "ARCH",
    "title": "Architecture"
  },
  {
    "code": "CSE",
    "title": "Computer Science & Engineering"
  },
  ...
]
```

**Analysis Features** (with `--analyze` flag):
- Code length distribution
- Title length statistics (average, min, max)
- Longest and shortest subject titles
- Total count and file size

**Example Analysis Output**:
```
📊 Subject Area Analysis:
  Code length distribution:
    2 chars: 45 areas (28.7%)
    3 chars: 89 areas (56.7%)
    4 chars: 22 areas (14.0%)

  Title length statistics:
    Average: 24.3 characters
    Min: 7 characters
    Max: 58 characters

  Longest title: ENVIR - Environmental Science and Terrestrial Resource Management
  Shortest title: PHIL - Philosophy
```

### Export All Course Codes

**Purpose**: Export all existing course codes from your Convex myplanCourses table for analysis, backup, or integration purposes.

**Script**: `scripts/courses/export_convex_course_codes.py`

**Commands**:

```bash
# Basic export (saves to temp/convex_course_codes.json)
uv run python -m scripts.courses.export_convex_course_codes

# Custom output file
uv run python -m scripts.courses.export_convex_course_codes -o my_course_codes.json

# Export with detailed analysis
uv run python -m scripts.courses.export_convex_course_codes --analyze
```

**Output Format**:
```json
[
  "AMATH 301",
  "AMATH 352",
  "ANTH 100",
  "ARCH 150",
  "CSE 142",
  "INFO 200",
  ...
]
```

**Analysis Features** (with `--analyze` flag):
- Total course count and file size
- Top 10 subjects by course count
- Course level distribution (100s, 200s, 300s, 400s, 500+)
- Sample course codes preview

**Example Analysis Output**:
```
📊 Course Code Analysis:
  Total subjects: 156
  Top 10 subjects by course count:
    CSE: 234 courses
    MATH: 187 courses
    ENGL: 145 courses
    ...

  Course level distribution:
    100-199: 2,341 courses (23.4%)
    200-299: 2,876 courses (28.8%)
    300-399: 2,134 courses (21.3%)
    400-499: 1,789 courses (17.9%)
    500+: 860 courses (8.6%)
```

## Database Monitoring

### Course Code Duplication Checker

**Purpose**: Identify and optionally clean up duplicate course code entries in your Convex myplanCourses table.

**Script**: `scripts/courses/check_course_code_duplicates.py`

**Commands**:

```bash
# Basic duplicate check (no cleanup)
uv run python -m scripts.courses.check_course_code_duplicates

# Detailed analysis with duplicate examples
uv run python -m scripts.courses.check_course_code_duplicates --details --max-examples 20

# Custom output file for detailed report
uv run python -m scripts.courses.check_course_code_duplicates -o reports/duplicates.json

# Dry run cleanup (safe - shows what would be deleted)
uv run python -m scripts.courses.check_course_code_duplicates --cleanup

# Actual cleanup (DANGER - will delete data)
uv run python -m scripts.courses.check_course_code_duplicates --cleanup --no-dry-run

# Custom batch size for large cleanups
uv run python -m scripts.courses.check_course_code_duplicates --cleanup --no-dry-run --batch-size 50
```

**Analysis Output**:
```
📊 Duplicate Course Code Analysis:
  Total entries in database: 16,386
  Unique course codes: 15,755
  Duplicate course codes: 470
  Total duplicate entries: 1,101
  Courses without duplicates: 15,285
  Redundant entries that could be cleaned: 631
  Database cleanup potential: 3.85%
```

**Cleanup Features**:
- **Dry Run Mode** (default): Shows what would be deleted without making changes
- **Batched Deletion**: Processes deletions in configurable batches (default: 100)
- **Smart Duplicate Resolution**: Keeps first entry by ID, deletes redundant copies
- **Progress Reporting**: Real-time feedback on cleanup progress
- **Error Recovery**: Continues with remaining batches if individual batches fail

**Safety Features**:
- Defaults to dry run mode to prevent accidental deletions
- Requires explicit `--no-dry-run` flag for actual deletions
- Comprehensive logging and progress reporting
- CI/CD integration with proper exit codes

**JSON Report Format**:
```json
{
  "analysis_timestamp": "2025-09-22 09:30:39 UTC",
  "summary": {
    "total_entries": 16386,
    "unique_course_codes": 15755,
    "duplicate_course_codes": 470,
    "total_duplicate_entries": 1101,
    "unique_courses": 15285
  },
  "duplicates": {
    "BIOL 100": [
      {"id": "js7b8v8cazewtxmr1tttnjtjc97r1pvh", "courseCode": "BIOL 100"},
      {"id": "js7e3eym8zf2r3fkq4wc1n1mvn7r02p4", "courseCode": "BIOL 100"}
    ]
  },
  "recommendations": [...]
}
```

### Course Count Verification

**Use Case**: Verify course counts before and after imports

```bash
# Export with analysis to see current state
uv run python -m scripts.courses.export_convex_course_codes --analyze

# Check specific output for automated scripts
uv run python -m scripts.courses.export_convex_course_codes -o temp/pre_import_codes.json
```

### Subject Distribution Analysis

**Use Case**: Monitor which subjects have the most courses

```bash
# Run with analysis to see subject breakdown
uv run python -m scripts.courses.export_convex_course_codes --analyze
```

## Integration Support

### Pre-Import Course Code Export

**Use Case**: Before running course imports, export existing codes to avoid duplicates

```bash
# Export current codes for duplicate checking
uv run python -m scripts.courses.export_convex_course_codes -o temp/existing_codes.json
```

### Post-Import Verification

**Use Case**: After imports, verify the new course count

```bash
# Export and analyze after import
uv run python -m scripts.courses.export_convex_course_codes --analyze -o temp/post_import_codes.json
```

## Backup Operations

### Regular Course Code Backup

**Use Case**: Regular snapshots of all course codes

```bash
# Create timestamped backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
uv run python -m scripts.courses.export_convex_course_codes -o "backups/course_codes_${TIMESTAMP}.json"
```

### Regular Subject Areas Backup

**Use Case**: Regular snapshots of all subject areas

```bash
# Create timestamped backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
uv run python -m scripts.courses.export_convex_subject_areas -o "backups/subject_areas_${TIMESTAMP}.json"
```

### Automated Backup Script

Create a comprehensive backup script:

```bash
#!/bin/bash
# backup_course_data.sh

BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR/course_codes" "$BACKUP_DIR/subject_areas"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
COURSE_CODES_FILE="${BACKUP_DIR}/course_codes/course_codes_${TIMESTAMP}.json"
SUBJECT_AREAS_FILE="${BACKUP_DIR}/subject_areas/subject_areas_${TIMESTAMP}.json"

echo "Creating course data backups..."

# Backup course codes
echo "Backing up course codes..."
uv run python -m scripts.courses.export_convex_course_codes -o "$COURSE_CODES_FILE" --analyze

# Backup subject areas
echo "Backing up subject areas..."
uv run python -m scripts.courses.export_convex_subject_areas -o "$SUBJECT_AREAS_FILE" --analyze

echo "Backups created:"
echo "  Course codes: $COURSE_CODES_FILE"
echo "  Subject areas: $SUBJECT_AREAS_FILE"

# Keep only last 30 backups of each type
ls -t "${BACKUP_DIR}/course_codes"/course_codes_*.json | tail -n +31 | xargs -r rm
ls -t "${BACKUP_DIR}/subject_areas"/subject_areas_*.json | tail -n +31 | xargs -r rm

echo "Cleanup completed. Kept latest 30 backups of each type."
```

## Troubleshooting

### Common Issues

1. **Convex Connection Errors**
   - Ensure `CONVEX_URL` environment variable is set
   - Check network connectivity
   - Verify Convex credentials

2. **Large Dataset Performance**
   - The script uses pagination (1000 items per page)
   - For very large datasets, consider running during off-peak hours
   - Monitor memory usage for extremely large exports

3. **Permission Issues**
   - Ensure write permissions to output directory
   - Check that temp/ directory exists

### Performance Notes

- **Export Speed**: ~1,000 course codes per second
- **Memory Usage**: Minimal (loads data in batches)
- **Network Usage**: Optimized with pagination
- **File Size**: ~50KB per 1,000 course codes

### Error Handling

The script includes comprehensive error handling:
- Graceful network failure recovery
- File system error reporting
- Data validation checks
- Progress tracking with page-by-page output

## Integration with Other Tools

### Use with Course Import Scripts

```bash
# 1. Export existing codes
uv run python -m scripts.courses.export_convex_course_codes -o temp/existing_codes.json

# 2. Check for duplicates before import
uv run python -m scripts.courses.check_course_code_duplicates -o temp/pre_import_duplicates.json

# 3. Run import with existing codes for duplicate checking
uv run python -m scripts.courses.transform_courses_for_convex

# 4. Check for new duplicates after import
uv run python -m scripts.courses.check_course_code_duplicates --details

# 5. Clean up duplicates if found
uv run python -m scripts.courses.check_course_code_duplicates --cleanup --no-dry-run

# 6. Verify post-cleanup state
uv run python -m scripts.courses.export_convex_course_codes --analyze
```

### Database Maintenance Workflow

```bash
# Regular maintenance routine
#!/bin/bash
echo "Starting database maintenance..."

# 1. Check current state
uv run python -m scripts.courses.check_course_code_duplicates -o reports/daily_duplicates.json

# 2. If duplicates found, clean them up
if [ $? -eq 1 ]; then
    echo "Duplicates found. Cleaning up..."
    uv run python -m scripts.courses.check_course_code_duplicates --cleanup --no-dry-run --batch-size 200

    # 3. Verify cleanup
    uv run python -m scripts.courses.check_course_code_duplicates

    if [ $? -eq 0 ]; then
        echo "✅ Database cleanup completed successfully"
    else
        echo "⚠️ Some duplicates may remain - manual review required"
    fi
else
    echo "✅ No duplicates found - database is clean"
fi
```

### Use with External Analysis Tools

The JSON output can be easily imported into:
- Python pandas for data analysis
- Excel/Google Sheets for reporting
- Database tools for comparison
- Custom analysis scripts

### Example Python Usage

```python
import json

# Load exported course codes
with open('temp/convex_course_codes.json', 'r') as f:
    course_codes = json.load(f)

# Load exported subject areas
with open('temp/convex_subject_areas.json', 'r') as f:
    subject_areas = json.load(f)

# Analyze subjects
subjects = {}
for code in course_codes:
    subject = code.split()[0]
    subjects[subject] = subjects.get(subject, 0) + 1

# Find courses by subject
cse_courses = [code for code in course_codes if code.startswith('CSE ')]
print(f"CSE courses: {len(cse_courses)}")

# Create subject code to title mapping
subject_map = {area['code']: area['title'] for area in subject_areas}

# Get full subject names for top subjects
top_subjects = sorted(subjects.items(), key=lambda x: x[1], reverse=True)[:5]
for code, count in top_subjects:
    title = subject_map.get(code, 'Unknown')
    print(f"{code} ({title}): {count} courses")
```