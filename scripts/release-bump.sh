#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/release-bump.sh <patch|minor|major> [--skip-check] [--remote <name>]

Examples:
  scripts/release-bump.sh patch
  scripts/release-bump.sh minor --remote origin
EOF
}

if [[ $# -ge 1 && ( "$1" == "-h" || "$1" == "--help" ) ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

BUMP_TYPE="$1"
shift

case "$BUMP_TYPE" in
  patch|minor|major)
    ;;
  *)
    echo "Invalid bump type: $BUMP_TYPE" >&2
    usage
    exit 1
    ;;
esac

SKIP_CHECK=0
REMOTE="origin"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-check)
      SKIP_CHECK=1
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
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

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
  echo "Detached HEAD is not supported for release bump." >&2
  exit 1
fi

if [[ "$SKIP_CHECK" -eq 0 ]]; then
  echo "Running release checks..."
  pnpm run release:check
fi

echo "Bumping version ($BUMP_TYPE)..."
(cd packages/cli && npm version "$BUMP_TYPE" --no-git-tag-version >/dev/null)

VERSION="$(node -p "require('./packages/cli/package.json').version")"
TAG="v$VERSION"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag '$TAG' already exists locally." >&2
  exit 1
fi

if git ls-remote --tags "$REMOTE" "refs/tags/$TAG" | grep -q "$TAG"; then
  echo "Tag '$TAG' already exists on remote '$REMOTE'." >&2
  exit 1
fi

git add packages/cli/package.json
if [[ -f packages/cli/package-lock.json ]]; then
  git add packages/cli/package-lock.json
fi

git commit -m "chore(release): $TAG"
git tag -a "$TAG" -m "release: $TAG"

echo "Pushing branch $BRANCH to $REMOTE..."
git push "$REMOTE" "$BRANCH"

echo "Pushing tag $TAG to $REMOTE..."
git push "$REMOTE" "$TAG"

echo "Done. Triggered publish workflow with tag $TAG."
