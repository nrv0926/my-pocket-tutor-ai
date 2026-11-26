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

wb = openpyxl.load_workbook(SRC)
ws = wb["Scenarios"]
assert ws.cell(4, 1).value == "ID", "expected the header on row 4"
assert ws.cell(4, 6).value == "Status" and ws.cell(4, 9).value == "Notes"
missing = []
for r in range(5, 71):
    sid = ws.cell(r, 1).value
    if sid not in S:
        missing.append(sid); continue
    status, note = S[sid]
    ws.cell(r, 6).value = status
    old = (ws.cell(r, 9).value or "").strip()
    ws.cell(r, 9).value = f"{old} — {note}" if old else note
    ws.cell(r, 9).alignment = openpyxl.styles.Alignment(wrap_text=True, vertical="top")

assert not missing, f"unmapped: {missing}"
assert len(S) == 66, len(S)

from collections import Counter
c = Counter(v[0] for v in S.values())
print("Pass", c["Pass"], "| Fail", c["Fail"], "| Blocked", c["Blocked"], "| Not run", c["Not run"], "| total", sum(c.values()))

# ---- committed traceability record, generated from the same map ----
rows = []
for r in range(5, 71):
    sid = ws.cell(r, 1).value
    rows.append((sid, ws.cell(r, 2).value, ws.cell(r, 3).value, ws.cell(r, 7).value, *S[sid]))

MD = "docs/assessment/SCENARIO_COVERAGE.md"
with open(MD, "w") as f:
    f.write("""# Assessment engine — scenario coverage

Where each row of `Pocket_Tutor___Assessment_Engine_Test_Scenarios.xlsx` is
answered, and what it says. Generated, not hand-maintained: regenerate with
`scripts/fill-scenarios.py` after a run so this file and the workbook cannot
disagree.

Run of **2026-11-26** against `claude/affectionate-galileo-j60265`.

| | count | what it means |
|---|---|---|
| **Pass** | 38 | asserted by a test that was proved able to fail |
| **Fail** | 0 | |
| **Blocked** | 27 | needs a Supabase project, a signed-in adult and a saved profile — or is a question for Nicolas, not a test |
| **Not run** | 1 | deferred by design (Phase 1b) |

Two rows are raised rather than answered, per the standing instruction not to
resolve a conflict unilaterally: **C-07** (no edit path for a mis-tap) and
**R-18** (the row says nine acceptance cases; the document has eleven).

| ID | Area | Scenario | How to run | Status | Where / what |
|---|---|---|---|---|---|
""")
    for sid, area, scen, how, status, note in rows:
        cell = lambda x: (x or "").replace("|", "\\|").replace("\n", " ")
        f.write(f"| `{sid}` | {cell(area)} | {cell(scen)} | {cell(how)} | **{status}** | {cell(note)} |\n")
wb.save(OUT)
print("wrote", OUT)
print("wrote", MD, len(rows), "rows")
