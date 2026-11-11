---
name: wiki
description: Update the SuomiSF GitHub wiki (Finnish user and admin guides, ../suomisf-ui.wiki) after a change to UI or logic it describes, or add a section for a new user-visible feature. Use whenever a task changes labels, buttons, dialogs, workflows, search/filter results, limits or permissions, when the user asks to update the wiki, ohje or ylläpito guide, or to retake wiki screenshots.
---

# Updating the SuomiSF wiki

The wiki is a separate git repo at `/home/mep/src/suomisf-ui.wiki`
(GitHub wiki of suomisf-ui). Keeping it current is part of every UI or logic
change, not a follow-up: CLAUDE.md requires it, and commits and pushes need no
confirmation.

## Where things go

| File | Audience | Contents |
|---|---|---|
| `SuomiSF‐ohje.md` | everyone | Käyttöohje: browsing, search, works, short stories, magazines, indexes, account, own bookshelf |
| `Ylläpito.md` | admins | Adding, editing and deleting records, admin tools page, imports, covers, prices |
| `Asiasanat.md` | admins | Tags: Kirjasampo import, merging, similar tags |
| `Home.md` | everyone | Front page, links to the guides |
| `../suomisf-ui/docs/ADMIN_GUIDE.md` | server admin | Server-side tasks (not the wiki) |

- The file names contain U+2010 `‐`, not an ASCII hyphen: `SuomiSF‐ohje.md`.
  Copy the name from `ls`, don't type it.
- Something visible to everyone but with admin-only parts: describe the
  shared part in the ohje, the admin parts in Ylläpito, and add a short pointer
  between them.
- Print the heading outline (`grep -n '^#' <file>`) before adding a section
  and put it where a reader would look for it, next to related features.

## 1. Find what the change affects

From the diff, collect the Finnish UI strings that changed or were added
(button labels, tab names, dialog titles, toast texts, aria-labels), then:

```bash
cd /home/mep/src/suomisf-ui.wiki
grep -n -i -e 'Muutoshistoria' -e 'Avaa muutoshistoria' *.md   # your labels here
grep -n 'images/' *.md | grep -i <feature>                       # its screenshots
```

Also search for the *old* wording if a label was renamed, and for behaviour the
change alters even when no label changed (limits, who can see a button, what a
search returns). Read each hit's whole section.

## 2. Write

- Finnish, in the same plain, matter-of-fact tone as the existing text. Speak
  to the reader directly ("Avaa...", "Valitse...").
- Use UI labels exactly as the app shows them, in bold: **Tallenna**,
  tab and field names as in the UI. Routes in backticks: `/admin`.
- Steps for doing things, short paragraphs for explaining things. Say who can
  do it if it is not everyone (logged in, admin).
- Cross-links: within a page `[Otsikko](#otsikko-pienillä-kirjaimilla)`
  (lowercase, spaces → `-`, ä/ö kept); to another page `[Asiasanat](Asiasanat)`.
- Images: `![Kuvaus kuvasta suomeksi](images/ohje/nimi.png)`, on their own
  line after the paragraph they illustrate.
- Remove text that is no longer true; don't leave "ennen..." notes about old
  behaviour.

## 3. Screenshots

Folders: `images/ohje/` (user guide), `images/yllapito/` (admin guide).
Names are lowercase Finnish without ä/ö (`kansikuvan-valikko.png`).
Retake every screenshot whose content the change altered; add one for a new
dialog or page.

**Never show real people's private data.** Editors' usernames (change
history, "last edited by") must not appear: create a temporary record as Test
Admin through the API, screenshot it, delete it afterwards. Public catalogue
data (books, authors) is fine.

### Start the E2E stack (test DB, ports 5001/3100)

Use the Bash tool's `run_in_background` for each server (nohup inside a
subshell dies):

```bash
cd /home/mep/src/suomisf && SUOMISF_DOTENV=.env.e2e .venv/bin/gunicorn wsgi:app --bind 127.0.0.1:5001 --workers 2 --pid /tmp/gunicorn-e2e.pid
cd /home/mep/src/suomisf-ui && npx vite --mode e2e --port 3100
```

Wait for both:

```bash
curl -s -o /dev/null --retry 40 --retry-connrefused --retry-delay 1 http://127.0.0.1:5001/api/frontpagedata
curl -s -o /dev/null --retry 40 --retry-connrefused --retry-delay 1 http://localhost:3100/
```

If logging in as Test Admin fails (pytest re-clones `suomisf_test` without the
test users), re-seed:
`cd /home/mep/src/suomisf && SUOMISF_DOTENV=.env.e2e pdm run python tests/scripts/setup_e2e_db.py`.

Stop afterwards:
`kill $(cat /tmp/gunicorn-e2e.pid); pkill -f "[v]ite --mode e2e --port 3100"`.

### Take them

Copy `scripts/screenshot-template.mjs` from this skill to the scratchpad,
fill in the steps and run it with `node`. It logs in as Test Admin (or runs
logged out), hides the React Query devtools, uses a 1280 px light-mode
viewport, and has helpers for creating and deleting a temporary work.

- Screenshot the relevant element (`locator.screenshot`) or a `clip`, not the
  whole page, unless the page itself is the subject.
- Show what the text describes: open the menu, fill the field, wait for data
  (`waitForLoadState('networkidle')` plus the element) before shooting.
- User-guide shots that show what everyone sees are taken logged out.
- Look at every image with the Read tool before committing.

## 4. Commit and push

```bash
cd /home/mep/src/suomisf-ui.wiki
git add -A && git commit -m "<Osio>: <mitä muuttui>" && git push
```

Commit messages are Finnish, e.g. `Ylläpito: kansikuvien lataus puhelimesta ja
500 px koko`. One commit per feature. No need to ask before pushing.

## 5. Report

In the final summary, name the wiki sections and screenshots updated, with
the commit hash, or say that the change needed no wiki update and why.
