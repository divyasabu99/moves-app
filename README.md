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

> **Note:** The `main` branch is protected via GitHub branch protection rules. Direct pushes are blocked at the repository level — all changes must go through a pull request with at least one approving review. Force-pushes and branch deletions are also disabled.

From the **Replit Git panel** — commit your changes on a feature branch and click **Push**, then open a PR on GitHub.

From the **terminal**:

```bash
# Create and switch to a feature branch
git checkout -b your-feature-branch

# Make your changes, then commit
git add .
git commit -m "describe your change"

# Push the feature branch
git push origin your-feature-branch

# Then open a PR on GitHub targeting main
```

## Contributing

1. Create a feature branch off `main` — never commit directly to `main`.
2. Make your changes and commit with a clear message.
3. Push the branch and open a pull request against `main`.
4. Request a review and address any feedback.
5. Merge once the PR is approved and all checks pass.

Keep commits focused — one logical change per commit makes history easier to read and revert if needed.
