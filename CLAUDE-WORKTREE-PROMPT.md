Use only this worktree for this stream:
`/Users/mksulty/Claude/Projects/Emsist-app/.worktrees/tenant-factsheet-spec`

Do not use `main` at:
`/Users/mksulty/Claude/Projects/Emsist-app`

Rules:
- Read, edit, test, generate screenshots, and create artifacts only inside `tenant-factsheet-spec`.
- Do not create, modify, stage, or commit files in `main`.
- Keep `main` clean at all times.
- If you discover relevant changes in `main`, stop and move them into `tenant-factsheet-spec` before continuing.
- Use `tenant-factsheet-spec` for any route work, `_parking` work, Playwright scratch specs, design notes, or temporary assets related to this stream.
- Before committing, run `git status --short` in both worktrees and confirm `main` is empty.

Execution check:
- `git -C /Users/mksulty/Claude/Projects/Emsist-app status --short`
- `git -C /Users/mksulty/Claude/Projects/Emsist-app/.worktrees/tenant-factsheet-spec status --short`

If there is any conflict between convenience and worktree isolation, choose isolation and do not touch `main`.
