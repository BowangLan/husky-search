#!/usr/bin/env python3
import json
import os
import sys
from collections import defaultdict
from pathlib import Path

# Run "bun run convex:export" and unzip the file using file explorer

def compute_course_tables(input_file, credits_output_file, geneds_output_file):
    course_credits = []  # List for courseCredits table
    course_geneds = []   # List for courseGenEds table

    total_courses = 0
    courses_with_credits = 0
    courses_with_geneds = 0

    # Read the myplanCourses JSONL file
    with open(input_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            total_courses += 1
            course = json.loads(line)

            course_code = course.get('courseCode')
            if not course_code:
                continue

            # Get terms from currentTermData
            current_term_data = course.get('currentTermData', [])

            # Process credits from allCredits field
            all_credits = course.get('allCredits', [])
            if all_credits and current_term_data:
                for term_data in current_term_data:
                    term_id = term_data.get('termId')
                    if term_id:
                        for credit in all_credits:
                            course_credits.append({
                                'courseCode': course_code,
                                'term': term_id,
                                'credit': credit,
                            })
                courses_with_credits += 1

            # Process genEdReqs
            gen_ed_reqs = course.get('genEdReqs', [])
            if gen_ed_reqs and current_term_data:
                for term_data in current_term_data:
                    term_id = term_data.get('termId')
                    if term_id:
                        for gen_ed in gen_ed_reqs:
                            course_geneds.append({
                                'courseCode': course_code,
                                'term': term_id,
                                'genEd': gen_ed,
                            })
                courses_with_geneds += 1

    # Create output directories if they don't exist
    credits_path = Path(credits_output_file)
    credits_path.parent.mkdir(parents=True, exist_ok=True)
    geneds_path = Path(geneds_output_file)
    geneds_path.parent.mkdir(parents=True, exist_ok=True)

    # Write courseCredits to JSONL file
    with open(credits_output_file, 'w', encoding='utf-8') as f:
        for entry in course_credits:
            f.write(json.dumps(entry) + '\n')

    # Write courseGenEds to JSONL file
    with open(geneds_output_file, 'w', encoding='utf-8') as f:
        for entry in course_geneds:
            f.write(json.dumps(entry) + '\n')

    # Print summary
    print('\n=== Course Tables Computation Summary ===')
    print(f'Total courses processed: {total_courses}')
    print(f'Courses with credits data: {courses_with_credits}')
    print(f'Courses with genEd data: {courses_with_geneds}')
    print(f'Total courseCredits entries: {len(course_credits)}')
    print(f'Total courseGenEds entries: {len(course_geneds)}')
    print(f'Credits output: {credits_output_file}')
    print(f'GenEds output: {geneds_output_file}')

    # Additional statistics for credits
    if course_credits:
        unique_credits = set(entry['credit'] for entry in course_credits)
        print(f'\nUnique credit values: {sorted(unique_credits)}')

    # Additional statistics for genEds
    if course_geneds:
        unique_geneds = set(entry['genEd'] for entry in course_geneds)
        print(f'\nUnique genEd values ({len(unique_geneds)}):')
        for gen_ed in sorted(unique_geneds):
            count = sum(1 for entry in course_geneds if entry['genEd'] == gen_ed)
            print(f'  {gen_ed}: {count} entries')


if __name__ == '__main__':
    input_file = sys.argv[1] if len(sys.argv) > 1 else './temp/convex_export/myplanCourses/documents.jsonl'
    credits_output_file = sys.argv[2] if len(sys.argv) > 2 else './temp/sync/courseCredits.jsonl'
    geneds_output_file = sys.argv[3] if len(sys.argv) > 3 else './temp/sync/courseGenEds.jsonl'

    try:
        compute_course_tables(input_file, credits_output_file, geneds_output_file)
        print('\n✓ Done!')
    except Exception as e:
        print(f'Error: {e}', file=sys.stderr)
        sys.exit(1)
