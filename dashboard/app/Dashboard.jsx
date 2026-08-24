"use client";

import { useEffect, useMemo, useState } from "react";

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Fallback for older browsers / insecure contexts.
      const ta = document.createElement("textarea");
      ta.value = text || "";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  }
  return (
    <button className={"btn" + (copied ? " copied" : "")} onClick={onCopy} type="button">
      {copied ? "✓ Copied" : label}
    </button>
  );
}

export default function Dashboard() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/days");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        if (alive) setDays(data.days || []);
      } catch (e) {
        if (alive) setError(String(e.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const sorted = useMemo(() => {
    // Unposted first (asc by srNo), then posted (asc by srNo).
    return [...days].sort((a, b) => {
      if (!!a.posted !== !!b.posted) return a.posted ? 1 : -1;
      return (a.srNo ?? 0) - (b.srNo ?? 0);
    });
  }, [days]);

  async function togglePosted(srNo, posted) {
    setBusy((b) => ({ ...b, [srNo]: true }));
    // optimistic
    setDays((ds) => ds.map((d) => (d.srNo === srNo ? { ...d, posted } : d)));
    try {
      const res = await fetch(`/api/days/${srNo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posted }),
      });
      if (!res.ok) throw new Error("update failed");
    } catch (e) {
      // revert on failure
      setDays((ds) => ds.map((d) => (d.srNo === srNo ? { ...d, posted: !posted } : d)));
      alert("Could not update posting status. Please retry.");
    } finally {
      setBusy((b) => ({ ...b, [srNo]: false }));
    }
  }

  const total = days.length;
  const postedCount = days.filter((d) => d.posted).length;

  return (
    <div className="wrap">
      <div className="header">
        <div>
          <h1>Content Dashboard</h1>
          <div className="sub">Daily LinkedIn / X posts, HLD images, and posting status.</div>
        </div>
        {!loading && !error && (
          <div className="sub">{total} days · {postedCount} posted · {total - postedCount} pending</div>
        )}
      </div>

      {loading && <div className="state">Loading…</div>}
      {error && <div className="err">Error: {error}</div>}

      {!loading && !error && (
        <>
          <div className="colhead">
            <div>Sr</div>
            <div>Title</div>
            <div>LinkedIn Post</div>
            <div>X Post</div>
            <div>Image</div>
            <div>Posted</div>
          </div>

          <div className="rows">
            {sorted.map((d) => (
              <div className={"row" + (d.posted ? " posted" : "")} key={d.srNo}>
                {/* Sr */}
                <div className="cell">
                  <div className="srrow">
                    <div>
                      <div className="srno">{d.srNo}</div>
                      <div className="date">{d.date}</div>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="cell">
                  <div className="label">Title</div>
                  <div className="title-text">{d.title}</div>
                  {d.mainQuestion && <div className="title-sub">{d.mainQuestion}</div>}
                  <div className="actions">
                    <CopyButton text={d.title} label="Copy title" />
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="cell">
                  <div className="label">LinkedIn Post</div>
                  <div className="post">{d.linkedinPost || "—"}</div>
                  <div className="actions">
                    <CopyButton text={d.linkedinPost} label="Copy" />
                  </div>
                </div>

                {/* X */}
                <div className="cell">
                  <div className="label">X Post</div>
                  <div className="post">{d.xPost || "—"}</div>
                  <div className="actions">
                    <CopyButton text={d.xPost} label="Copy" />
                  </div>
                </div>

                {/* Image */}
                <div className="cell">
                  <div className="label">Image</div>
                  {d.hasImage ? (
                    <>
                      <a
                        className="thumb"
                        href={`/api/days/${d.srNo}/image`}
                        target="_blank"
                        rel="noreferrer"
                        title="Open full image"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/days/${d.srNo}/image`} alt={`Day ${d.srNo} HLD`} />
                      </a>
                      <div className="actions">
                        <a className="btn" href={`/api/days/${d.srNo}/image?download=1`}>
                          ↓ Download
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="noimg">No image</div>
                  )}
                </div>

                {/* Posted */}
                <div className="cell">
                  <div className="label">Posted</div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={!!d.posted}
                      disabled={!!busy[d.srNo]}
                      onChange={(e) => togglePosted(d.srNo, e.target.checked)}
                    />
                    <span>{d.posted ? "Posted" : "Mark posted"}</span>
                  </label>
                  {d.posted && <div className="badge">Posted</div>}
                </div>
              </div>
            ))}
          </div>

          {sorted.length === 0 && (
            <div className="state">No content yet. Run <code>npm run seed</code> to load your days.</div>
          )}
        </>
      )}
    </div>
  );
}
