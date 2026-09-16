# Contributing

1. Use Node.js 22.13+ and pnpm 11.
2. Run `pnpm install` and `pnpm exec playwright install chromium`.
3. Create focused changes with tests for behavior and security boundaries.
4. Run `pnpm check` before opening a pull request.

Never commit `.env` files, `.arena-data`, screenshots, API keys, or traces captured from private systems. Changes to URL validation, browser routing, task completion, verdicts, or redaction require regression tests.
