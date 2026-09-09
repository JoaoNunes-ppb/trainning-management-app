#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-eu-west-1}"
S3_BUCKET="${S3_BUCKET:-}"
IAM_USER="${IAM_USER:-athlete-manager-backup}"
S3_PREFIX="${S3_PREFIX:-backups/athlete-manager}"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

command -v aws >/dev/null 2>&1 || fail "AWS CLI is required"
[[ -n "$S3_BUCKET" ]] || fail "Set S3_BUCKET to a globally unique bucket name"
[[ "$S3_BUCKET" =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ ]] ||
  fail "S3_BUCKET is not a valid bucket name"
[[ "$S3_PREFIX" != /* && "$S3_PREFIX" != */ ]] ||
  fail "S3_PREFIX must not start or end with /"

account_id="$(aws sts get-caller-identity --query Account --output text)"
echo "Creating private backup bucket s3://${S3_BUCKET} in ${AWS_REGION}..."

if ! aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
  if [[ "$AWS_REGION" == us-east-1 ]]; then
    aws s3api create-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION" >/dev/null
  else
    aws s3api create-bucket \
      --bucket "$S3_BUCKET" \
      --region "$AWS_REGION" \
      --create-bucket-configuration "LocationConstraint=${AWS_REGION}" >/dev/null
  fi
fi

aws s3api put-public-access-block \
  --bucket "$S3_BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-bucket-encryption \
  --bucket "$S3_BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'

lifecycle_file="$(mktemp)"
policy_file="$(mktemp)"
trap 'rm -f "$lifecycle_file" "$policy_file"' EXIT

cat >"$lifecycle_file" <<JSON
{
  "Rules": [
    {
      "ID": "DeleteAthleteManagerBackupsAfter30Days",
      "Status": "Enabled",
      "Filter": {"Prefix": "${S3_PREFIX}/"},
      "Expiration": {"Days": 30},
      "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 1}
    }
  ]
}
JSON
aws s3api put-bucket-lifecycle-configuration \
  --bucket "$S3_BUCKET" \
  --lifecycle-configuration "file://${lifecycle_file}"

cat >"$policy_file" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBackupPrefix",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::${S3_BUCKET}",
      "Condition": {"StringLike": {"s3:prefix": ["${S3_PREFIX}/*"]}}
    },
    {
      "Sid": "ManageBackupObjects",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::${S3_BUCKET}/${S3_PREFIX}/*"
    }
  ]
}
JSON

aws iam get-user --user-name "$IAM_USER" >/dev/null 2>&1 ||
  aws iam create-user --user-name "$IAM_USER" >/dev/null
aws iam put-user-policy \
  --user-name "$IAM_USER" \
  --policy-name AthleteManagerS3Backup \
  --policy-document "file://${policy_file}"

echo
echo "Bucket and least-privilege IAM user are ready (AWS account ${account_id})."
echo "Create one access key now and copy it directly into .env.production:"
echo "  aws iam create-access-key --user-name ${IAM_USER}"
echo "The SecretAccessKey is shown only once. Never commit or paste it into GitHub."
