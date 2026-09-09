# AWS Deployment Guide

This is the lower-cost fallback production layout. The recommended easiest path
is now [Railway Deployment Guide](RAILWAY_DEPLOYMENT_GUIDE.md). Use this AWS
Lightsail plan only if minimizing monthly cost is more important than setup
simplicity.

The fallback uses one **1 GB Amazon Lightsail** Ubuntu instance in `eu-west-1`,
a static IP, a domain, Docker Compose, and a private S3 bucket for database
backups.

## Architecture and cost

The host runs four containers from immutable Git commit SHA tags:

- `postgres`: PostgreSQL 16 on a private Docker network and named volume.
- `app`: Spring Boot API, private to the host.
- `web`: Caddy serving the React application and obtaining HTTPS certificates.
- `backup`: daily PostgreSQL dumps uploaded to private S3.

Only TCP 80/443 are public. Allow TCP 22 only from the administrator's current
public IP/CIDR. Caddy also uses UDP 443 for HTTP/3.

AWS's current new-account [Free plan](https://aws.amazon.com/free/) starts with
**$100 in credits** and lasts for up to six months. The official
[Lightsail pricing example](https://aws.amazon.com/lightsail/pricing/) is
**$5/month** for a Linux instance with 1 GB RAM and 40 GB SSD; the small volume
of S3 backup storage and requests should normally cost cents. Check current AWS
pricing before launch. This design does not require RDS, a load balancer, a
separate container registry, or managed DNS.

## 1. Prepare AWS and billing

1. Enable MFA on the AWS root account and use an administrative IAM identity
   for setup.
2. In AWS Billing, create a monthly AWS Budget and email alerts before credits
   expire or usage exceeds the expected amount.
3. Create a Lightsail Ubuntu instance in `eu-west-1`, using the 1 GB/40 GB
   plan, and attach a static IP.
4. In the Lightsail firewall allow HTTP 80 and HTTPS 443 publicly. Restrict SSH
   22 to the administrator's public IP, for example `203.0.113.5/32`. See
   [Lightsail firewall rules](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-editing-firewall-rules.html).

The application also configures UFW on the host. Keep both Lightsail and UFW
rules restrictive.

## 2. Configure DNS

At the existing DNS provider, create an `A` record for the chosen hostname
(for example `app.example.com`) pointing to the Lightsail static IP. No AWS DNS
service is required. Wait until:

```bash
dig +short app.example.com
```

returns the static IP. Ports 80 and 443 must reach the instance before Caddy can
obtain its certificate.

## 3. Bootstrap the host

Copy `deploy/aws/bootstrap-host.sh` to the server, then run:

```bash
sudo ADMIN_CIDR=203.0.113.5/32 \
  DEPLOY_USER=ubuntu \
  bash bootstrap-host.sh
```

This installs Docker Engine and Compose, enables security updates, creates a
1 GB swap file, enables Docker, and configures UFW. Log out and back in so the
`ubuntu` user receives Docker group membership.

## 4. Create private S3 backups

Install and authenticate AWS CLI on a trusted administration machine. Choose a
globally unique bucket name and run:

```bash
AWS_REGION=eu-west-1 \
S3_BUCKET=example-athlete-manager-backups \
bash deploy/aws/setup-s3.sh
```

The script enables S3 Block Public Access, SSE-S3 (`AES256`) encryption, a
30-day lifecycle under `backups/athlete-manager/`, and a least-privilege IAM
user limited to that prefix. Create its single access key as instructed. Put
the key only in the server's `.env.production`; do not put it in GitHub
secrets, shell history, documentation, or the repository.

## 5. Configure production

On the server:

```bash
cd ~/trainning-management-app
cp .env.production.example .env.production
chmod 600 .env.production
```

Copy the example from the repository if it is not yet on the server. Set:

- `DOMAIN` to the DNS hostname, without scheme or path.
- `IMAGE_TAG` to an existing successful `main` commit SHA.
- strong, distinct database, admin, and JWT secrets.
- `CORS_ALLOWED_ORIGINS=https://<DOMAIN>`.
- the S3 region, bucket, prefix, and least-privilege access key.

Validate every production command with the explicit environment and Compose
file:

```bash
deploy/scripts/validate-env.sh
docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet
```

## 6. Configure GitHub

Make the three GHCR packages ending in `-app`, `-web`, and `-backup`
[public](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility).
The server can then pull images without a long-lived package credential.

Create a GitHub
[`production` environment](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
and these environment secrets:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | Lightsail static IP or hostname |
| `DEPLOY_USER` | Usually `ubuntu` |
| `DEPLOY_SSH_KEY` | Private key whose public key is authorized on the host |

Restrict the private key file and never store `.env.production` in GitHub.
CI tests every pull request and `main` push. After successful CI on `main`, the
deploy workflow builds SHA-tagged GHCR images, copies deployment files over
SSH, runs a pre-deploy backup when a stack exists, deploys, health-checks HTTPS,
and rolls back automatically on failure.

## 7. First deployment

The first deployment differs because no running stack exists:

1. Merge or push the production files to `main`.
2. Wait for CI and image publishing to complete; make the GHCR packages public.
3. Bootstrap the host and create `.env.production`.
4. Either rerun the successful deploy workflow or copy
   `docker-compose.prod.yml` and `deploy/scripts/*.sh` to the application
   directory.
5. On the host, set `IMAGE_TAG` to the published commit SHA and run:

```bash
cd ~/trainning-management-app
deploy/scripts/validate-env.sh
docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
deploy/scripts/health-check.sh
```

Open `https://<DOMAIN>`, sign in, and immediately replace any temporary admin
password.

## Monthly checks

- Review AWS charges, remaining credits, budget alerts, and Lightsail metrics.
- Install pending host updates and confirm unattended upgrades are healthy.
- Check container health, disk, swap, memory, and bounded Docker logs.
- Confirm a recent successful backup exists in S3 and no backup failure is
  reported.
- Perform a restore drill into a disposable environment and record the result.
- Review SSH authorized keys, firewall source IP, IAM access keys, DNS, and TLS.
- Confirm GitHub Actions deployments and GHCR package visibility remain
  correct.

See [Operations Guide](OPERATIONS_GUIDE.md) and
[Backup Setup](BACKUP_SETUP.md) for commands and recovery procedures.
