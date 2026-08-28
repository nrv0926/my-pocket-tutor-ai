# Test journeys

Ten walks through the app, written so a failure is unambiguous. Each step says
what to do and what should happen; each journey ends with the specific thing
that counts as a bug.

The automated suite (`npm test`, 129 tests) covers shapes and rules. These
cover the things only a person notices — whether the copy speaks to the right
reader, whether a plan is usable in a classroom, whether it prints.

A styled version of this document is published as an artifact for sharing.
This file is the one that gets updated when the app changes.

---

## Before you start

**Journeys 1, 2, 8 and 10 need nothing configured.** They are the demo path and
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

## Not covered, because it is not built

A class-level plan with no student profile attached, bulk generation across
levels, and the Science and Technology curriculum. The class entity needs a
migration and a new row-level security policy before it can exist at all — see
PRODUCT_ROADMAP.md.

Two of her notes are still too compressed to test against: "object" in *grade,
subject, idea, object*, and the "prototype loop error" she hit during the
walkthrough.
