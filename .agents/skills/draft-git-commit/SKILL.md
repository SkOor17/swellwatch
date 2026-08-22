---
name: draft-git-commit
description: >-
  Use this skill to format a Git commit message for the user in plain text so they can easily copy and paste it into their git client. Do not use bash syntax.
---

# Draft Git Commit Message

When you are ready to propose a commit to the user, you must present the commit message as a plain text block.

Do NOT output bash commands such as `git commit -m "..."`.

Format the output strictly as the message itself, following the Conventional Commits specification. Provide the message in a markdown code block so it's easy to copy.

## Example Output Format:

```text
feat(api): add static spots endpoint

- Implemented GET /api/v1/spots
- Added static data for Hossegor, Biarritz, Lacanau
- Wrote unit tests for the handler
```

## Steps

1. Review the changes made in the workspace.
2. Determine the correct conventional commit type (`feat`, `fix`, `chore`, etc.) and scope.
3. Write a concise subject line.
4. If necessary, write a body with bullet points detailing the changes.
5. Output the result using the format above.
