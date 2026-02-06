#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/release-tag.sh [version] [--skip-check] [--no-push-branch] [--remote <name>]

Examples:
  scripts/release-tag.sh
  scripts/release-tag.sh 0.1.1
  scripts/release-tag.sh 0.1.1 --skip-check

Notes:
  - Default version comes from packages/cli/package.json.
  - Creates annotated tag: v<version>.
  - By default pushes current branch and tag to origin.
EOF
}

VERSION=""
SKIP_CHECK=0
PUSH_BRANCH=1
REMOTE="origin"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --skip-check)
      SKIP_CHECK=1
      shift
      ;;
    --no-push-branch)
      PUSH_BRANCH=0
      shift
      ;;
    --remote)
      REMOTE="${2:-}"
      if [[ -z "$REMOTE" ]]; then
        echo "Missing value for --remote" >&2
        exit 1
      fi
      shift 2
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
    *)
      if [[ -n "$VERSION" ]]; then
        echo "Version specified more than once." >&2
        exit 1
      fi
      VERSION="$1"
      shift
      ;;
  esac
done

if [[ -z "$VERSION" ]]; then
  VERSION="$(node -p "require('./packages/cli/package.json').version")"
fi

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]]; then
  echo "Invalid version: $VERSION" >&2
  exit 1
fi

TAG="v$VERSION"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash changes first." >&2
  exit 1
fi

if ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
  echo "Git remote '$REMOTE' not found." >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" == "HEAD" ]]; then
  echo "Detached HEAD is not supported for release tagging." >&2
  exit 1
fi

if [[ "$SKIP_CHECK" -eq 0 ]]; then
  echo "Running release checks..."
  pnpm run release:check
fi

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag '$TAG' already exists locally." >&2
  exit 1
fi

if git ls-remote --tags "$REMOTE" "refs/tags/$TAG" | grep -q "$TAG"; then
  echo "Tag '$TAG' already exists on remote '$REMOTE'." >&2
  exit 1
fi

echo "Creating annotated tag $TAG..."
git tag -a "$TAG" -m "release: $TAG"

if [[ "$PUSH_BRANCH" -eq 1 ]]; then
  echo "Pushing branch $BRANCH to $REMOTE..."
  git push "$REMOTE" "$BRANCH"
fi

echo "Pushing tag $TAG to $REMOTE..."
git push "$REMOTE" "$TAG"

echo "Done. Triggered publish workflow with tag $TAG."
