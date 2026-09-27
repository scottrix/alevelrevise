# A-Level Revise — Site Improvement Brief (for AI agent)

**Site live:** https://scottrix.github.io/alevelrevise
**Canonical repo:** `/home/scott/src/alevelrevise`
**Mirror repo (must apply same edits):** `/home/scott/src/github/alevelrevise`
**Date of audit:** 2026-09-27
**Goal:** Make this the best UK A-Level revision resource — better than savemyexams.com, physicsandmathstutor.com, BBC Bitesize. Revision (concise, exam-focused, A* sufficient) NOT lessons (teaching from scratch).

---

## 1. Current state (verified)

- `subjects.json`: 28 subjects. `index.html` claims "28 Subjects / 5 Exam Boards / 101 Topics".
- `topics/` has 28 subdirs, 101 `.html` files, 0 missing files (all `page` paths in JSON resolve).
- Total ~166,590 words across 101 files ≈ 600–750 words/page **including** nav/footer/boilerplate → ~300–400 words of real notes per topic.
- Reference point: savemyexams topic ≈ 2,000–3,000 words + diagrams + spec references + worked exam Qs + flashcards. This site is at ~15–25% of that depth.
- Topic HTML template sections (in order): disclaimer banner, breadcrumb, topic header (badges), board `<select>`, affiliate banner, Key Definitions / Key Points, Specification Requirements, Worked Example, Practice Questions (4 × `<details>`), topic-nav, Video Resources (YouTube search links only), Past Papers (generic board-finder links), Further Reading (same 3 links everywhere), Flashcards / Exam Questions / Target Tests / Smart Lesson containers (populated by JS only where JSON exists in `flashcards/`, `exam-questions/`, `target-tests/`, `smart-lessons/`).
- Two template variants exist: newer (`📋 Key Definitions and Core Concepts`) vs older (`📌 Key Points` / `🎯 Learning Objectives`). Both live side by side (e.g. biology has both).
- `subjects.json` schema per subject: `{name, id, category, boards[], topics[{title, learningObjectives[], keyPoints[], exampleQuestion, modelAnswer, practiceQuestions[], page}]}`. NOTE: several topics have empty `learningObjectives/keyPoints` in JSON but NON-empty HTML (e.g. `topics/mathematics/algebraic-methods-and-proof.html`). JSON is stale — HTML is source of truth for content, JSON for nav/counts.
- Actual topic path format: `topics/{subject-id}/{topic-slug}.html` (no board slug). `subjects.json → page` uses this format.

## 2. Critical site-wide defects (fix first)

### P0-1. False board coverage claims
- `index.html`: all 5 boards (AQA, Edexcel, OCR, WJEC, CCEA) claim "28 subjects" each.
- Reality: Law is AQA/OCR/WJEC only (no Edexcel/CCEA at A-Level). Sociology has no CCEA. Politics is AQA/Edexcel only. Philosophy is AQA only. Accounting is AQA only. Languages vary. WJEC vs Eduqas conflated (England A-Levels are Eduqas, not WJEC); Eduqas missing as separate board option.
- Subject pages (e.g. `law.html:56`, `sociology.html`, all `General`-board subjects) say "across AQA, Edexcel, OCR, WJEC, and CCEA" — contradicts their own `subjects.json → boards: ["General"]`.
- Board `<select>` on every topic page shows identical content for all boards; only dims past-paper `<li>` opacity via inline JS. This is fake differentiation.
- **Task:** Correct per-subject board lists against official specs. Change homepage counts to real numbers. Replace generic badge with per-board assessment-structure box (good example already exists: `biology.html:62-65` AQA essay vs Edexcel article vs OCR PAG vs WJEC units vs CCEA units — replicate this pattern for every multi-board subject). Either implement real per-board content variants or remove selector until real.

### P0-2. Orphan / ghost pages (16 files, GCSE leftovers + duplicates)
Not in `subjects.json` or nav, but exist on disk, in `sitemap.xml`, URL-guessable:
`ancient-history.html`, `astronomy.html`, `business.html` (dup of `business-studies.html`), `citizenship-studies.html`, `classical-civilisation.html`, `combined-science.html` (GCSE, not A-Level), `dance.html`, `design-and-technology.html`, `drama.html` (dup of `drama-and-theatre.html`), `electronics.html`, `engineering.html`, `film-studies.html`, `food-preparation-nutrition.html`, `geology.html`, `pe.html` (dup of `physical-education.html`, content differs), `statistics.html`.
- `pe.html` vs `physical-education.html`, `business.html` vs `business-studies.html`, `drama.html` vs `drama-and-theatre.html` differ in content (verified via `diff -q`) — duplicate/keyword-cannibalisation risk.
- **Task:** Decide keep/delete per subject (A-Level does have Ancient History, Classical Civilisation, Electronics, Geology, Statistics as real specs — either promote to full subjects with real content or delete + 301/remove from sitemap). Duplicates must 301 to canonical (`pe.html`→`physical-education.html`, etc.). Regenerate `sitemap.xml` to match `subjects.json` exactly.

### P0-3. Broken affiliate/ad HTML (validator failure, layout shift)
- Many topic files (e.g. `topics/biology/*.html` lines ~44–66) start affiliate block mid-tag: `<div class="affiliate-card-desc">CGP, York Notes, and more</div>` with NO opening `<a class="affiliate-card" ...>`. Compare with intact block in `topics/english-language/language-diversity-sociolects-and-child-acquisition.html:47-51`.
- `<div class="ad-right">` opened but never closed before `<main>` in same files.
- **Task:** Fix template, re-run across all 101 files. Validate with `npx html-validate` or equivalent; zero errors acceptance.

### P0-4. Canonical / domain mismatch (SEO split)
- Every page: `<link rel="canonical" href="https://www.scottrix.co.uk/alevelrevise/...">` and `og:url` same, but live site is `https://scottrix.github.io/alevelrevise`. `sitemap.xml` and `robots.txt` also point at `www.scottrix.co.uk`.
- **Task:** Decide single canonical domain, apply consistently to canonicals, og:url, sitemap, robots, JSON-LD. Add 301/redirect rule for the other.

### P0-5. Placeholder / generic content
- All 16 single-topic subjects + several others contain generic Q1/Q2: "Explain the significance of X in A-Level examination contexts." → Answer: "Demonstrate clear conceptual understanding of X…" — zero exam value. Grep: `Demonstrate clear conceptual understanding`.
- Video Resources = YouTube search URLs only. Further Reading = same 3 links (PMT, Dr Frost, Bitesize) on every page including English/French/Law. Past Papers = board homepage finders, no deep links to spec/specimen papers.
- Empty JS containers (`#flashcard-container`, `#exam-questions-container`, etc.) render as empty headings where no JSON exists.
- **Task:** Delete all placeholder Q&A. Replace with real exam-style Qs + full mark-scheme answers. Per-topic: ≥4 real Qs. Per-topic Further Reading: 3–5 genuinely relevant links. Hide empty JS sections when no data (`if (!data) section.hidden = true`).

## 3. Content depth gap (the main job)

**Revision vs lesson rule:** assume student already learned it once. No first-principles teaching. Every topic must have: condensed spec-mapped notes (all spec points named), key terms defined once, 1–2 worked exam Qs with mark-scheme logic, common pitfalls + examiner tips, exam technique (command words, timing, AO1/AO2/AO3 split where relevant), ≥4 practice Qs with full answers, flashcards (8–15 cards), required-practical / fieldwork / set-text coverage where spec demands, diagrams where visual (no external image dependency — inline SVG preferred).

**Target per topic:** 1,500–2,500 words real content (excl. nav/footer), 6–12 key points, 8–15 flashcards, 4–6 practice Qs. Current: ~350 words, 6 key points, 4 Qs (2 generic on stubs).

### Tier 1 — strongest, expand 2× (12 subjects, 5–11 topics each)
Maths (11), Further Maths (7), English Lit (5), Biology (9), Chemistry (9), Physics (9), Computer Science (7), Economics (6), Psychology (6), Business Studies (6), History (5), Geography (5).
- All factually accurate on sampled pages (differentiation, integration, complex numbers, cell structure, energetics, etc.). Keep tone.
- Missing: Maths (large data set, vectors detail, proof rigour); Bio (photosynthesis, immunity, gene expression pages thin); Chem (mechanisms drawings, NMR/IR, titrations); Physics (derivations, uncertainty/PAGs, diagrams); Econ (supply-demand / AD-AS SVG diagrams, data-response technique); Psych (research methods/stats, biopsych); Hist/Geog (named case studies: Tudors/Russia/Civil Rights; Nepal/Holderness; 20-mark structures); EngLit (set-text coverage per board option); CS (code traces, SQL, complexity).

### Tier 2 — stubs, split into full specs (16 subjects, currently 1 mega-page each — NOT A* viable)
| Subject | Current single file | Minimum split required |
|---|---|---|
| English Language | `topics/english-language/language-diversity-sociolects-and-child-acquisition.html` | 8–10: textual variations, language & gender, CLA, language change, discourse, Paper 1/2 methods, frameworks, NEA |
| Sociology | `topics/sociology/sociological-theories-education-and-crime.html` | 10–12: theory/methods, families, education, crime, beliefs, stratification, media |
| Politics | `topics/politics/*.html` | 8–10: UK constitution, Parliament, PM/cabinet, judiciary, parties, ideologies (lib/soc/cons/fem), US comparison |
| Law | `topics/law/the-english-legal-system-criminal-and-tort-law.html` | 10–12: ELS, statutory interp, precedent, criminal (actus/mens rea, offences), tort (negligence, occupiers), defences, remedies |
| Religious Studies | `topics/religious-studies/*.html` | 8–10: phil (cosm/teleo/onto, problem of evil), ethics (util/Kant/NLE/business), DCT + developments |
| Philosophy | `topics/philosophy/*.html` | 6–8: epistemology (Gettier, Descartes), moral (cognitivism, emotivism), mind (dualism, behaviourism), metaphysics |
| French | `topics/french/*.html` | 8–10: society, culture, immigration, Occupation/Resistance, film (La Haine), book, grammar bank, speaking cards, essay frames |
| Spanish | `topics/spanish/*.html` | same shape (film: Volver/Ocho apellidos; book; grammar) |
| German | `topics/german/*.html` | same shape (film: Good Bye Lenin; book; grammar) |
| Latin | `topics/latin/*.html` | 5–6: unseen prose/verse technique, grammar bank, set texts per board |
| Art & Design | `topics/art-and-design/*.html` | 4–6: portfolio, ESA, critical/contextual, materials, annotation frames (coursework-based — say so) |
| Music | `topics/music/*.html` | 6–8: harmony, sonata, set works per board, dictation/aural, composition briefs |
| Drama & Theatre | `topics/drama-and-theatre/*.html` | 5–6: practitioners (Brecht/Stanislavski/Artaud), devising, text interpretation, live-review frame |
| Media Studies | `topics/media-studies/*.html` | 6–8: language/rep/industry/audience + CSPs per board, theories (Hall, Butler, Baudrillard) |
| PE | `topics/physical-education/*.html` | 6–8: anatomy, biomech, physio, skill acquisition, sport psych, socio-cultural + data |
| Accounting | `topics/accounting/*.html` | 5–6: double-entry, statements, ratios, costing/budgeting, ethics |

For each new topic: follow existing HTML template (head meta + JSON-LD FAQPage with 2 REAL Q&As, header/nav/breadcrumb, badges, board box, sections, topic-nav prev/next, footer, theme script, board-filter script, JS includes). Add row to `subjects.json` (title, learningObjectives[4–8], keyPoints[6–12], exampleQuestion + modelAnswer, practiceQuestions[4–6], page). Keep sidebar lists in sync. Mirror to `/home/scott/src/github/alevelrevise`.

## 4. Layout / UX fixes
- Sidebar with 1 item on 16 subjects → after Tier-2 split this resolves; interim add "More topics coming" + spec outline.
- Subject pages (`biology.html:70-97` pattern) auto-split sections by first word of topic title producing nonsense headings ("Biochemistry / Biological / Cell / …"). Replace with real spec areas (e.g. Bio: Biological molecules, Cells, Exchange, Genetics, Energy, Homeostasis, Inheritance, Gene expression, Ecosystems).
- `biology.html:52` uses 📐 emoji for Biology; audit all subject emoji.
- Hide empty `Flashcards / Exam Questions / Target Tests / Smart Lesson` sections when no JSON.
- Keep dark mode + mobile (already good). Do not regress `style.css`, `sidebar.js`, `app.js`, theme key `alevelrevise-theme`, board key `alevel-board`.

## 5. Sources to use (not just savemyexams)
Cross-check every topic against: official spec PDFs (AQA/Edexcel/OCR/WJEC-Eduqas/CCEA) + specimen mark schemes; savemyexams.com (structure reference); physicsandmathstutor.com (topic Q banks); BBC Bitesize; senecalearning; Chemguide / chemrevise; mathsgenie / Dr Frost / TLMaths; Sparx; Royal Society of Chemistry; IOP; Nuffield; tutor2u (econ/business/psych/soc); SimplyPsychology (verify against primary studies); Massolit; JSTOR summaries for lit; official set-text editions for lit/languages. Never copy — synthesise, cite board spec codes.

## 6. Suggested execution order for agent
1. P0 fixes (boards, orphans/sitemap, affiliate HTML, canonical, placeholders) — verify with grep + validator.
2. Template + JSON hygiene (unify old/new section names, sync JSON↔HTML, fix subject-page grouping, hide empty sections).
3. Tier-1 expansion (one subject at a time, spec-mapped, with SVG diagrams where needed).
4. Tier-2 splits (one subject at a time; update JSON + sidebar + subject page + sitemap + search-index + dashboard-data).
5. Per-subject QA: `python3` link check (all `topics/` hrefs resolve), word-count check (≥1,500 real words), HTML validation, mobile-width check, board-box accuracy.
6. Apply every edit to BOTH `/home/scott/src/alevelrevise` and `/home/scott/src/github/alevelrevise`.

## 7. Reproduce-audit commands
```
cd /home/scott/src/alevelrevise
python3 -c "import json; d=json.load(open('subjects.json')); print(len(d['subjects']), sum(len(s['topics']) for s in d['subjects']))"
find topics -type f | wc -l
grep -rl "Demonstrate clear conceptual understanding" topics | wc -l
grep -rl 'affiliate-card-desc">CGP' topics | wc -l
python3 -c "import glob,re,os; [print(f) for f in glob.glob('*.html') if os.path.basename(f)[:-5] not in {s['id'] for s in __import__('json').load(open('subjects.json'))['subjects']} and os.path.basename(f) not in ['index.html','dashboard.html','privacy.html']]"
```

## 8. Acceptance criteria (done = all true)
- [ ] Homepage board counts match reality; no subject claims boards it has no spec for.
- [ ] Zero orphan HTML; sitemap == subjects.json page list + subject pages + index.
- [ ] Zero validator errors; affiliate/ad blocks intact on all 101+ pages.
- [ ] Single canonical domain everywhere.
- [ ] Zero placeholder Q&A strings.
- [ ] Every topic ≥1,500 real words, ≥4 real practice Qs with answers, ≥2 FAQ JSON-LD entries matching page content.
- [ ] Every subject has board-assessment box + spec-area grouping + past-paper deep links + relevant further reading.
- [ ] Both repo copies identical for changed files.
