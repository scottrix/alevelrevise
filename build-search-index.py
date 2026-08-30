#!/usr/bin/env python3
"""Build search-index.json for the A-Level sites from subjects.json.

The previous version scraped topic-card markup from the subject landing pages
and was keyed to an old HTML structure (GCSE-era), so it produced a stale
index full of gcserevise topics. This version derives the index directly from
subjects.json, which is the single source of truth for all 28 subjects and
their topic pages.

Output shape consumed by app.js:
  subjects: [{id, name, category, aliases, boards, papers, url}]
  topics:   [{id, name, strandId, strandName, subject, subjectName, category,
              url, searchText}]
"""
import json
import re
from pathlib import Path

BASE = Path('/home/scott/src')
SITES = ['alevelrevise', 'alevellessons']


def slug(name):
    return name.lower().replace(' ', '-').replace('&', '-and-').replace('–', '-').replace('/', '-')


# Common aliases / short forms so "maths" matches "Mathematics", etc.
ALIASES = {
    'mathematics': ['maths', 'math'],
    'further-mathematics': ['further maths', 'fm'],
    'english-literature': ['english lit', 'eng lit'],
    'english-language': ['english lang', 'eng lang'],
    'business-studies': ['business', 'bs'],
    'computer-science': ['computing', 'comp sci', 'cs'],
    'physical-education': ['pe', 'sport'],
    'religious-studies': ['rs', 're'],
    'drama-and-theatre': ['drama', 'theatre'],
    'art-and-design': ['art', 'fine art'],
}


def build_index(site):
    with open(BASE / site / 'subjects.json') as f:
        data = json.load(f)

    subjects_index = []
    topics_index = []

    for s in data.get('subjects', []):
        sid = s['id'] or slug(s['name'])
        subject_entry = {
            'id': sid,
            'name': s['name'],
            'category': s.get('category', 'Core'),
            'aliases': ALIASES.get(sid, []),
            'boards': [b['board'] if isinstance(b, dict) else b for b in s.get('boards', [])],
            'papers': 0,
            'url': s.get('url') or f"{sid}.html",
        }
        subjects_index.append(subject_entry)

        for board in s.get('boards', []):
            board_name = board['board'] if isinstance(board, dict) else board
            for t in board.get('topics', []):
                title = t['title']
                page = t.get('page', '')
                search_text = ' '.join(filter(None, [
                    s['name'], title,
                    t.get('boardNote', ''),
                    ' '.join(t.get('learningObjectives', []) or []),
                    ' '.join(t.get('keyPoints', []) or []),
                    ' '.join(t.get('practiceQuestions', []) or []),
                ]))
                topics_index.append({
                    'id': None,
                    'name': title,
                    'strandId': None,
                    'strandName': None,
                    'subject': sid,
                    'subjectName': s['name'],
                    'category': s.get('category', 'Core'),
                    'url': page,
                    'searchText': re.sub(r'\s+', ' ', search_text).strip().lower(),
                })

    # Deduplicate topics by URL (a subject may list the same page via multiple
    # boards if wired twice — e.g. generated per-board + rich general topics).
    seen = set()
    unique_topics = []
    for t in topics_index:
        if t['url'] in seen:
            continue
        seen.add(t['url'])
        unique_topics.append(t)

    return {
        'subjects': subjects_index,
        'topics': unique_topics,
    }


def main():
    for site in SITES:
        idx = build_index(site)
        out = BASE / site / 'search-index.json'
        out.write_text(json.dumps(idx, indent=1), encoding='utf-8')
        print(f'built {site}: {len(idx["subjects"])} subjects, {len(idx["topics"])} topics -> {out}')


if __name__ == '__main__':
    main()
