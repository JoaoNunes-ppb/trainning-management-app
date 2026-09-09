#!/usr/bin/env bash
set -euo pipefail

ADMIN_CIDR="${ADMIN_CIDR:-}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
APP_DIR="${APP_DIR:-/home/${DEPLOY_USER}/trainning-management-app}"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

[[ "$(id -u)" -eq 0 ]] || fail "Run this script with sudo"
[[ "$ADMIN_CIDR" =~ ^[0-9a-fA-F:.]+/[0-9]+$ ]] ||
  fail "Set ADMIN_CIDR to the administrator IP range, for example 203.0.113.5/32"
id "$DEPLOY_USER" >/dev/null 2>&1 || fail "User does not exist: $DEPLOY_USER"

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ca-certificates curl gnupg unattended-upgrades ufw

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg |
  gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
. /etc/os-release
cat >/etc/apt/sources.list.d/docker.list <<EOF
deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable
EOF
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

usermod -aG docker "$DEPLOY_USER"
install -d -m 0750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" \
  "$APP_DIR" "$APP_DIR/deploy/scripts" "$APP_DIR/.deploy"

if ! swapon --show=NAME --noheadings | grep -qx /swapfile; then
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab ||
    echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

ufw default deny incoming
ufw default allow outgoing
ufw allow from "$ADMIN_CIDR" to any port 22 proto tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

systemctl enable --now docker
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "Host bootstrap complete. Log out and back in before using Docker as ${DEPLOY_USER}."
