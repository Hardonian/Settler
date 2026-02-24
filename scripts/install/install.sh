#!/usr/bin/env bash
set -euo pipefail

REPO="settler/settler"
VERSION="${SETTLER_VERSION:-latest}"
INSTALL_DIR="${SETTLER_INSTALL_DIR:-$HOME/.local/bin}"

fail() {
  echo "[settler-install] $1" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"
}

need_cmd curl
need_cmd sha256sum
need_cmd tar
need_cmd node

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64) ARCH="x64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *) fail "unsupported architecture: $ARCH" ;;
esac

case "$OS" in
  linux|darwin) ;;
  *) fail "unsupported operating system: $OS" ;;
esac

TAG="$VERSION"
if [[ "$VERSION" == "latest" ]]; then
  TAG="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -n1)"
  [[ -n "$TAG" ]] || fail "failed to resolve latest release tag"
fi

ASSET="settler-${TAG#v}-${OS}-${ARCH}.tar.gz"
CHECKSUM="${ASSET}.sha256"
BASE_URL="https://github.com/$REPO/releases/download/$TAG"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

curl -fsSL "$BASE_URL/$ASSET" -o "$TMP_DIR/$ASSET" || fail "failed to download $ASSET"
curl -fsSL "$BASE_URL/$CHECKSUM" -o "$TMP_DIR/$CHECKSUM" || fail "failed to download $CHECKSUM"

(
  cd "$TMP_DIR"
  sha256sum -c "$CHECKSUM" || fail "checksum verification failed"
)

mkdir -p "$INSTALL_DIR"
tar -xzf "$TMP_DIR/$ASSET" -C "$TMP_DIR"
install -m 0755 "$TMP_DIR/settler" "$INSTALL_DIR/settler"

echo "installed settler to $INSTALL_DIR/settler"
echo "if needed, add to PATH: export PATH=\"$INSTALL_DIR:\$PATH\""
"$INSTALL_DIR/settler" version || fail "installed CLI did not execute"
