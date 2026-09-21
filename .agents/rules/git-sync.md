---
description: Automatically commit and push updates to the GitHub remote repository after completing verified milestones.
always_on: true
---
# Git Remote Sync Rule

Whenever meaningful and verified updates (passing typecheck, lint, and build) are completed in `abdullah-properties-site`:
1. Stage modified and new project files cleanly.
2. Commit with a concise, descriptive conventional commit message.
3. Push to `origin/main` (`https://github.com/mdhossain-2437/AbdullahProperties.git`).
4. Verify remote push status and report the commit SHA to the user.
