# MOVES

A mobile app for discovering and saving places you love.

## Repository structure

| Branch | Purpose |
|--------|---------|
| `main` | Stable, production-ready code. All merges land here. |
| `replit-agent` | Agent workspace branch used for automated task work. Merges into `main` via PR. |
| Feature branches | Short-lived branches for individual features or fixes. Open a PR against `main` when ready. |

## Project layout

```
artifacts/
  moves/          # Expo React Native mobile app
  api-server/     # Express API server
  mockup-sandbox/ # Component preview / design sandbox
```

## Getting started

**Prerequisites:** Node.js 20+, pnpm 9+

```bash
# Install dependencies
pnpm install

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the mobile app (Expo)
pnpm --filter @workspace/moves run dev
```

## Pushing changes to GitHub

From the **Replit Git panel** — commit your changes and click **Push**.

From the **terminal** — one command syncs the current branch:

```bash
git push origin main
```

If you are on a feature branch and want to open a pull request:

```bash
# Push the feature branch
git push origin your-feature-branch

# Then open a PR on GitHub targeting main
```

## Contributing

1. Create a feature branch off `main`.
2. Make your changes and commit with a clear message.
3. Push the branch and open a pull request against `main`.
4. Request a review and address any feedback.
5. Merge once approved.

Keep commits focused — one logical change per commit makes history easier to read and revert if needed.
