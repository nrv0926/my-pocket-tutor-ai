# Test journeys

Seventeen walks through the app, written so a failure is unambiguous. Each step says
what to do and what should happen; each journey ends with the specific thing
that counts as a bug.

The automated suite (`npm test`, 206 tests) covers shapes and rules. These
cover the things only a person notices — whether the copy speaks to the right
reader, whether a plan is usable in a classroom, whether it prints.

A styled version of this document is published as an artifact for sharing.
This file is the one that gets updated when the app changes.

---

## Before you start

**Journeys 1, 2, 8, 10, 11 and 16 need nothing configured.** (17 needs Supabase.) They are the demo path and
should work on any deployment. Run these first — if something is broken there,
it is broken for everyone.

**Journeys 3–7 and 9 need Supabase** reachable with the schema applied. If the
person testing will sign in with their own email, custom SMTP must be set up
first: the built-in sender only delivers to your own Supabase organisation and
caps at two emails an hour (SETUP.md §4c).

Without `ANTHROPIC_API_KEY` the app returns the same deterministic sample plan
every time. Every screen still works — just don't claim it is analysing live
input.

---

## 1. A teacher lands cold and finds her own sample
*No setup. She has about ninety seconds.*

1. Open `/` in a fresh window. → Renders fully; no error, no blank screen, no
   console errors.
2. Navigate to `/for/teacher`. → Copy addressed to a classroom teacher —
   rotations, small groups — not a parent at bedtime.
3. Click **Try a sample · no signup**. → Lands on `/try/teacher`, *not* `/try`.
   The scenario is a Grade 3 guided-reading group stalled on multisyllabic
   decoding.
4. Use the audience tabs: Parent, Homeschooler, back. → Three genuinely
   different scenarios; the active tab is filled dark.

**Bug:** landing on `/try` from the teacher page. That was a real defect — a
teacher clicking "Try a sample" used to get a parent worrying about bedtime
stories.

## 2. She reads the teacher plan properly
*No setup. This is the page the whole demo rests on.*

1. Count the numbered sections. → Exactly nine, in order, ending with "Was this
   too easy, just right, or too hard?"
2. Read section 1. → It names the misconception rather than reassuring her: the
   guessing is described as diagnostic, not a bad habit.
3. In section 4, find **Same lesson, three tracks**. → Needs support / Whole
   group / Ready for more, plus a *Watch for* note. The support track is a
   smaller step of the same skill, not a different activity.
4. Find **Ready to use — no prep**. → Eight sound-drill cards with cut lines
   (ai, ee, oa, ou, ea, oi, ay, igh), word lists, three sentence strips,
   dictation words, and what to say when a student guesses.
5. Check the lesson order and the worksheet. → Sound Drill → Blend → Word
   Reading → Sentence Reading → Dictation with minute counts; the worksheet is
   an exit ticket tagged Easy/Medium/Hard.

**Bug:** any step telling her to *make* something without giving it to her —
"write six cards", "pick a short passage". Producing the materials rather than
describing them was her sharpest piece of feedback.

## 3. Magic-link sign-in, on a phone
*Needs Supabase. The step that has broken before.*

1. `/login`, enter your email, send. → "Check your inbox". If it says sign-in
   isn't set up, the environment variables never reached the build — set them
   and redeploy.
2. Hover the link in the email before clicking. → Starts with your deployed URL.
   Anything pointing at `localhost` means the Supabase Site URL is still wrong.
3. Click it, ideally from your phone. → Signed in, email in the header.
4. Sign out, visit `/dashboard` directly. → Redirected to
   `/login?next=%2Fdashboard`, and after signing in you land on the dashboard.

**Bug:** `ERR_CONNECTION_REFUSED`, or landing signed-out on the home page with
`?code=` in the address bar.

## 4. The app asks a teacher teacher questions
*Needs Supabase. The intake used to ask everyone for "your child's nickname".*

1. From `/for/teacher`, signed in, click **Start a child profile**. → Heading
   reads "Tell us about your student".
2. Read every field label. → "Student initials or nickname (never a full name)",
   "What's already secure", "Where it breaks down", "What do you need them to be
   able to do?". Button says "Create student profile".
3. Open the Grade dropdown. → K through 8, nine options.
4. Save a Grade 3 student, then repeat from `/for/parent`. → Parent wording
   throughout.

**Bug:** a teacher asked for a child's nickname, or a grade list stopping at 6.

## 5. Planning against a named Ontario expectation
*Needs Supabase. 1,189 transcribed expectations sit behind this dropdown.*

1. `/session/new`, pick the Grade 3 student. → Subjects read Language,
   Mathematics, Science and Technology, French — not Reading and Writing, which
   are Language strands.
2. With Language selected, open **Ontario expectation**. → ~45 options grouped by
   strand A–D, each a code plus its published wording; the caption states the
   count and grade.
3. Switch to Science and Technology. → "Not transcribed for this subject yet."
   An honest empty state, never an empty dropdown or an invented code.
4. Switch to French. → Three program buttons. Core and Extended are empty below
   Grade 4; Immersion has options from Grade 1.
5. Back on Language, choose `B2.1`, describe a difficulty, generate. → A
   nine-section plan aimed at that expectation, with the code named in *What to
   teach next*.

**Bug:** any expectation code not in the official Ontario curriculum, or wording
that paraphrases rather than quotes it. A teacher will check.

## 6. The second session continues the first
*Needs Supabase. She said this one twice.*

1. Read the first plan's *Next step plan*. → A concrete commitment.
2. Create a second session, same student and subject. → *What I notice* opens by
   saying how today follows on from last time.
3. Compare the two *What to teach next* lists. → The second moves on; it should
   not re-teach the same three priorities unless feedback said they did not land.
4. Create a session for a brand-new student. → A baseline plan, with no reference
   to a previous session that never happened.

**Bug:** a second plan reading as though the first never happened — or a first
plan referring to one that does not exist.

## 7. Progress, and the clock
*Needs Supabase. "Wrong time" was in her notes and it was a real bug.*

1. `/dashboard`, read the timestamp on the session you just made. → Your local
   Ontario time. A 9pm session reads 9pm, not 1am the next day.
2. Open the result, then the child's progress page. → Timestamps agree across all
   three screens.
3. Mark one session "too hard". → It records, and the next plan steps down rather
   than pushing on.

**Bug:** any timestamp four or five hours ahead — the server's clock leaking
through instead of the reader's.

## 8. The whole thing on a phone
*No setup. Test at 360px.*

1. 360px wide, load `/`. → No sideways scrolling anywhere.
2. Scroll to the magenta subject list. → "COMPREHENSION" fits inside the screen.
3. Open the hamburger menu. → It opens, the page behind stops scrolling, tapping
   a link navigates and closes it, tapping outside closes it.
4. Check the header. → Logo, hamburger and "Start free" on one line, label not
   wrapping.
5. Load `/try/teacher`. → The three tracks stack vertically, Needs support first.

**Bug:** any horizontal scroll, or a hamburger leaving the page scrolling
underneath it.

## 9. Things going wrong on purpose
*Needs Supabase. Nothing here should show a stack trace or a blank page.*

1. Signed out, visit `/dashboard`, `/session/new`, `/settings`, `/upload`,
   `/children/new`. → Every one redirects to `/login` carrying `?next=`.
2. Visit `/results/00000000-0000-0000-0000-000000000000`. → Not-found or a
   redirect. Never someone else's data, never a raw error.
3. Submit the session form with one character. → "Tell us a little more so we can
   help." No AI call is made.
4. Pick a Kindergarten student, open the expectation dropdown. → "Ontario
   publishes Kindergarten as its own program, not as expectations inside each
   subject." The honest reason, not a generic empty message.
5. Visit `/qa-preview` on the deployed site. → 404. That gallery is
   development-only.

**Bug:** a protected page rendering while signed out, or `/qa-preview` reachable
in production.

## 10. She prints it and walks to class
*No setup. A plan she cannot print is a plan she cannot teach from.*

1. On `/try/teacher`, open print preview. → All nine sections present and
   readable on paper.
2. Look at the sound-drill cards. → Dashed cut lines intact, no card split across
   a page break.
3. Check the three tracks and the worksheet. → Each track stays whole; worksheet
   and answer key legible in black and white.

**Bug:** a card cut in half by a page break, or anything readable on screen but
not on paper.

## 11. Browsing to an objective instead of typing one
*No setup. `/curriculum` is public — this is also a page worth showing someone.*

1. Open `/curriculum`. → Grade 3 Language by default: 12 objectives, 60
   expectations, grouped by strand.
2. Click through Grades K to 8. → The URL changes and the page follows. Grade K
   says Ontario publishes Kindergarten as its own program document.
3. Switch to Mathematics. → 9 objectives at Grade 3. Switch to Science and
   Technology → the honest "not transcribed yet".
4. Switch to French. → Three programs appear. Core at Grade 2 says it starts at
   Grade 4; Immersion at Grade 2 has expectations.
5. Open an objective, then click **Plan this**. → You land on `/session/new`
   with that subject and expectation already selected.

**Bug:** more than about a dozen objectives at any one step — the whole point is
that no step is a scroll. Or a "Plan this" that arrives empty.

## 12. Searching the words a teacher actually uses
*Needs Supabase (the picker lives on the session form).*

1. On `/session/new`, pick a Grade 3 student and Language. Type `syllable` in
   the expectation search. → Three results: B2.1, B2.2, B2.3.
2. Read the note above the list. → It says the match came through the
   Foundations Continuum, and names the skill and codes.
3. Try `decoding`. → One result, B2.5, again via the continuum.
4. Try `spelling`. → Four results, matched directly in the wording.
5. Try `zzzz`. → "Nothing matches" — and no invented codes.

**Bug:** `syllable` or `decoding` returning nothing. Neither word appears in
Ontario's expectation wording, so a direct-only search fails on exactly the
vocabulary she reaches for.

## 13. Placing a learner, and a class, on the 1–4 chart
*Needs Supabase. Teachers and homeschoolers only.*

1. As a teacher, on `/session/new` with a student selected. → An
   **Achievement level** control offers Levels 1–4.
2. Read Level 3's label. → "At the provincial standard". Never phrased as a
   shortfall or a middling result.
3. Select Level 1, generate a plan. → It steps down to something the child can
   already do rather than pitching at grade level.
4. Switch role to Parent (journey 14) and return. → The level control is gone.
   A parent has never been asked to place their child on the chart.
5. Create a class profile, select it. → The single-level control is replaced by
   four counts, one per level, and the caption totals the room.

**Bug:** a parent being asked for an achievement level, or any copy implying
Level 4 is the goal and Level 3 a shortfall.

## 14. Switching what you are planning for
*Needs Supabase.*

1. Open `/settings`. → A "What are you planning for?" section with Parent,
   Homeschooler and Teacher; the current one is marked.
2. Switch to Teacher, then open `/children/new`. → "Tell us about your
   student", and a **One student / A whole class** switch.
3. Choose **A whole class**. → Wording changes to class name, "where the group
   splits", "Create class profile". The age field disappears.
4. Switch to Parent and reopen `/children/new`. → Parent wording, and no class
   option — a parent has one child.
5. Use the compact switcher on `/session/new`. → It switches in place and
   returns you to the same page.

**Bug:** being stuck with whichever role you first arrived through, or a
switcher that sends you anywhere other than back where you were.

## 15. Getting to an objective without knowing its wording
*Needs Supabase (the picker lives on the session form).*

1. On `/session/new` with a Grade 3 student. → A **What are you teaching?**
   box with a Grade dropdown and a Topic dropdown, not one list of sixty.
2. Open Topic. → Twelve, each named as Ontario names it — "B2 — Language
   Foundations for Reading and Writing".
3. Choose B2. → The objective's full wording appears, and the item list drops
   to four. The caption reads "4 to choose from in this topic".
4. Change Grade to 1. → The topic resets to All, the item list reloads for
   Grade 1, and a note says you are planning at Grade 1 for a Grade 3
   profile.
5. Generate the plan. → It targets the Grade 1 expectation you picked, and
   says which grade it is pitched at.

**Bug:** the plan quoting a Grade 3 expectation after you chose a Grade 1
one. The code is the same string at both grades and means different things —
that is the bug this journey exists to catch.

## 16. One lesson, a worksheet per level
*Needs Supabase for the real flow; `/qa-preview` shows the rendering with no
setup.*

1. As a teacher, select a class profile and give it a spread across two or
   more levels. → A checkbox offers a worksheet for each level in the room,
   already ticked, and counts them.
2. Set every student to one level. → The checkbox disappears. One level in
   the room needs one worksheet.
3. Generate with a spread of Level 1 and Level 3. → Section 5 holds three
   worksheets: Whole group, Level 1, Level 3. Section 6 holds a key for each.
4. Count the numbered sections. → Still exactly nine. The variants sit inside
   5 and 6, not beside them.
5. Open print preview. → All three worksheets and all three keys print.

**Bug:** a tenth section, a level in the output that nobody in the room sits
at, or a Level 1 worksheet that is a different activity rather than a smaller
step of the same one.

## 17. A plan with nothing written in the box
*Needs Supabase. This is the teacher who knows what she wants and has four
minutes before period three.*

1. On `/session/new`, look at the three mode cards. → The third reads **I
   know what to teach — pick it above. Nothing to write.**
2. Choose it without picking an expectation. → A note tells you to pick what
   they'll work on above. Submitting says the same thing rather than failing
   silently.
3. Pick Grade 3 → Language → B2 → an item, leave the box empty, submit. → A
   full nine-section plan.
4. Read section 1. → It reports only what it was given — what the profile
   says is secure, where it breaks down, the goal, the level. If the profile
   is thin it says so plainly.
5. Come in from `/curriculum` via **Plan this**. → You land already in the
   third mode, because you already said what to teach.

**Bug:** section 1 describing a struggle, a behaviour or a classroom moment
nobody told us about. There is a real child on the other end of that
sentence, and an invented noticing is worse than a short one.

---

## Regression watch

Bugs already fixed once, and the journey that would catch each coming back.

| What broke | How it showed up | Journey |
| --- | --- | --- |
| Missing Supabase config | Every route returned 500, landing page included | 1 |
| Suspense boundary | `/login` failed the production build outright | 3 |
| Server timezone | Evening sessions displayed as the next morning | 7 |
| Text overflow | "Comprehension" pushed the page sideways at 360px | 8 |
| Wrong sample linked | The teacher page sent visitors to the parent plan | 1 |
| Prep-list plans | Section 4 named materials without producing them | 2 |
| Subject taxonomy | Reading and Writing listed as subjects, not Language strands | 5 |
| Search vocabulary | "syllable" returned nothing; the word is not in Ontario's wording | 12 |
| Open redirect | Switching role redirected to a raw form value | 14 |
| Grade-blind lookup | A stepped-down code resolved against the profile's grade | 15 |
| Curriculum in the bundle | One client import took first load from 99 KB to 175 KB | — |

## Not covered, because it is not built

The "celebrate a win" consolidation session and the Science and Technology
curriculum. Planning from a blank box now works (journey 17); what is still
missing is doing it with no saved profile at all, which row-level security
makes a real change rather than a small one. See PRODUCT_ROADMAP.md.

**R is decided: no.** The scale is Ontario's 1–4 and nothing else.

The "prototype loop error" she hit during the walkthrough has never been
reproduced.
