#!/usr/bin/env python3
import json
import os
import sys
from collections import defaultdict
from pathlib import Path

# Run "bun run convex:export" and unzip the file using file explorer

def compute_professors(input_file, output_file, prof_to_course_file):
    professor_map = defaultdict(lambda: {
        'name': '',
        'courses': [],
        'roles': set(),
        'question_values': defaultdict(list)  # For aggregating question ratings
    })

    professor_to_course_sessions = []  # List for the new table

    total_courses = 0
    courses_with_professors = 0

    # Read the cecCourses JSONL file
    with open(input_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            total_courses += 1
            course = json.loads(line)

            if course.get('professor'):
                courses_with_professors += 1
                professor_name = course['professor'].strip()

                if not professor_map[professor_name]['name']:
                    professor_map[professor_name]['name'] = professor_name

                prof = professor_map[professor_name]
                prof['courses'].append({
                    'courseCode': course.get('courseCode'),
                    'term': course.get('term'),
                    'sessionCode': course.get('sessionCode'),
                })

                if course.get('role'):
                    prof['roles'].add(course['role'])

                # Add to professorToCourseSessions table
                professor_to_course_sessions.append({
                    'name': professor_name,
                    'role': course.get('role'),
                    'courseCode': course.get('courseCode'),
                    'term': course.get('term'),
                    'sessionCode': course.get('sessionCode'),
                })

                # Aggregate question ratings (same logic as cec-evaluations.tsx)
                data = course.get('data', {})
                questions = data.get('table_data_list_of_dicts', [])

                for q in questions:
                    question_text = q.get('Question')
                    # Use Mean or Median (Mean first, then Median as fallback)
                    value_str = str(q.get('Mean') or q.get('Median') or '')

                    try:
                        value = float(value_str)
                        if question_text and value > 0:  # Only store valid values
                            prof['question_values'][question_text].append(value)
                    except (ValueError, TypeError):
                        pass

    # Create output directories if they don't exist
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    prof_to_course_path = Path(prof_to_course_file)
    prof_to_course_path.parent.mkdir(parents=True, exist_ok=True)

    # Write professors to JSONL file
    with open(output_file, 'w', encoding='utf-8') as f:
        for name, data in professor_map.items():
            # Compute aggregated question averages
            aggregated_questions = {}
            all_median_values = []

            for question, values in data['question_values'].items():
                if values:
                    avg = sum(values) / len(values)
                    aggregated_questions[question] = round(avg, 2)
                    all_median_values.extend(values)

            # Compute overall score (average of all question medians)
            overall_score = None
            if all_median_values:
                overall_score = round(sum(all_median_values) / len(all_median_values), 2)

            professor = {
                'name': data['name'],
                'courseCount': len(data['courses']),
                'courses': data['courses'],
                'roles': list(data['roles']),
                'aggregatedQuestions': aggregated_questions,
                'overallScore': overall_score,
            }
            f.write(json.dumps(professor) + '\n')

    # Write professorToCourseSessions to JSONL file
    with open(prof_to_course_file, 'w', encoding='utf-8') as f:
        for session in professor_to_course_sessions:
            f.write(json.dumps(session) + '\n')

    # Print summary
    print('\n=== Professors Computation Summary ===')
    print(f'Total CEC courses processed: {total_courses}')
    print(f'Courses with professor data: {courses_with_professors}')
    print(f'Unique professors found: {len(professor_map)}')
    print(f'Professor-to-course sessions: {len(professor_to_course_sessions)}')
    print(f'Professors output: {output_file}')
    print(f'Sessions output: {prof_to_course_file}')

    # Additional statistics
    course_counts = [len(data['courses']) for data in professor_map.values()]
    if course_counts:
        avg_courses = sum(course_counts) / len(course_counts)
        max_courses = max(course_counts)
        min_courses = min(course_counts)

        print('\nCourse statistics per professor:')
        print(f'  Average: {avg_courses:.2f}')
        print(f'  Min: {min_courses}')
        print(f'  Max: {max_courses}')

        # Find professor with most courses
        top_professor = max(professor_map.items(),
                          key=lambda x: len(x[1]['courses']))
        print(f'\nProfessor with most courses: {top_professor[0]} '
              f'({len(top_professor[1]["courses"])} courses)')

    # Overall score statistics
    with open(output_file, 'r', encoding='utf-8') as f:
        professors_with_scores = []
        for line in f:
            prof = json.loads(line)
            if prof.get('overallScore'):
                professors_with_scores.append(prof)

    if professors_with_scores:
        scores = [p['overallScore'] for p in professors_with_scores]
        avg_score = sum(scores) / len(scores)
        max_score = max(scores)
        min_score = min(scores)

        print('\nOverall score statistics:')
        print(f'  Professors with scores: {len(professors_with_scores)}')
        print(f'  Average: {avg_score:.2f}')
        print(f'  Min: {min_score:.2f}')
        print(f'  Max: {max_score:.2f}')

        # Top rated professors
        top_rated = sorted(professors_with_scores,
                          key=lambda x: x['overallScore'],
                          reverse=True)[:5]
        print('\nTop 5 rated professors:')
        for i, prof in enumerate(top_rated, 1):
            print(f'  {i}. {prof["name"]}: {prof["overallScore"]} ({prof["courseCount"]} courses)')


if __name__ == '__main__':
    input_file = sys.argv[1] if len(sys.argv) > 1 else './temp/convex_export/cecCourses/documents.jsonl'
    output_file = sys.argv[2] if len(sys.argv) > 2 else './temp/sync/professors.jsonl'
    prof_to_course_file = sys.argv[3] if len(sys.argv) > 3 else './temp/sync/professorToCourseSessions.jsonl'

    try:
        compute_professors(input_file, output_file, prof_to_course_file)
        print('\n✓ Done!')
    except Exception as e:
        print(f'Error: {e}', file=sys.stderr)
        sys.exit(1)
