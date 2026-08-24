
Run my full daily content pipeline in one shot on the row I'm about to paste. Three skills chain
together: `hld-concept-explainer`, `genz-hook-post-drafter`, and `excalidraw-hld`. Run all three —
never one without the others.

> One-command shortcut: instead of this file, just type `/day` followed by the pasted row.
> This file is the same pipeline written out longhand.

Do this, in order:

1. Run `hld-concept-explainer` on the row → concept explanation + filled-in gemini prompt.
2. Run `genz-hook-post-drafter` on the same row → the LinkedIn post and the X post.
3. If either skill would normally ask a clarifying question because the row is ambiguous or
   incomplete, ask it now before doing anything else — don't guess, don't use placeholders.
4. Create the folder `days/Day_{N}/` if it doesn't exist.
5. Combine outputs into `days/Day_{N}/Day_{N}.md` using the exact template below. Pull `{N}`,
   `{date}`, `{topic}`, `{main_question}`, and `{hld_focus}` straight from the pasted row.
6. Run `excalidraw-hld` with `days/Day_{N}/Day_{N}.md` as its input — it must READ that file's
   "gemini prompt" five-group breakdown and "hld/excalidraw focus" line and reuse them verbatim.
   Save the diagram to `days/Day_{N}/Day_{N}.excalidraw`.
7. Render `days/Day_{N}/Day_{N}.excalidraw` to a PNG snapshot at `days/Day_{N}/Day_{N}.png`,
   through Excalidraw itself so it matches the established hand-drawn / dark-canvas house style
   (do NOT re-draw it with Pillow/SVG — that won't match). This is fully automated — just run
   the bundled renderer, one command, no browser dance to re-derive and no scratch files to
   clean up:

   ```bash
   node "D:/Linkedin_Content/.claude/skills/excalidraw-hld/render.js" \
        "D:/Linkedin_Content/days/Day_{N}/Day_{N}.excalidraw"
   ```

   It writes `Day_{N}.png` next to the `.excalidraw` and prints
   `RESULT: WROTE ... validPNG=true dims=WxH`. A correct run is a true 3× image on a near-black
   canvas (a ~1600px-wide scene → ~4800px-wide PNG). After it finishes, open the PNG to visually
   confirm it rendered (dark background, near-white strokes, nothing clipped). If it ever fails,
   the full methodology and the reasons behind each step (drive Chromium via `playwright-core`
   from Node; seed the scene straight into `localStorage` because excalidraw.com's CSP blocks
   in-page `fetch`; seed `exportScale:3` + dark mode; capture the PNG via a `toBlob` patch) live
   in `.claude/skills/excalidraw-hld/SKILL.md` under "Rendering to PNG" — fix `render.js`'s path
   discovery there rather than hand-writing a new browser script.
8. Upload the finished day to the dashboard database so the website updates automatically.
   This reads `days/Day_{N}/Day_{N}.md` and its rendered `Day_{N}.png`, parses the sections,
   and upserts them into MongoDB (collection `days`, keyed by sr no `{N}`). Run, one command:

   ```bash
   node "D:/Linkedin_Content/dashboard/scripts/upload-day.mjs" {N}
   ```

   It prints `Uploaded Day {N} — {title}` on success. The dashboard reads live from the same
   database, so the new row shows up the next time the site is loaded — no redeploy needed.
   (An already-`posted` day keeps its posted flag; re-running just refreshes its content/image.)
9. Don't summarize or repeat the content back to me in chat. Just confirm the four steps are
   done (`Day_{N}.md`, `Day_{N}.excalidraw`, `Day_{N}.png` written, and the day uploaded to the
   database), show me all three file paths, and list the excalidraw components drawn.

Template for `days/Day_{N}/Day_{N}.md` (fill every section, no placeholder text left in the file):

```markdown
# Day {N} — {date} — {topic}

**main question:** {main_question}

**hld/excalidraw focus (from calendar):** {hld_focus}

---

## 1. concept explanation

{the plain-language explanation from hld-concept-explainer, unedited}

---

## 2. gemini prompt

{{fence}}
{the copy-paste-ready gemini prompt from hld-concept-explainer, unedited}
{{fence}}

---

## 3. linkedin post

{{fence}}
{the linkedin post from genz-hook-post-drafter, unedited}
{{fence}}

---

## 4. twitter / x post

{{fence}}
{the x post from genz-hook-post-drafter, unedited}
{{fence}}
```

(`{{fence}}` = a normal triple-backtick code fence in the actual file.)

Now here's the row for the day:

| 8 | 23 Aug 2026 | **Flipkart/Myntra: How does an e-commerce return work?** | How does a return request trigger eligibility checks, reverse logistics, inspection, refund, and inventory changes? | Order history, return policy engine, pickup scheduler, warehouse inspection, refund service, inventory update, and notifications. |

