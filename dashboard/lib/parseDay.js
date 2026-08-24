// Parses a Day_{N}.md file (the format produced by the master-prompt pipeline)
// into a structured object. Shared by the seed script and the DB-upload API so
// there is exactly one source of truth for the format.

function stripFence(text) {
  if (!text) return "";
  let t = text.trim();
  // Remove a leading ```lang line and a trailing ``` line if present.
  t = t.replace(/^```[^\n]*\n?/, "");
  t = t.replace(/\n?```\s*$/, "");
  return t.trim();
}

// Grab everything under a "## <heading>" until the next "## " or a "---" divider.
function sectionBody(md, headingRegex) {
  const lines = md.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (headingRegex.test(lines[i])) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return "";
  const out = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s/.test(line)) break;
    if (/^---\s*$/.test(line)) break;
    out.push(line);
  }
  return out.join("\n").trim();
}

export function parseDayMarkdown(md) {
  const titleLine = (md.split(/\r?\n/).find((l) => /^#\s/.test(l)) || "").replace(/^#\s*/, "");
  // "Day 7 — 22 Aug 2026 — Amazon: How does ..." (em dash separated)
  const parts = titleLine.split(/\s+—\s+/);
  const dayToken = parts[0] || "";
  const srMatch = dayToken.match(/(\d+)/);
  const srNo = srMatch ? parseInt(srMatch[1], 10) : null;
  const date = (parts[1] || "").trim();
  const title = (parts.slice(2).join(" — ") || "").trim();

  const mainQuestion = (md.match(/\*\*main question:\*\*\s*(.+)/i)?.[1] || "").trim();
  const hldFocus = (md.match(/\*\*hld\/excalidraw focus[^:]*:\*\*\s*(.+)/i)?.[1] || "").trim();

  const concept = sectionBody(md, /^##\s*1\.\s*concept explanation/i);
  const geminiPrompt = stripFence(sectionBody(md, /^##\s*2\.\s*gemini prompt/i));
  const linkedinPost = stripFence(sectionBody(md, /^##\s*3\.\s*linkedin post/i));
  const xPost = stripFence(sectionBody(md, /^##\s*4\.\s*(twitter|x)/i));

  return {
    srNo,
    date,
    title,
    mainQuestion,
    hldFocus,
    concept,
    geminiPrompt,
    linkedinPost,
    xPost,
  };
}
