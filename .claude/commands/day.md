---
description: Run the full daily content pipeline (concept + gemini + posts + excalidraw) from one pasted calendar row
argument-hint: | N | date | topic | main question | hld focus |
---

You are running Taral's full "How Does X Work" daily content pipeline in ONE shot from the
calendar row below. Do every step, in order, and do NOT summarize the content back into chat.

## The row

$ARGUMENTS

If no row was pasted above, ask for it and stop. Otherwise parse these fields straight from
the row (do not ask me to repeat them):
- `{N}`  = day number (first column)
- `{date}` = date column
- `{topic}` = product / post topic column
- `{main_question}` = "main question to explain" column, verbatim
- `{hld_focus}` = "HLD / Excalidraw focus" column, verbatim

## Steps

1. **Run `hld-concept-explainer`** on the row → get the plain-language concept explanation and
   the copy-paste-ready gemini prompt.
2. **Run `genz-hook-post-drafter`** on the same row → get the LinkedIn post and the X/Twitter post.
3. If EITHER skill would normally ask a clarifying question because the row is ambiguous or
   incomplete, ask it now, before writing anything — don't guess, don't use placeholders.
4. **Create the folder** `days/Day_{N}/` if it doesn't exist.
5. **Write** `days/Day_{N}/Day_{N}.md` using the EXACT template below. Fill every section with
   the unedited skill outputs — leave no placeholder text in the final file.
6. **Run `excalidraw-hld`** using the just-written `days/Day_{N}/Day_{N}.md` as its input
   (it must READ the file's "gemini prompt" five-group breakdown and "hld/excalidraw focus"
   line and lift them verbatim). Save the diagram to `days/Day_{N}/Day_{N}.excalidraw`.
7. **Render the PNG** — one command, fully automated through excalidraw.com in the house
   style (do NOT re-draw with Pillow/SVG):

   ```bash
   node "D:/Linkedin_Content/.claude/skills/excalidraw-hld/render.js" \
        "D:/Linkedin_Content/days/Day_{N}/Day_{N}.excalidraw"
   ```

   It writes `Day_{N}.png` next to the `.excalidraw` and prints
   `RESULT: WROTE ... validPNG=true dims=WxH` (a true 3× dark-canvas image). Open the PNG to
   confirm it rendered. The full methodology + rationale lives in
   `.claude/skills/excalidraw-hld/SKILL.md` under "Rendering to PNG".
8. **Confirm only** — print the paths to the `.md`, `.excalidraw`, and `.png` files and a
   one-line bullet list of the excalidraw components drawn. Do NOT paste the posts or concept
   back into chat.

## File template for `days/Day_{N}/Day_{N}.md`

```markdown
# Day {N} — {date} — {topic}

**main question:** {main_question}

**hld/excalidraw focus (from calendar):** {hld_focus}

---

## 1. concept explanation

{the plain-language explanation from hld-concept-explainer, unedited}

---

## 2. gemini prompt

​```
{the copy-paste-ready gemini prompt from hld-concept-explainer, unedited}
​```

---

## 3. linkedin post

​```
{the linkedin post from genz-hook-post-drafter, unedited}
​```

---

## 4. twitter / x post

​```
{the x post from genz-hook-post-drafter, unedited}
​```
```

(Replace the ​``` fences above with normal triple-backtick fences in the actual file.)
