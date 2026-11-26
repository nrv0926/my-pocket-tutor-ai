"""
Fill the Status and Notes columns of the assessment-engine scenario workbook
from the result map below, and regenerate docs/assessment/SCENARIO_COVERAGE.md
from the same map so the two cannot disagree.

    python3 scripts/fill-scenarios.py <source.xlsx> [out.xlsx]

Needs openpyxl. The workbook's own layout is assumed, and asserted: the
Scenarios sheet has its header on row 4 and 66 IDs on rows 5-70.

Update the map when a status changes. Do not edit the workbook by hand -- the
point of this script is that the committed markdown and the spreadsheet are
the same statements.
"""

import sys

import openpyxl

SRC = sys.argv[1] if len(sys.argv) > 1 else "Pocket_Tutor___Assessment_Engine_Test_Scenarios.xlsx"
OUT = sys.argv[2] if len(sys.argv) > 2 else SRC.replace(".xlsx", "_RUN.xlsx")

BLOCKED_APP = ("Blocked: needs a Supabase project, a signed-in adult and a saved profile. "
               "None exist in this container.")

S = {
 "M-01": ("Pass", "supabase/tests/run-migrations.sh: 0004-0008 apply in order and re-run clean."),
 "M-02": ("Pass", "run-migrations.sh asserts the exact counts: true->independent (2), "
                  "false->prompted (1), null stays null (1), and no row gained a value it should not have."),
 "M-03": ("Blocked", BLOCKED_APP + " modeToBoolean() in types/progress.ts is unit-tested and "
                     "lib/actions/observations.ts dual-writes both columns."),
 "M-04": ("Pass", "run-migrations.sh: ids rewritten q1..qN by position in all four locations, "
                  "then 0007_down.sql restores all four exactly."),
 "M-05": ("Pass", "tests/scenarios.test.ts M-05: q1,q1,q3 -> q1,q2,q3, no throw."),
 "M-06": ("Pass", "tests/scenarios.test.ts M-06."),
 "M-07": ("Pass", "tests/scenarios.test.ts M-07: WorksheetShapeError for a missing prompt and "
                  "for an empty worksheet. Thrown before any write."),

 "C-01": ("Blocked", BLOCKED_APP + " The UI half was driven on /demo/loop: all defaults, one tap, "
                     "well inside 20s. The 6-rows-and-closed_at half is unverified."),
 "C-02": ("Blocked", BLOCKED_APP + " The skipped-carries-no-score rule is asserted in SQL (D-02)."),
 "C-03": ("Blocked", BLOCKED_APP + " aggregateMode() is unit-tested in tests/captureEvidence.test.ts."),
 "C-04": ("Blocked", BLOCKED_APP + " INDEPENDENT_MODES includes 'accommodated'; see R-09."),
 "C-05": ("Blocked", BLOCKED_APP + " The exclusion is honoured by the engine; see R-10."),
 "C-06": ("Blocked", BLOCKED_APP + " The attempt-2 path is asserted in SQL and in R-11."),
 "C-07": ("Blocked", "RAISED, NOT RESOLVED. There is no edit path. Every save takes the next attempt "
                     "number (lib/actions/observations.ts), and only attempt 1 counts, so a mis-tap is "
                     "permanent and the correction is ignored by the engine. The UI says 'The first save "
                     "is the one that counts' which is right for reteaching (C-06) and wrong for a "
                     "mis-tap. Your decision, not mine."),
 "C-08": ("Blocked", BLOCKED_APP + " The rapid double-tap IS guarded client-side (disabled={saving} in "
                     "CaptureCard). There is no server-side idempotency key, so a genuine resubmit or a "
                     "second tab writes attempt 2 rather than being ignored."),
 "C-09": ("Blocked", BLOCKED_APP + " Note: saveCapture() issues several statements without an explicit "
                     "transaction, so 'all rows or none' is not currently guaranteed."),
 "C-10": ("Blocked", "The database and server-action half PASSES: SQL asserts a class profile is refused "
                     "(trigger + zod). The 'screen is not offered' half needs the app."),
 "C-11": ("Blocked", BLOCKED_APP + " Driven at 390px on /demo/loop: no horizontal scroll, Save reachable."),
 "C-12": ("Not run", "Phase 1b by design. The exit-ticket TODO is in the code as agreed."),

 "S-01": ("Pass", "supabase/tests/assessment.sql: user B cannot SELECT user A's observations."),
 "S-02": ("Pass", "assessment.sql: the composite FK refuses B's child paired with A's session. "
                  "Uses an item_id A never used, so unique_violation cannot mask the FK."),
 "S-03": ("Pass", "assessment.sql: UPDATE and DELETE both affect 0 of A's rows."),
 "S-04": ("Pass", "ADDED THIS RUN. assessment.sql now switches to the anon role and asserts no rows "
                  "readable and no insert accepted, with rows present so a zero count proves the policy."),
 "S-05": ("Pass", "ADDED THIS RUN. Throwaway child, 1 session, 3 observations; delete cascades. "
                  "Pre-delete count asserted so an empty table cannot pass it."),
 "S-06": ("Pass", "ADDED THIS RUN. Session delete cascades and leaves other sessions' rows intact."),

 "D-01": ("Pass", "assessment.sql: status=scored requires score and max_points."),
 "D-02": ("Pass", "assessment.sql: a skipped item carries no score."),
 "D-03": ("Pass", "assessment.sql: score cannot exceed max_points."),
 "D-04": ("Pass", "assessment.sql: max_points must be positive."),
 "D-05": ("Pass", "ADDED THIS RUN. attempt 0 rejected; proved it fails if a valid attempt is inserted."),
 "D-06": ("Pass", "ADDED THIS RUN. mode_of_support 'helped' rejected."),
 "D-07": ("Pass", "assessment.sql: duplicate (session_id, item_id, attempt) rejected."),

 "P-01": ("Blocked", BLOCKED_APP + " recentFeedbackContext() carries the counted per-question evidence; "
                     "its shape is unit-tested in tests/captureEvidence.test.ts."),
 "P-02": ("Blocked", BLOCKED_APP + " parent_feedback is never written as a score."),

 "R-01": ("Pass", "tests/scenarios.test.ts R-01."),
 "R-02": ("Pass", "R-02: minItemsPerSession=2 makes session 2 too thin."),
 "R-03": ("Pass", "R-03 passes AS WRITTEN: the fixture's skill 'regrouping' is not an id in "
                  "data/skill-map.json, so there is nothing underneath and the engine says "
                  "'no prerequisite mapped' instead of inventing one. The note's expectation is covered "
                  "by a second test using the real id math.subtraction_within_100, which names "
                  "math.place_value_100. So the row and the note are both satisfied; the fixture just has "
                  "to carry a mapped id to exercise Phase 3."),
 "R-04": ("Pass", "R-04: exactly 50% practises. prerequisiteBelow is a strict <."),
 "R-05": ("Pass", "R-05: 49/100 by points, not whole items."),
 "R-06": ("Pass", "R-06."),
 "R-07": ("Pass", "R-07: transferAtOrAbove is >=, so exactly 80% stretches."),
 "R-08": ("Pass", "R-08."),
 "R-09": ("Pass", "R-09: INDEPENDENT_MODES = independent + accommodated."),
 "R-10": ("Pass", "R-10: 9/10. Also asserts the counterfactual the row states (10/14 = 71% -> practise) "
                  "so the exclusion is proved load-bearing."),
 "R-11": ("Pass", "R-11: 3/4."),
 "R-12": ("Pass", "R-12: 4/4, not 4/6."),
 "R-13": ("Pass", "R-13, including the one-recent-session variant."),
 "R-14": ("Pass", "R-14."),
 "R-15": ("Pass", "R-15: groupKey() falls back skillId -> topicId."),
 "R-16": ("Pass", "R-16. NOTE: this needed a new export. recommend() returns ONE decision by design "
                  "(the weakest skill, which is what the 9pm page shows). recommendAll() was added this "
                  "run as a pure refactor - no behaviour change, 519 existing tests still pass - and "
                  "returns one decision per skill, which is what this row asks for."),
 "R-17": ("Pass", "R-17: evidence holds exactly the counted rows; prompted, retry, unclosed and skipped "
                  "rows are all excluded."),
 "R-18": ("Blocked", "RAISED, NOT RESOLVED. This row says nine rows; the committed handoff table has "
                     "ELEVEN. A test now pins the count at 11 so it cannot drift. Three of the eleven "
                     "bear on recommend() and all three pass (plus the skipped/assisted row). The other "
                     "seven are capture, versioning, rendering and export concerns that recommend() "
                     "cannot answer; they are listed at the foot of lib/recommend.ts with where each "
                     "belongs. The row cannot be run as written."),
 "R-19": ("Pass", "R-19: identical output on repeat, input not mutated, and the module's source contains "
                  "no supabase, fetch( or process.env. The whole vitest suite runs with no database."),

 "U-01": ("Blocked", BLOCKED_APP + " Verified on /demo/loop instead: 'Ready to stretch - Multi-digit "
                     "multiplication, 12 of 12 right on their own, over 2 sessions'."),
 "U-02": ("Blocked", BLOCKED_APP + " /demo/loop renders 'Show the 12 questions this is counted from'."),
 "U-03": ("Blocked", BLOCKED_APP + " No 1-4 wording exists anywhere in the recommend path."),
 "U-04": ("Blocked", BLOCKED_APP + " /demo/loop shows 'Not enough recorded yet' after one session."),
 "U-05": ("Blocked", BLOCKED_APP + " A class profile is refused at the database and in the action."),

 "E-01": ("Blocked", BLOCKED_APP + " The loop itself was driven end to end on /demo/loop."),
 "E-02": ("Blocked", BLOCKED_APP + " Engine half covered by R-03."),
 "E-03": ("Blocked", BLOCKED_APP + " Engine half covered by R-08."),

 "G-01": ("Blocked", BLOCKED_APP + " tests/analysisShape.test.ts asserts the nine sections."),
 "G-02": ("Blocked", BLOCKED_APP),
 "G-03": ("Blocked", BLOCKED_APP + " tests/decodableCheck.test.ts covers the checker on fixtures, "
                     "including the two passages that failed the first live eval."),
 "G-04": ("Blocked", BLOCKED_APP),
 "G-05": ("Pass", "run-local.sh: rls.sql, app-writes.sql and assessment.sql all pass. rls.sql also had "
                  "one assertion that could not fail; fixed in b01e0d5."),
}


# ---- added in the CSV revision (116 rows) ----
APP = "Blocked: needs a Supabase project, a signed-in adult and a saved profile."
GAP = "CONFIRMED GAP, recorded in PRODUCT_ROADMAP.md rather than built: "

S.update({
 "GR-01": ("Blocked", APP + " The note is worth acting on: if every K item needs "
                      "Accommodated tapped, it should be the K default. Roadmapped with the "
                      "other standing-accommodation work."),
 "GR-02": ("Fail", "There is no scope check. The row's expected result refers to one, and "
                   "nothing in lib/ or data/ constrains a generated number to a grade's range. "
                   "The ranges themselves are transcribed and could be derived (Grade 1 to 50, "
                   "Grade 2 to 200, Grade 3 to 1,000 are in data/ontario/mathematics.json). "
                   "lib/answerCheck.ts, added this run, gives the arithmetic half; the range "
                   "half is roadmapped."),
 "GR-03": ("Blocked", APP + " Depends on the same missing range check as GR-02."),
 "GR-04": ("Blocked", APP),
 "GR-05": ("Blocked", APP),
 "GR-06": ("Pass", "tests/scenariosCoverage.test.ts GR-06: June evidence falls outside the "
                   "30-day window, so the answer is collect_more_evidence. The engine never "
                   "reads a grade, so a grade change cannot break it. The 'history still "
                   "visible' clause needs the app."),
 "GR-07": ("Blocked", "RAISED: the row's premise contradicts CLAUDE.md §6, which supports "
                      "Grades K through 8. Grade 5 is squarely inside that range, and one of "
                      "the three children is in it. If the intent was a grade above 8 or below "
                      "K, say so and it becomes testable."),

 "SU-01": ("Pass", "ADDED THIS RUN. lib/answerCheck.ts checkArithmeticKey() recomputes a "
                   "simple two-number item and compares it with its key: 20 x 4 keyed as 4000 "
                   "is caught. Abstains ('unparsed') on anything it cannot recompute rather "
                   "than guessing."),
 "SU-02": ("Pass", "ADDED THIS RUN. validateChoices() rejects a distractor that is the right "
                   "answer (3x3 with 9 among the options), the same distractor twice, and two "
                   "that are one number written two ways (0.5 and 1/2)."),
 "SU-03": ("Fail", "There is no calendar-pattern item. The handoff's reference module had "
                   "calendarPattern and it was not ported; its acceptance row is one of the "
                   "eight listed at the foot of lib/recommend.ts as belonging elsewhere. "
                   "Nothing to compare a printed key against."),
 "SU-04": ("Blocked", APP),
 "SU-05": ("Blocked", APP + " lib/decodableCheck.ts already tiers words by phonics stage "
                      "rather than grade and is covered by 13 unit tests."),
 "SU-06": ("Blocked", "RAISED: the row asks us to decide what Phase 1 does with an open "
                      "written response, and there is no consistent behaviour today. "
                      "Roadmapped with a candidate (default to pending_review, never "
                      "self-score)."),
 "SU-07": ("Blocked", APP),
 "SU-08": ("Fail", "THE MOST IMPORTANT FINDING OF THIS PASS, and the row is right. "
                   "subjects.json marks Science and Technology supported: true, so the app "
                   "offers it, and there is no science.json: subjectsWithExpectations() "
                   "returns language, mathematics, french. A Science plan has no expectation "
                   "to resolve against while the prompt still says to use the Ontario "
                   "curriculum, which is how an invented code reaches a teacher. RAISED, not "
                   "resolved: transcribe Science, or set supported: false until it is done. "
                   "Pinned in both directions by a test."),
 "SU-09": ("Blocked", APP + " Related to SU-08: there is no 'enrichment, not curriculum' "
                      "label in the subject model at all."),
 "SU-10": ("Pass", "tests/scenariosCoverage.test.ts SU-10: recommendAll() returns one decision "
                   "per skill and each one's evidence holds only its own items."),
 "SU-11": ("Blocked", "Needs a human with the Ministry documents open. data/ontario/README.md "
                      "records the transcription provenance; 1,189 expectations are loaded and "
                      "every one carries a well-formed code (tests/curriculum.test.ts)."),

 "N-01": ("Blocked", APP + " Engine half is R-09 and LC-08: accommodated counts."),
 "N-02": ("Blocked", APP + " Engine half is R-10 and LC-04."),
 "N-03": ("Blocked", APP + " Engine half is LC-12."),
 "N-04": ("Blocked", APP + " Engine half is R-07."),
 "N-05": ("Blocked", APP + " Engine half is R-03 and LC-02."),
 "N-06": ("Blocked", APP + " The decision does follow the score — feedback never enters "
                     "recommend(). The row's 'ideally the page notes the mismatch' is not "
                     "built."),
 "N-07": ("Blocked", APP + " Engine half is R-12 and LC-03."),
 "N-08": ("Pass", "tests/scenariosCoverage.test.ts N-08, and it answers the row's question "
                  "explicitly: ALL qualifying sessions in the window count, not the last two. "
                  "The fixture is chosen so the two policies disagree (0/4, 4/4, 4/4 is 67% "
                  "and practise across the window; the last two alone would be 100% and "
                  "transfer). The choice is Phase 2's and is documented in lib/recommend.ts."),

 "CL-01": ("Blocked", APP + " differentiation is already a required field inside HOW TO TEACH "
                      "IT for a class (CLAUDE.md §5)."),
 "CL-02": ("Blocked", APP + " The database and the server action both refuse a class profile; "
                      "asserted in SQL."),

 "MC-01": ("Blocked", APP + " Evidence is selected by child_id throughout and RLS proves "
                      "ownership per child."),
 "MC-02": ("Blocked", APP + " Engine half is SU-10 and LC-01: separate skills, separate "
                      "decisions."),

 "LC-01": ("Pass", "tests/scenariosCoverage.test.ts LC-01. The fail sign the row names — maths "
                   "stepped down because of reading — is asserted against directly."),
 "LC-02": ("Pass", "NEEDED A BUILD. The chain stopped at place value, which was a root: "
                   "data/skill-map.json had no counting layer. math.counting_to_30 added, "
                   "traceable to data/math-progression.json (K / number, 'Counting to 30 by "
                   "1s') and to that file's own rule about stepping down one grade on the same "
                   "strand. Now regrouping names place value, place value names counting, and "
                   "counting at 80% is the solid floor."),
 "LC-03": ("Pass", "tests/scenariosCoverage.test.ts LC-03: after session 2 and after session 3 "
                   "the decision is practise or transfer, never check_prerequisite, and the "
                   "three skipped items never became zeros."),
 "LC-04": ("Pass", "Engine verified: 10/10 on the untimed evidence, timed items excluded. The "
                   "row's real question — must she exclude them every session? — is yes, and "
                   "that is roadmapped as the standing-accommodation gap."),
 "LC-05": ("Pass", "tests/scenariosCoverage.test.ts LC-05: 8/14 = 57% practises rather than "
                   "stepping down, and all 14 items are in the evidence for the adult to read, "
                   "which is what makes the multi-step pattern visible."),
 "LC-06": ("Blocked", APP + " Depends on SU-06, which is a decision."),
 "LC-07": ("Blocked", GAP + "the capture screen has no 'unsure'. The engine half IS verified: "
                      "pending_review carries no score, is excluded from recommend(), and "
                      "counts once confirmed. The database and the engine are ready; it is a "
                      "button and a confirm step."),
 "LC-08": ("Pass", "Engine verified: accommodated phonics items keep the progression moving, "
                   "8/10 to transfer, no false check_prerequisite. The standing-accommodation "
                   "gap is roadmapped."),
 "LC-09": ("Blocked", GAP + "there is no large-print option."),
 "LC-10": ("Blocked", GAP + "there is no per-child plain-literal wording setting."),
 "LC-11": ("Pass", "tests/scenariosCoverage.test.ts LC-11: the refused session contributes "
                   "nothing, is not in the evidence, and the percentage is never 0."),
 "LC-12": ("Pass", "tests/scenariosCoverage.test.ts LC-12: maths transfers on translated-key-"
                   "word evidence, Language has nothing to decide from yet, and the Spanish "
                   "group never merges into Language."),
 "LC-13": ("Blocked", GAP + "there is one planned grade per child, not per subject, so the "
                      "twice-exceptional case cannot be expressed. The row is right that this "
                      "is important to know. It is a schema change, so it is a decision "
                      "first."),
 "LC-14": ("Pass", "tests/scenariosCoverage.test.ts LC-14: after the first November session, "
                   "collect more; after the second, check_prerequisite on 3/10 from November "
                   "alone."),
 "LC-15": ("Blocked", GAP + "exclusion is per question only; there is no one action for a "
                      "whole session."),
 "LC-16": ("Pass", "tests/scenariosCoverage.test.ts LC-16, the row's 'best single test of the "
                   "filters', and it is. 9/11 = 82% to transfer, with exactly the 11 items in "
                   "the evidence. NOTE: the row is headed '(10 items)' and then lists eleven; "
                   "its own expected numbers (5/6 in S1, 9/11 overall) need eleven, so eleven "
                   "is what the test uses."),
 "LC-17": ("Pass", "NEEDED A BUILD. The cycle check existed only as a local function inside "
                   "tests/skills.test.ts, so it could only ever be run against the file we "
                   "ship — a graph arriving any other way had nothing to validate it. "
                   "validateSkillGraph() is now exported from lib/skills.ts, takes its nodes "
                   "as an argument, and reports cycles (with the loop), self-edges and "
                   "dangling edges. A -> B -> A is rejected, so is A -> B -> C -> A."),
 "LC-18": ("Pass", "NEEDED A BUILD. The bottom of the chain used to answer 'no prerequisite "
                   "mapped', which is developer shorthand in a field a parent reads at 9pm. It "
                   "now says there is nothing underneath and to reteach in smaller pieces with "
                   "more help. See the R-03 note: that string is what R-03 quoted, and the two "
                   "rows could not both hold."),
 "LC-19": ("Blocked", APP + " Needs live generations to sweep. The prompt already forbids "
                      "naming a condition (lib/prompts.ts) and CLAUDE.md §7 makes it binding. "
                      "A code search is not the test: the words appear legitimately in the "
                      "profile form, in the prompt's own prohibition, and in copy explaining "
                      "the policy."),
 "LC-20": ("Blocked", GAP + "there is no override action. The row's second half is the "
                      "important one: an override must be recorded and then stop mattering, or "
                      "the card becomes a sticky note."),
})

# ---- fixed in the 2026-11-26 follow-up pass ----
S.update({
 "GR-02": ("Pass", "BUILT. lib/gradeScope.ts derives each grade's whole-number ceiling from "
                   "the published wording of the Number strand's B1.1 — Grade 1 to 50, Grade 2 "
                   "to 200, Grade 3 to 1,000, Grade 4 to 10 000 (a space, not a comma), Grade 6 "
                   "to \"one million\" in words. Nobody types a range into a config, so nobody "
                   "can type the wrong one. dropOutOfScope() keeps the items that belong and "
                   "reports the rest rather than silently printing a shorter worksheet."),
 "GR-03": ("Pass", "BUILT with GR-02. The same item is in scope at Grade 3 and out of scope at "
                   "Grade 2, asserted directly. Grade 8 states no ceiling (it moves to "
                   "scientific notation) and K has no published curriculum, so both abstain "
                   "rather than inventing a bound."),
 "SU-03": ("Pass", "BUILT. lib/calendarPattern.ts, ported from the handoff's own reference "
                   "module, which also settles acceptance row 1 — one of the eight rows nothing "
                   "had claimed. The handoff fixture passes exactly (start 2026-11-02, step 6, "
                   "three shown, term 4 → 2026-11-20, proof 02/08/14/20), plus a leap-year "
                   "February, a December-to-January crossing, and a daylight-saving boundary. "
                   "An impossible date is refused rather than rolled forward: new Date() turns "
                   "2026-02-30 into March 2 quite happily. calendarPatternItem() returns the "
                   "prompt, the answer and the working from ONE calculation, so the printed key "
                   "and the on-screen key cannot disagree."),
 "SU-08": ("Pass", "RESOLVED, on your call. science-technology is no longer offered: supported "
                   "is false in data/ontario/subjects.json and it is out of the SUBJECTS list. "
                   "Its strands stay transcribed and it stays in the Subject union, so a "
                   "session already saved under it still resolves and renders — \"not yet\" "
                   "beats pretending it does not exist (§6). The test now asserts the INVARIANT "
                   "rather than the exception: nothing is offered that has no expectations "
                   "behind it. Re-offering Science without transcribing it fails two tests."),
 "C-08": ("Pass", "BUILT. Migration 0009 adds capture_key and save_capture_rows(). The same key "
                  "twice writes nothing the second time; a new key is a deliberate recapture at "
                  "attempt 2, so C-06 still holds. The capture screen mints one key per "
                  "filled-in form and a fresh one the moment anything is changed after a save, "
                  "which is exactly the difference between a double tap and a retry. SQL-tested "
                  "both ways, and the replay assertion was proved able to fail."),
 "C-09": ("Pass", "BUILT. The four separate writes — insert, close the session, sync "
                  "progress_records — are now one SECURITY INVOKER function, so all of it "
                  "happens or none of it does, and row-level security still proves ownership on "
                  "every statement inside. No second policy path."),
 "LC-04": ("Pass", "Engine verified, and the standing accommodation is now BUILT: "
                   "children.accommodations (migration 0011) carries read_aloud, "
                   "timed_never_counts and plain_literal_wording, set once on the profile. "
                   "read_aloud defaults every item to \"accommodated\" at capture, so she is no "
                   "longer re-tapping it every week. NOTE: timed_never_counts cannot be applied "
                   "automatically yet — nothing marks a question as timed, so there is no "
                   "per-item signal to act on. Stored, not yet acted on."),
 "LC-07": ("Pass", "BUILT. A fourth verdict, \"Not sure\", saves pending_review with no score "
                   "and stays out of the decision until confirmed. The mapping now lives once, "
                   "in types/progress.ts, because writing it twice had already produced the bug "
                   "this row warns about: /demo/loop was scoring an unsure answer as ZERO. "
                   "Driven in a browser: two of six marked Not sure, and the card reads 10 of "
                   "10 rather than 10 of 12."),
 "LC-08": ("Pass", "Engine verified, and read_aloud now sets the capture default from the "
                   "profile (migration 0011), so the hearing-dependent items do not need "
                   "re-tapping each session."),
 "LC-10": ("Blocked", "Half built: plain_literal_wording is now a stored accommodation "
                      "(migration 0011) and survives on the profile. Nothing consumes it yet — "
                      "the prompt is not told about it — so the row's expectation is not met. "
                      "The field is the part that needed a migration; wiring it to the prompt is "
                      "a prompt-version bump."),
 "LC-15": ("Pass", "BUILT. learning_sessions.excluded_from_adaptation (migration 0010) plus one "
                   "checkbox: \"Today wasn't a fair test.\" The session stays in history and "
                   "stops being counted — recommend() drops every row from an excluded session. "
                   "A reason is optional, but a reason WITHOUT the exclusion is refused by the "
                   "database, because that is a note nobody acts on. Asserted both ways: 8/8 "
                   "and transfer with the exclusion, 8/13 and practise without it."),
})

HEADERS = ["ID", "Area", "Scenario", "Steps", "Expected result", "Status",
           "How to run", "Phase", "Notes"]


def note_for(sid, existing):
    status, note = S[sid]
    existing = (existing or "").strip()
    return status, (f"{existing} \u2014 {note}" if existing else note)


rows = []          # (id, area, scenario, how, status, note)
missing = []

if SRC.lower().endswith(".csv"):
    import csv

    with open(SRC, newline="", encoding="utf-8-sig") as fh:
        table = list(csv.reader(fh))
    head = next(i for i, r in enumerate(table) if r and r[0].strip() == "ID")
    assert table[head][:9] == HEADERS, table[head][:9]

    for r in table[head + 1:]:
        if not r or not r[0].strip():
            continue
        sid = r[0].strip()
        if sid not in S:
            missing.append(sid)
            continue
        while len(r) < 9:
            r.append("")
        r[5], r[8] = note_for(sid, r[8])
        rows.append((sid, r[1], r[2], r[6], r[5], r[8]))

    # Refresh the summary counters, which are stored as literal text here.
    from collections import Counter as _C

    tally = _C(r[4] for r in rows)
    for i, r in enumerate(table):
        if r and r[0].strip() == "Total":
            table[i + 1][:5] = [str(len(rows)), str(tally["Pass"]), str(tally["Fail"]),
                                str(tally["Blocked"]), str(tally["Not run"])]
            break

    with open(OUT, "w", newline="", encoding="utf-8") as fh:
        csv.writer(fh).writerows(table)

else:
    wb = openpyxl.load_workbook(SRC)
    ws = wb["Scenarios"]
    head = next(r for r in range(1, 20) if ws.cell(r, 1).value == "ID")
    assert ws.cell(head, 6).value == "Status" and ws.cell(head, 9).value == "Notes"

    r = head + 1
    while ws.cell(r, 1).value:
        sid = str(ws.cell(r, 1).value).strip()
        if sid not in S:
            missing.append(sid)
        else:
            status, note = note_for(sid, ws.cell(r, 9).value)
            ws.cell(r, 6).value = status
            ws.cell(r, 9).value = note
            ws.cell(r, 9).alignment = openpyxl.styles.Alignment(wrap_text=True, vertical="top")
            rows.append((sid, ws.cell(r, 2).value, ws.cell(r, 3).value,
                         ws.cell(r, 7).value, status, note))
        r += 1
    wb.save(OUT)

assert not missing, f"unmapped rows: {missing}"

from collections import Counter

c = Counter(r[4] for r in rows)
print(f"Pass {c['Pass']} | Fail {c['Fail']} | Blocked {c['Blocked']} "
      f"| Not run {c['Not run']} | total {len(rows)}")
print("wrote", OUT)

n_pass, n_fail = c["Pass"], c["Fail"]
n_blocked, n_notrun = c["Blocked"], c["Not run"]

MD = "docs/assessment/SCENARIO_COVERAGE.md"
with open(MD, "w") as f:
    f.write(f"""# Assessment engine — scenario coverage

Where each row of `Pocket_Tutor___Assessment_Engine_Test_Scenarios.xlsx` is
answered, and what it says. Generated, not hand-maintained: regenerate with
`scripts/fill-scenarios.py` after a run so this file and the workbook cannot
disagree.

Run of **2026-11-26** against `claude/affectionate-galileo-j60265`.

A row is **Pass** when its decisive assertion is covered by a test that was
proved able to fail; anything the row also asks of the running app is named in
its note. **Blocked** means it needs a Supabase project, a signed-in adult and
a saved profile — or is a question for Nicolas rather than a test. **Fail**
means the thing the row describes does not exist.

| | count |
|---|---|
| **Pass** | {n_pass} |
| **Fail** | {n_fail} |
| **Blocked** | {n_blocked} |
| **Not run** | {n_notrun} |

Still raised rather than answered, per the standing instruction not to
resolve a conflict unilaterally: **C-07** (no edit path for a mis-tap —
correcting one still becomes attempt 2), **SU-06** (what Phase 1 does with an
open written response), **R-18** (the row says nine acceptance cases; the
document has eleven) and **GR-07** (its premise contradicts CLAUDE.md §6,
which supports Grades K through 8).

**SU-08 is resolved**: Science and Technology is no longer offered, and the
test now asserts that nothing is offered without transcribed expectations
behind it.

| ID | Area | Scenario | How to run | Status | Where / what |
|---|---|---|---|---|---|
""")
    for sid, area, scen, how, status, note in rows:
        cell = lambda x: (x or "").replace("|", "\\|").replace("\n", " ")
        f.write(f"| `{sid}` | {cell(area)} | {cell(scen)} | {cell(how)} | **{status}** | {cell(note)} |\n")
print("wrote", MD, len(rows), "rows")
