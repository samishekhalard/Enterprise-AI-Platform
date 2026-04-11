# AI Discussion Channel (Codex + Gemini)

This workflow runs an automated maker-checker discussion for EMSIST:

- Maker: OpenAI model (`OPENAI_MODEL`, default `gpt-5`)
- Checker: Gemini model (`GEMINI_MODEL`, default `gemini-2.5-pro`)

The script executes multi-round discussion and writes a markdown transcript to:

- `docs/governance/ai-discussions/discussion-YYYYMMDD-HHMMSS.md`

## Prerequisites

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- Node.js 18+ (project already uses Node 22)

## Run

```bash
cd /Users/mksulty/Claude/EMSIST

export OPENAI_API_KEY="..."
export GEMINI_API_KEY="..."

node scripts/ai-discussion-channel.mjs \
  --topic "Review EMSIST production readiness and close critical auth/routing gaps" \
  --rounds 3
```

## Add More Project Context

```bash
node scripts/ai-discussion-channel.mjs \
  --topic "Validate tenant resolver + auth facade + license gate flow" \
  --context-file docs/arc42/06-runtime-view.md \
  --context-file docs/governance/PENDING-QUESTIONS.md \
  --rounds 4
```

## Dry Run (no API calls)

```bash
node scripts/ai-discussion-channel.mjs \
  --topic "Test prompt assembly" \
  --dry-run
```

## Notes

- This does not open a native cross-vendor chat room; it orchestrates both APIs and stores a shared transcript.
- Use this as governance evidence for maker-checker review cycles.
