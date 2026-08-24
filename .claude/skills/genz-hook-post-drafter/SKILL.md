---
name: genz-hook-post-drafter
description: Drafts a LinkedIn post (Pro account) and an X/Twitter post from the hook in a content calendar row, written in Taral's genz, lowercase, no-em-dash voice. Use whenever a full day's row from the "How Does X Work" content calendar is provided, or when asked to draft social posts from a given hook or topic. Always produces both platforms in one go, never one without the other. Triggers on "draft the posts for day X", "write linkedin and twitter for this hook", "turn this into a post", or whenever a calendar row (topic + main question) is pasted. This skill runs alongside hld-concept-explainer whenever a full row is given — both outputs are produced in the same response.
---

# Genz Hook Post Drafter

Turns one calendar row's hook (the "Product: How does X work?" question) into a LinkedIn post and a single X post, always both together, always in Taral's specific voice. Never assume a length, hook angle, or CTA the user hasn't given — if the row is missing the actual hook/question, ask before drafting instead of inventing one.

## Voice rules (non-negotiable, apply to both platforms)

- **never use an em dash.** not "--", not "—", not as a pause, not as a separator. use a period, a comma, or just cut the clause.
- **lowercase on purpose.** don't capitalize the start of sentences by default. proper nouns can stay capitalized if it looks weirder not to (e.g. product names), but the overall post should read lowercase-first.
- **incorrect punctuation on purpose.** drop a comma here and there where it'd technically belong. skip the period on the last line. this is a deliberate signal of a real person typing fast, not sloppiness — don't overdo it to the point it's hard to read.
- **genz tone, not costume genz.** short punchy sentences. no forced slang for its own sake. internet-native rhythm (fragments, one-line paragraphs) over corporate LinkedIn-influencer cadence.
- **no AI slop.** banned regardless of platform: "let's dive in", "here's the thing", "game changer", "in today's fast-paced world", "buckle up", "mind blown", "🤯" as a crutch, any 3-adjective opener, any sentence that reads like it was generated to sound relatable.
- the vibe test: read it out loud. if it sounds like a LinkedIn creator template, rewrite it.

## Platform specs

### LinkedIn (Pro account)
- length: **150-300 words**, short and punchy — not a long-form essay even though the account allows it.
- structure: one-line hook up top (pulled straight from the calendar's topic/question, rewritten in voice, not copy-pasted verbatim), then 3-5 short paragraphs or line-broken thoughts walking through the concept in plain terms, ending on a line that points to the HLD attached/posted alongside this post (the diagram goes out with the post, not "coming soon" or "dropping soon"), without it reading like an ad.
- no hashtags unless the user asks for them.
- line breaks over walls of text. genz LinkedIn reads like texting, not like a memo.

### X / Twitter
- **single tweet only, ~280 characters.** no threads.
- **no emojis at all.**
- the hook itself IS basically the tweet, compressed. one sharp line or two, not a mini-essay.
- if the concept genuinely can't fit in 280 chars without gutting it, cut detail, don't switch to a thread. this format is single-tweet only unless the user explicitly says otherwise for that day.

## Workflow

1. Pull the hook from the row's topic/main-question columns.
2. Draft the X post first (it's the tightest constraint, so it forces the sharpest version of the idea).
3. Draft the LinkedIn post as the expanded version of the same core idea, not a different angle.
4. Run the voice rules checklist below before returning anything.

## Checklist before returning output

- [ ] zero "--" or "—" anywhere in either post
- [ ] both posts read lowercase-first
- [ ] at least one intentionally dropped/skipped punctuation mark per post
- [ ] none of the banned AI-slop phrases appear
- [ ] X post has no emojis and is a single post, not a thread
- [ ] linkedin post is 150-300 words
- [ ] both posts are built from the SAME hook/angle, not two unrelated takes

## Worked example

Input row: Day 2, Uber — "How does a ride request find the right driver?"

**X post:**
```
ubers matching system doesnt blast your ride to every driver nearby

it ranks them, offers it to one at a time, 10-15 sec to accept, then rolls to the next if they dont

feels instant to you. its actually a queue with a very short fuse

hld attached
```

**LinkedIn post:**
```
how does uber find you a driver in like 3 seconds

it doesnt broadcast your ride request to every driver near you. that would be chaos, multiple drivers accepting the same ride, arguments, mess

instead theres a ranking step. your location hits a geospatial index thats constantly being updated by every driver streaming their live position. that index returns a shortlist. the shortlist gets ranked by distance, eta, rating

then the offer goes out to ONE driver at a time. they get a short window to accept, something like 10-15 seconds. if they dont, it rolls to the next ranked driver automatically

what looks instant to you as a rider is actually a sequential offer queue with a fast timeout built in. the "instant match" feeling is the product hiding the retry logic from you

mapped the whole flow out as a proper hld, attached below
```

That's the pattern: X gets the compressed punchline, LinkedIn gets the same idea walked through a beat slower, both in the same lowercase no-em-dash voice.
