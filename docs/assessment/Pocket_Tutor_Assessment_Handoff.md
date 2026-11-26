# AI Pocket Tutor assessment engine

## Paste this into the app builder

Add an adult-run **Assess → Teach → Practise → Recheck** workflow to AI Pocket Tutor. Start with Ontario Grades 1, 3 and 5. Give the adult a separate assessment for each learner and let them select a grade, subject, and skill or choose a broad starting check. Use the child’s enrolled grade for curriculum navigation and the evidence for choosing where instruction starts. Keep existing curriculum data, profiles, lesson planning, permissions, and print components. Use that same plan generator after an assessment.

Build two ways to run each check from the same versioned items. In the interactive view, the learner can select or enter answers while the adult controls the session and records oral, drawn, or written work. In print, provide a student sheet and a separate adult key with answer, method, rubric, and prompting instructions. The adult sees skill-level evidence, the next priority, a ready-to-use teaching activity, and a fresh recheck. Support parent, homeschooler, and teacher accounts through the app’s existing ownership model.

Use the content and acceptance cases below as initial fixtures. Keep the assessment and scoring rules in code. The model can draft items, hints, passages or explanations from approved skill data. Validate them before use. The assessment should still run if model generation fails.

## What we used at home

The September Studio Learning Pack used short printable pages with one worksheet per learner. The adult worked directly with Grade 1 for 10–15 minutes while the older learners tried a page independently. The adult checked the first few questions or the writing plan, reviewed the page together afterward, and recorded **Easy / Just right / Hard**. Keep that rating as a parent or learner observation. It should guide pacing and example selection without changing the score. Pause and save when a learner is frustrated. One missed or skipped item can be followed by a smaller check on the same skill.

| Grade | Recovered worksheet and test logic |
|---|---|
| 1 | Teach or review **s/a/t**, then **p/i/n**, two or three letters at a time. Say the name, say the sound, trace upper and lower case, find matching letters, then write. Use words such as sun, apple, turtle, pig, insect and nest in adult-led first-sound checks. With known sounds, blend and read **sat, sit, tap, pat, pin, tin, nap** and **ant**. The adult records independent reads separately from modelled or prompted reads. Math uses dot groups, number order forwards and backwards, comparing numbers to 20, and joining small groups. |
| 3 | Identify hundreds, tens and ones (including a zero tens digit), expand, compare and order numbers. Progress through adding and subtracting with and without regrouping, then solve a story problem with an equation and answer. Teach multiplication through drawings of equal groups, repeated addition and a matching multiplication fact. For writing, fix capitals and punctuation, add a useful detail, then write three connected sentences. November work added **Answer, Prove, Explain** for patterning and a community-place paragraph using a graphic organizer. When the adult confirms a teacher instruction such as “choose two places,” use it as the assignment instruction even if the original paper template says “choose one.” Record the override. |
| 5 | Build accuracy first with multi-digit operations, fact recall, division, estimation, equivalent and comparative fractions, and fractions of quantities. In word problems, highlight the question and useful quantities, show work with units, and explain why an operation fits. For writing, edit a paragraph, combine sentences, then plan an opinion with two reasons, examples and a closing idea. The October assessment also included science, reading and other subjects. |
| Historical Grade 4 bridge | The perimeter tests used labelled rectangles and irregular shapes with missing side lengths, followed by metric conversions, including fractional kilometres. Use selected Grade 4 bridge items if a Grade 5 learner shows a prerequisite gap. Retain the learner’s Grade 5 enrolment and show the practice level separately. |

In the October plan we asked for separate Grades 1, 3 and 5 diagnostics, then adaptation to grade level or beyond. Recovered baseline breadth was Grade 1 early literacy, math, science, social studies and coding, and Grades 3 and 5 reading/language, math, science, social studies, coding and French/Spanish. Keep breadth configurable and only mark subjects as Ontario-aligned where the approved curriculum catalog supports it. Spanish can be treated as enrichment unless its program mapping is independently verified. A broad baseline can span multiple sessions. The earlier five-day routine and progression from foundations to grade-level work to extension can remain planning options. A 10–15-minute skill check is the default unit for the integration.

## Curriculum and skill model

Use Ontario curriculum versions **Mathematics 2020**, **Language 2023** with the Language Foundations Continuum, and **Science and Technology 2022**. Read grade, subject, expectation code and wording from the existing curriculum catalog. If a subject or expectation is missing, use an explicitly unmapped draft, then approve it after checking the primary source. The August Pocket Tutor review reported Science and Technology and Kindergarten as outstanding catalog work. Check current coverage in the app before seeding. Store edition, source URL, expectation ID, and verification with each mapping. Ontario Grade 3 math **C1.3** is the verified pattern-rule and prediction fixture. Ontario Grade 5 science **E2.1** is the verified fixture for forms of energy and everyday uses. These two codes can recur in other grades or subjects, so never use the code alone as the record key.

| Skill ID examples | Instructional sequence or prerequisite checks |
|---|---|
| `g1.read.letter_sound`, `g1.read.initial_sound`, `g1.read.blend`, `g1.read.cvc` | Check letter name and sound individually. Check oral first sounds separately and allow them to develop alongside letter knowledge. For printed blending, check the grapheme–phoneme correspondences used in the word. Blend known sounds, read fresh controlled words, then try short controlled sentences and dictation. A modelled read of the same word is teaching evidence. |
| `g1.math.count`, `g1.math.order`, `g1.math.join` | Count concrete objects and state the total, identify/order numerals, then model small additions by joining. Use picture descriptions or adult-administered manipulatives where appropriate. |
| `g3.math.place_value`, `g3.math.regroup`, `g3.math.equal_groups`, `g3.math.pattern_predict` | Check place value before diagnosing regrouping. Check grouping and representation before interpreting multiplication-fact mistakes. For patterns, find the rule, show repeated steps, and use them to justify a prediction. |
| `g3.write.conventions`, `g3.write.detail`, `g3.write.paragraph` | Check sentences and mechanics, then relevant details, then connected sentences with a clear main idea. Keep opinions and personal choices open where the prompt allows. |
| `g5.math.fraction_equivalence`, `g5.math.fraction_compare`, `g5.math.fraction_of_set`, `g5.math.multi_step` | Use denominators, drawings or equivalent fractions as appropriate. For fractions of a set, validate the multiplication/division strategy separately from the final number. A complete multistep response can show equation, intermediate values, conclusion and units. |
| `g5.sci.energy_forms` | Name an energy form and connect it to an everyday example. Then check application with a fresh device. Score concept knowledge independently of spelling unless the question explicitly targets terminology. Confirm the classroom unit before assigning the example. |
| `g5.write.edit`, `g5.write.combine`, `g5.write.opinion` | Check editing, sentence combination, then opinion, reasons, supporting examples and closing. Use a rubric with several valid answers. |

These are internal skill IDs. Map them many-to-many to approved curriculum records, and give each item one primary skill for routing. Keep prerequisites explicit in data. When possible use the app’s official curriculum wording from its approved dataset and use plain-language skill names for families.

## Assessment design and marking

1. **Intake.** Select learner, enrolled grade, subject and optional concern, recent work or teacher directions. Keep any upload or report-card comment as attributed input. When no sample is available, propose a starting check using the selected objective and make no claims about the learner’s performance.
2. **Baseline.** Start with a simple entry item, then grade-level items and one application or transfer item when appropriate. Default to 5–8 questions for a short worksheet. For Grade 1 use fewer items if needed and let an adult record oral performance. Use Easy / Medium / Hard as item difficulty labels when feeding the existing renderer. Make the prompt, reading load, number range and form match the skill being measured.
3. **Capture evidence.** Use `independent`, `prompted`, or `modelled` on every marked response. An approved access support, such as reading aloud a maths story, can remain independent if it does not supply the assessed skill. Reading aloud a word being tested for decoding supplies the skill. Record a blank as skipped or not observed. A written, drawn or oral response can satisfy a math reasoning rubric.
4. **Score.** Auto-grade constrained answers using validated answer keys, unit checks and normalization. Use individual rubric criteria for sentences, scientific reasoning, drawings and written explanations. Show which criteria were met without requiring the answer key’s exact wording. The adult confirms oral and open responses. Treat a plausible error pattern as a hypothesis until corroborated.
5. **Choose next work.** The starter code uses independent whole-item correctness across the latest two sessions with independent evidence. Fewer than two scored independent items in either session calls for more evidence. At 80% or more pooled accuracy with some success in both sessions, try transfer or extension. Below 50%, check a relevant prerequisite before stepping back and keep the same goal if prerequisites are secure. Otherwise continue with a fresh form at the same skill. These are proposed, configurable application thresholds. Avoid applying them to a school achievement level or treating them as diagnostic cutoffs.
6. **Teach and recheck.** Model one example, do one together, then ask for two or three new independent examples. Focus feedback on one correctable step at a time. Use fresh numbers, words or contexts on the same skill in the next independent check, with roughly the same difficulty. Surface the new and prior results side by side.
7. **Summarize.** Display what the learner demonstrated, the specific step still developing and one next activity. Preserve the existing Pocket Tutor nine-part plan shape where applicable: observation, gaps, top priorities, teaching, worksheet, answer key, tips, next step and feedback question. If there is only one supported priority, show one. For the teacher view, use the existing support / on-level / extension differentiation per objective. Keep this engine’s practice statuses distinct from Ontario achievement-chart levels.
8. **Print and revisit.** Keep the question, its diagram and workspace together. Provide text labels and equivalent ways to respond where they preserve what is being assessed. Show the adult which instructions they can read verbatim, which examples are teaching, and when to hide the answer key.

## APE and item examples

**Answer** is what the learner found, including the relevant date or units. **Prove** is visible evidence such as a calculation, calendar hops, a drawing or a sequence. **Explain** connects the rule or evidence to the answer in the learner’s own words. Present each prompt separately. “It goes up by six” can be a useful part of Prove, and adding actual steps makes the evidence visible. A correct explanation can be short.

| Item | Key or rubric |
|---|---|
| Grade 3 reconstructed pattern fixture. The visits shown are November 2, 8 and 14. When is the very next visit? Show how you know. | **A** November 20 (1). **P** Shows hops of six through the listed dates to 20 (1). **E** Explains that visits repeat every six days, so the next one is six days after the last listed date (1). This fixture preserves the corrected answer **20 November** from the November conversation. The sample starting dates are newly authored. |
| Grade 1 letter sound. Show the letter `s` by itself and ask “What sound does this letter make?” | The adult records /s/ as independent if no sound cue was given. A correct letter name is evidence for a different target. Reading `sat` after the adult supplies /s/ is prompted. |
| Grade 3 equal groups. Draw three groups of four, show repeated addition, and write a multiplication sentence. | Draw three groups with four in each, show 4 + 4 + 4, and find 12. Score group structure, representation and total independently. If the goal is to map factors to roles, state the order convention in the prompt. |
| Grade 3 writing. Choose two places in your community and explain why each matters to you. | Score two clearly identified places, relevant details/reasons for each, and organization. Conventions can have a separate criterion. The learner can use a plaza/library and a lake, or any places that fit. |
| Grade 5 fraction of a group. A book has 200 pages. A learner read three fifths. How many pages did they read? | 120 pages. Give method credit for 200 ÷ 5 × 3 or equivalent reasoning. A wrong final number can retain method credit. |
| Grade 5 original integration example. Name a form of energy and describe one way it is used in everyday life. | 1 point to name a valid form and 1 point for a use that matches it. Example: light energy from a lamp helps us see. Accept other valid pairings. A model answer is an example. |

A copied worksheet can contain a wrong key. For the calendar case, derive the date from the rule, verify each shown term, and generate both the printed key and interactive expected response from the same calculation. Store full dates internally and localize the display to Canadian English. Set the formatting time zone explicitly for date-only values.

## App integration contract

| Record or operation | Minimum shape and behaviour |
|---|---|
| Skill | `id, jurisdiction, subject, instructionalGrade, label, prerequisiteIds[], expectationIds[]`. Keep enrolled and instructional grades on separate fields in the flow. |
| Assessment version | `id, version, learnerId, mode, subject, selectedSkillIds[], locale, itemSnapshots[], status, createdBy`. Store item order, content, approved key and rubric at assignment. Score that snapshot after publish even if the source item changes. |
| Item snapshot | `id, version, primarySkillId, expectationIds[], difficulty, kind, prompt, choices?, asset?, key, rubric?, maxPoints, adultDirections?, source`. Use stable choice IDs. Keys, sample answers and scoring notes stay on the adult/server side until released. |
| Observation | `assessmentId, sessionId, itemId, recordedBy, answer, modeOfSupport, supportUsed?, status, rubricScores?, score, maxPoints`. No score for skipped/awaiting-review observations. Keep attempt history and record which response is the official first scored response for adaptation. |
| Session and follow-up | `sessionId, assessments[], completedAt, feltDifficulty?, adultNotes?, selectedNextSkillId?`. Use closed sessions for recommendations and the original official attempt per item. Retry and modelling feedback remain in history. |
| Generate / save / finish | Generate server-side from approved curriculum and bank/templates. Autosave by item and attempt ID. Finish transactionally using an idempotency key, compute from the saved snapshot and return the same completed result on retry. Serialize or detect conflicting updates. |
| Adult report | Provide scored/attempted/skipped/pending counts, independent vs assisted results, rubric evidence and a recommendation. Allow an adult to review uncertain scoring, recording both the original suggestion and the confirmed score. |

For derived answers, independently recompute the key and check distractors for duplicated or equivalent choices. Check decodable words against the approved phonics scope, diagrams against numeric dimensions, and author-supplied marks against the rubric. Preserve score histories when revising results. Use one access decision server-side for reports, snapshots, keys, and private uploads. Keep names, contact information, school information and raw school records out of seeds, logs and generation inputs unless genuinely needed. Optional upload interpretation should send only the relevant minimized text. Student views can be launched by an authorized adult without a separate child account.

## Executable reference module

Copy this JavaScript block to `assessment-core.mjs`. It is dependency-free. Call these functions from your existing server layer. The same content bank and renderer can serve interactive and print formats.

```js
const DAY_MS = 86_400_000;

function utcDay(iso) {
  if (typeof iso !== "string" || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(iso)) {
    throw new RangeError("Expected an ISO date such as 2026-11-02");
  }
  const date = new Date(`${iso}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== iso) {
    throw new RangeError("Invalid calendar date");
  }
  return date.getTime();
}

export function calendarPattern({ firstDate, stepDays, shownCount, targetTerm }) {
  const start = utcDay(firstDate);
  if (!Number.isInteger(stepDays) || stepDays < 1 || stepDays > 366 ||
      !Number.isInteger(shownCount) || shownCount < 2 || shownCount > 20 ||
      !Number.isInteger(targetTerm) || targetTerm <= shownCount || targetTerm > 30) {
    throw new RangeError("Invalid positive-step pattern");
  }
  const dates = Array.from({ length: targetTerm }, (_, i) => {
    const iso = new Date(start + i * stepDays * DAY_MS).toISOString().slice(0, 10);
    utcDay(iso);
    return iso;
  });
  return { shown: dates.slice(0, shownCount), answer: dates.at(-1), proof: dates, stepDays };
}

function numericAnswer(raw) {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const value = raw.trim().replace(/^−/, "-");
  if (!/^[+-]?(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?|\.\d+)$/.test(value)) return null;
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function scoreNumber(raw, expected, tolerance = 0) {
  if (!Number.isFinite(expected) || !Number.isFinite(tolerance) || tolerance < 0) {
    throw new RangeError("Invalid numeric key");
  }
  if (raw == null || (typeof raw === "string" && raw.trim() === "")) {
    return { status: "skipped" };
  }
  const parsed = numericAnswer(raw);
  return { status: "scored", score: Number(parsed !== null &&
    Math.abs(parsed - expected) <= tolerance), maxPoints: 1 };
}

export function markRubric(criteria, confirmedScores) {
  if (!Array.isArray(criteria) || criteria.length === 0 ||
      new Set(criteria.map(c => c.id)).size !== criteria.length ||
      criteria.some(c => typeof c.id !== "string" || !c.id ||
        !Number.isInteger(c.maxPoints) || c.maxPoints < 1)) {
    throw new RangeError("Invalid rubric");
  }
  const scores = criteria.map(c => {
    const value = Object.hasOwn(confirmedScores, c.id) ? confirmedScores[c.id] : null;
    if (value != null && (!Number.isInteger(value) || value < 0 || value > c.maxPoints)) {
      throw new RangeError(`Invalid score for ${c.id}`);
    }
    return value;
  });
  if (scores.includes(null)) return { status: "pending_review" };
  return { status: "scored", score: scores.reduce((sum, score) => sum + score, 0),
    maxPoints: criteria.reduce((sum, c) => sum + c.maxPoints, 0) };
}

// Sessions are closed, ordered oldest to newest and already filtered to one
// skill and one comparable difficulty band. Each item appears once per session.
export function recommend(sessions) {
  const valid = sessions.map(session => session.items.filter(item =>
    item.modeOfSupport === "independent" && item.status === "scored" &&
    Number.isFinite(item.score) && Number.isFinite(item.maxPoints) &&
    item.maxPoints > 0 && item.score >= 0 && item.score <= item.maxPoints
  )).filter(items => items.length > 0).slice(-2);
  if (valid.length < 2 || valid.some(items => items.length < 2)) {
    return { decision: "collect_more_evidence" };
  }
  const checks = valid.flat();
  const isCorrect = item => item.score === item.maxPoints;
  const correct = checks.filter(isCorrect).length;
  const accuracy = correct / checks.length;
  if (accuracy >= 0.8 && valid.every(items => items.some(isCorrect))) {
    return { decision: "try_transfer", correct, total: checks.length, accuracy };
  }
  return { decision: accuracy < 0.5 ? "check_prerequisite" : "practise_same_skill",
    correct, total: checks.length, accuracy };
}
```

For metric conversions, use a common integer scale or exact rational arithmetic. For fractions, parse numerator/denominator as integers, reject zero denominators, and compare by exact cross multiplication. For repeating patterns, store the repeat unit and index from a documented origin. For perimeter, store vertices or all intended lengths. Validate polygon closure and calculate from actual boundary segments. Score unit as a separate criterion when the prompt requires it. For oral reading, store which item was read and how it was delivered, without requiring a recording.

## Acceptance cases

| Scenario | Expected result |
|---|---|
| ISO calendar fixture starts `2026-11-02`, interval 6, three shown, target term 4 | Answer `2026-11-20`, proof dates 02, 08, 14, 20. A leap-year item and a December-to-January item also calculate correctly. Reject impossible start dates. |
| Numeric answers `1,200`, `0`, blank, and `1,2` | A correctly grouped number and zero can score. Blank is skipped. Malformed grouping is incorrect. Provide a separate unit field where required. |
| Correct APE answer with one of two reasoning criteria met | 2/3 after adult confirmation. The answer can earn credit even when reasoning is incomplete. A missing criterion means pending review until the adult explicitly chooses a mark, including zero. |
| Sound cue immediately before a correct read | Saved as prompted. The same word in the same assessment cannot be counted again as a new independent first attempt. |
| Only skipped or assisted evidence | Insufficient independent evidence. The app still shows what happened and can offer guided practice. |
| Two independent sessions with 5/6 full-credit items overall and success in each | Try transfer. With 2/6, check a prerequisite. With 4/6, practise the same skill. |
| Marked answer arrives twice or an adult refreshes during submission | Single official result and unchanged recommendation. Resuming a draft preserves item order, answers and version. |
| Old curriculum snapshot and later bank edits | Old assessment reprints and scores from its saved version. A new assessment can use the new version. |
| Subject expectation unavailable or generated item fails validation | Explicit unmapped draft or a valid bank item. No manufactured expectation code or official alignment label. |
| Student view or student PDF | Fully usable question and work space. Adult key appears only in its approved view or separate export. |
| Grade 5 learner takes a Grade 4 perimeter prerequisite | Enrolled Grade 5 remains on the profile. Report names the Grade 4 skill actually practised. |

## Source material and reconstruction limits

- [Original Studio Learning Pack](https://chatgpt.com/library?file_id=libfile_fd4f4d7d00d881918302130127362953&account_id=personal) supplies the September Grades 1, 3 and 5 worksheets and keys. [Grade 4 perimeter and conversions practice](https://chatgpt.com/library?file_id=libfile_7f78e7cc4c9c81919e648886da2780d1&account_id=personal) supplies the bridge example.
- [August Pocket Tutor build review](https://chatgpt.com/library?file_id=libfile_f2497006907881919f6c491617e501a3&account_id=personal) supplies the documented adult-only workflow, coverage at the time, plan format and existing differentiation. [Pocket Tutor educational and product brief](https://chatgpt.com/library?file_id=libfile_47ec57c1cf3c81919f8331c2abb05cfe&account_id=personal) supplies the original short-session and targeted-practice goals. Earlier October and November chats supply the diagnostic scope, patterning correction, and community-writing accommodation.
- Primary curriculum references are [Mathematics 2020](https://assets-us-01.kc-usercontent.com/fbd574c4-da36-0066-a0c5-849ffb2de96e/3ed76499-9df4-4524-8cc2-3c0010a51811/The%20Ontario%20Curriculum%20Grades%201%E2%80%938%20-%20Mathematics%2C%202020%20%28January%202021%29.pdf), [Language 2023](https://assets-us-01.kc-usercontent.com/fbd574c4-da36-0066-a0c5-849ffb2de96e/524f0b97-2910-48f7-ad61-1339c2948a33/Language_G1-8_2023_AODA.pdf), and [Science and Technology 2022](https://assets-us-01.kc-usercontent.com/fbd574c4-da36-0066-a0c5-849ffb2de96e/36038265-bd6d-4991-882b-52b4b06c32d0/The%20Ontario%20Curriculum%20Grades%201%E2%80%938%20%E2%80%93%20Science%20and%20Technology%202022_2.pdf).
- The full October diagnostic and the original November science test were not recovered. Exact sample items are attributed where known. The Grade 5 science example, calendar starting dates, data structures and numeric adaptation defaults were written for this integration. The runnable module is new reference code. Repository names, file paths and deployed schema should be confirmed in your app workspace before wiring it in.
