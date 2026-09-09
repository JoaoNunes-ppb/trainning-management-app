#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT="$ROOT/.docker/npm-ca.pem"
mkdir -p "$(dirname "$OUTPUT")"

case "$(uname -s)" in
  Darwin)
    security find-certificate -a -p /Library/Keychains/System.keychain >"$OUTPUT"
    security find-certificate -a -p "$HOME/Library/Keychains/login.keychain-db" >>"$OUTPUT" 2>/dev/null || true
    ;;
  Linux)
    if [[ -f /etc/ssl/certs/ca-certificates.crt ]]; then
      cp /etc/ssl/certs/ca-certificates.crt "$OUTPUT"
    elif [[ -f /etc/pki/tls/certs/ca-bundle.crt ]]; then
      cp /etc/pki/tls/certs/ca-bundle.crt "$OUTPUT"
    else
      echo "Could not find the host CA bundle." >&2
      exit 1
    fi
    ;;
  *)
    echo "Unsupported operating system. Configure Docker's CA trust manually." >&2
    exit 1
    ;;
esac

chmod 600 "$OUTPUT"
grep -q 'BEGIN CERTIFICATE' "$OUTPUT" || {
  echo "No certificates were exported." >&2
  exit 1
}
echo "Docker npm CA bundle written to $OUTPUT"
