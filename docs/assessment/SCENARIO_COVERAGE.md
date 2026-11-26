# Assessment engine — scenario coverage

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
| `M-01` | Migrations | Migrations run on a fresh database | SQL (run-local.sh) | **Pass** | supabase/tests/run-migrations.sh: 0004-0008 apply in order and re-run clean. |
| `M-02` | Migrations | Backfill maps old values correctly | SQL (run-local.sh) | **Pass** | run-migrations.sh asserts the exact counts: true->independent (2), false->prompted (1), null stays null (1), and no row gained a value it should not have. |
| `M-03` | Migrations | Dual-write keeps old and new columns in sync | Manual (app) + SQL check | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. modeToBoolean() in types/progress.ts is unit-tested and lib/actions/observations.ts dual-writes both columns. |
| `M-04` | Migrations | Item-ID backfill on old sessions | SQL (run-local.sh) | **Pass** | run-migrations.sh: ids rewritten q1..qN by position in all four locations, then 0007_down.sql restores all four exactly. |
| `M-05` | Item IDs | Server overwrites duplicate model IDs | Unit test | **Pass** | tests/scenarios.test.ts M-05: q1,q1,q3 -> q1,q2,q3, no throw. |
| `M-06` | Item IDs | Server fills missing model IDs | Unit test | **Pass** | tests/scenarios.test.ts M-06. |
| `M-07` | Item IDs | Malformed worksheet is rejected cleanly | Unit test | **Pass** | tests/scenarios.test.ts M-07: WorksheetShapeError for a missing prompt and for an empty worksheet. Thrown before any write. |
| `C-01` | Capture | Happy path: everything right and independent | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. The UI half was driven on /demo/loop: all defaults, one tap, well inside 20s. The 6-rows-and-closed_at half is unverified. |
| `C-02` | Capture | Mixed results with a skip | Manual (app) + SQL check | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. The skipped-carries-no-score rule is asserted in SQL (D-02). |
| `C-03` | Capture | Modelled item sets the session aggregate | Manual (app) + SQL check | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. aggregateMode() is unit-tested in tests/captureEvidence.test.ts. |
| `C-04` | Capture | Accommodated support | Manual (app) + SQL check | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. INDEPENDENT_MODES includes 'accommodated'; see R-09. |
| `C-05` | Capture | Exclude an item that measures the wrong thing | Manual (app) + SQL check | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. The exclusion is honoured by the engine; see R-10. |
| `C-06` | Capture | Retry after reteaching | Manual (app) + SQL check | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. The attempt-2 path is asserted in SQL and in R-11. |
| `C-07` | Capture | Fixing a mis-tap is not a retry | Manual (app) | **Blocked** | RAISED, NOT RESOLVED. There is no edit path. Every save takes the next attempt number (lib/actions/observations.ts), and only attempt 1 counts, so a mis-tap is permanent and the correction is ignored by the engine. The UI says 'The first save is the one that counts' which is right for reteaching (C-06) and wrong for a mis-tap. Your decision, not mine. |
| `C-08` | Capture | Double-press Save | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. The rapid double-tap IS guarded client-side (disabled={saving} in CaptureCard). There is no server-side idempotency key, so a genuine resubmit or a second tab writes attempt 2 rather than being ignored. |
| `C-09` | Capture | Save fails midway | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. Note: saveCapture() issues several statements without an explicit transaction, so 'all rows or none' is not currently guaranteed. |
| `C-10` | Capture | Class rows can't be captured | Manual (app) + SQL check | **Blocked** | The database and server-action half PASSES: SQL asserts a class profile is refused (trigger + zod). The 'screen is not offered' half needs the app. |
| `C-11` | Capture | Works on a phone | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. Driven at 390px on /demo/loop: no horizontal scroll, Save reachable. |
| `C-12` | Capture | Extras are not shown (yet) | Manual (app) | **Not run** | Phase 1b by design. The exit-ticket TODO is in the code as agreed. |
| `S-01` | Security | Another parent can't read your data | SQL (run-local.sh) | **Pass** | supabase/tests/assessment.sql: user B cannot SELECT user A's observations. |
| `S-02` | Security | Can't attach rows to someone else's session | SQL (run-local.sh) | **Pass** | assessment.sql: the composite FK refuses B's child paired with A's session. Uses an item_id A never used, so unique_violation cannot mask the FK. |
| `S-03` | Security | Can't edit or delete another parent's rows | SQL (run-local.sh) | **Pass** | assessment.sql: UPDATE and DELETE both affect 0 of A's rows. |
| `S-04` | Security | Logged-out access | SQL (run-local.sh) | **Pass** | ADDED THIS RUN. assessment.sql now switches to the anon role and asserts no rows readable and no insert accepted, with rows present so a zero count proves the policy. |
| `S-05` | Security | Deleting a child removes its observations | SQL (run-local.sh) | **Pass** | ADDED THIS RUN. Throwaway child, 1 session, 3 observations; delete cascades. Pre-delete count asserted so an empty table cannot pass it. |
| `S-06` | Security | Deleting a session removes its observations | SQL (run-local.sh) | **Pass** | ADDED THIS RUN. Session delete cascades and leaves other sessions' rows intact. |
| `D-01` | Constraints | Scored row must have a score | SQL (run-local.sh) | **Pass** | assessment.sql: status=scored requires score and max_points. |
| `D-02` | Constraints | Skipped row must have no score | SQL (run-local.sh) | **Pass** | assessment.sql: a skipped item carries no score. |
| `D-03` | Constraints | Score can't exceed max | SQL (run-local.sh) | **Pass** | assessment.sql: score cannot exceed max_points. |
| `D-04` | Constraints | Max points must be positive | SQL (run-local.sh) | **Pass** | assessment.sql: max_points must be positive. |
| `D-05` | Constraints | Attempt starts at 1 | SQL (run-local.sh) | **Pass** | ADDED THIS RUN. attempt 0 rejected; proved it fails if a valid attempt is inserted. |
| `D-06` | Constraints | Only allowed support values | SQL (run-local.sh) | **Pass** | ADDED THIS RUN. mode_of_support 'helped' rejected. |
| `D-07` | Constraints | No duplicate item per attempt | SQL (run-local.sh) | **Pass** | assessment.sql: duplicate (session_id, item_id, attempt) rejected. |
| `P-01` | Planner | Item evidence reaches the planner | Manual (app) + log | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. recentFeedbackContext() carries the counted per-question evidence; its shape is unit-tested in tests/captureEvidence.test.ts. |
| `P-02` | Planner | Parent feedback still steers pacing | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. parent_feedback is never written as a score. |
| `R-01` | recommend() | One session only | Unit test | **Pass** | tests/scenarios.test.ts R-01. |
| `R-02` | recommend() | Second session too thin | Unit test | **Pass** | R-02: minItemsPerSession=2 makes session 2 too thin. |
| `R-03` | recommend() | Iliana: low regrouping | Unit test | **Pass** | R-03 passes AS WRITTEN: the fixture's skill 'regrouping' is not an id in data/skill-map.json, so there is nothing underneath and the engine says 'no prerequisite mapped' instead of inventing one. The note's expectation is covered by a second test using the real id math.subtraction_within_100, which names math.place_value_100. So the row and the note are both satisfied; the fixture just has to carry a mapped id to exercise Phase 3. |
| `R-04` | recommend() | Exactly 50% | Unit test | **Pass** | R-04: exactly 50% practises. prerequisiteBelow is a strict <. |
| `R-05` | recommend() | Just under 50% | Unit test | **Pass** | R-05: 49/100 by points, not whole items. |
| `R-06` | recommend() | Between thresholds | Unit test | **Pass** | R-06. |
| `R-07` | recommend() | Exactly 80% | Unit test | **Pass** | R-07: transferAtOrAbove is >=, so exactly 80% stretches. |
| `R-08` | recommend() | Only prompted answers | Unit test | **Pass** | R-08. |
| `R-09` | recommend() | Accommodated counts as independent | Unit test | **Pass** | R-09: INDEPENDENT_MODES = independent + accommodated. |
| `R-10` | recommend() | Leo: speed round excluded | Unit test | **Pass** | R-10: 9/10. Also asserts the counterfactual the row states (10/14 = 71% -> practise) so the exclusion is proved load-bearing. |
| `R-11` | recommend() | Retries ignored | Unit test | **Pass** | R-11: 3/4. |
| `R-12` | recommend() | Skipped items left out entirely | Unit test | **Pass** | R-12: 4/4, not 4/6. |
| `R-13` | recommend() | Old evidence expires | Unit test | **Pass** | R-13, including the one-recent-session variant. |
| `R-14` | recommend() | Unclosed session ignored | Unit test | **Pass** | R-14. |
| `R-15` | recommend() | Falls back to topic_id | Unit test | **Pass** | R-15: groupKey() falls back skillId -> topicId. |
| `R-16` | recommend() | Skills kept separate | Unit test | **Pass** | R-16. NOTE: this needed a new export. recommend() returns ONE decision by design (the weakest skill, which is what the 9pm page shows). recommendAll() was added this run as a pure refactor - no behaviour change, 519 existing tests still pass - and returns one decision per skill, which is what this row asks for. |
| `R-17` | recommend() | Evidence is shown | Unit test | **Pass** | R-17: evidence holds exactly the counted rows; prompted, retry, unclosed and skipped rows are all excluded. |
| `R-18` | recommend() | Handoff acceptance table | Unit test | **Blocked** | RAISED, NOT RESOLVED. This row says nine rows; the committed handoff table has ELEVEN. A test now pins the count at 11 so it cannot drift. Three of the eleven bear on recommend() and all three pass (plus the skipped/assisted row). The other seven are capture, versioning, rendering and export concerns that recommend() cannot answer; they are listed at the foot of lib/recommend.ts with where each belongs. The row cannot be run as written. |
| `R-19` | recommend() | Pure function | Unit test | **Pass** | R-19: identical output on repeat, input not mutated, and the module's source contains no supabase, fetch( or process.env. The whole vitest suite runs with no database. |
| `U-01` | Child page | Next-step card shows | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. Verified on /demo/loop instead: 'Ready to stretch - Multi-digit multiplication, 12 of 12 right on their own, over 2 sessions'. |
| `U-02` | Child page | Evidence expands | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. /demo/loop renders 'Show the 12 questions this is counted from'. |
| `U-03` | Child page | No achievement levels | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. No 1-4 wording exists anywhere in the recommend path. |
| `U-04` | Child page | Brand-new child | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. /demo/loop shows 'Not enough recorded yet' after one session. |
| `U-05` | Child page | Class row | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. A class profile is refused at the database and in the action. |
| `E-01` | End to end | Leo: full loop to transfer | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. The loop itself was driven end to end on /demo/loop. |
| `E-02` | End to end | Iliana: low regrouping | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. Engine half covered by R-03. |
| `E-03` | End to end | Penny: help-heavy week | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. Engine half covered by R-08. |
| `G-01` | Regression | Plan generation still works | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. tests/analysisShape.test.ts asserts the nine sections. |
| `G-02` | Regression | Progress tally unchanged | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. |
| `G-03` | Regression | Decodable check still bites | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. tests/decodableCheck.test.ts covers the checker on fixtures, including the two passages that failed the first live eval. |
| `G-04` | Regression | Worksheet prints | Manual (app) | **Blocked** | Blocked: needs a Supabase project, a signed-in adult and a saved profile. None exist in this container. |
| `G-05` | Regression | Existing RLS and app-write tests | SQL (run-local.sh) | **Pass** | run-local.sh: rls.sql, app-writes.sql and assessment.sql all pass. rls.sql also had one assertion that could not fail; fixed in b01e0d5. |
