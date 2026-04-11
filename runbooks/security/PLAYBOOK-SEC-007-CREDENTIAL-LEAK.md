# PLAYBOOK-SEC-007: Credential Leak Response

## Quick Reference

| Property | Value |
|----------|-------|
| **Playbook ID** | SEC-007 |
| **Severity** | SEV-1/SEV-2 |
| **Response Time** | 15 minutes |
| **Owner** | Security Team |

---

## 1. Trigger Conditions

This playbook is activated when:
- Credentials found in public code repository (GitHub, GitLab, etc.)
- API keys discovered on paste sites
- Secrets detected in CI/CD logs
- Employee credentials in breach database
- Service account credentials exposed
- SSL/TLS private keys leaked
- Database credentials exposed
- OAuth tokens/secrets leaked

---

## 2. Credential Types & Risk

### 2.1 Risk Classification

| Credential Type | Risk Level | Rotation Priority | Potential Impact |
|-----------------|------------|-------------------|------------------|
| **Database Admin** | Critical | Immediate | Full data access |
| **Cloud Provider (AWS/Azure)** | Critical | Immediate | Infrastructure takeover |
| **Production API Keys** | Critical | Immediate | Service compromise |
| **SSL/TLS Private Keys** | Critical | Immediate | MITM, impersonation |
| **Service Account Tokens** | High | < 1 hour | Service-level access |
| **OAuth Client Secrets** | High | < 1 hour | Authentication bypass |
| **User Passwords** | High | < 1 hour | Account compromise |
| **Development API Keys** | Medium | < 4 hours | Dev environment access |
| **Webhook Secrets** | Medium | < 4 hours | Data injection |
| **Encryption Keys** | Critical | Immediate | Data exposure |

---

## 3. Immediate Response

### 3.1 Assess the Leak

```bash
# 1. Identify what was leaked
# - What type of credential?
# - What system does it access?
# - How long was it exposed?
# - Where was it found?

# 2. Check if credential was used
# Review audit logs for the exposed credential

# For API keys
psql -c "
SELECT *
FROM api_access_logs
WHERE api_key_hash = '<hash_of_leaked_key>'
  AND created_at > '<leak_discovery_time>' - INTERVAL '24 hours'
ORDER BY created_at DESC;
"

# For database credentials
psql -c "
SELECT *
FROM pg_stat_activity
WHERE usename = '<leaked_username>'
  AND backend_start > '<leak_discovery_time>' - INTERVAL '24 hours';
"
```

### 3.2 Immediate Rotation

```bash
# CRITICAL: Rotate immediately, investigate later

# 1. Database Credentials
psql -c "ALTER USER <username> WITH PASSWORD '<new_secure_password>';"

# Update application secret
kubectl create secret generic db-credentials \
  --from-literal=password='<new_password>' \
  -n ems-prod --dry-run=client -o yaml | kubectl apply -f -

# Restart affected services
kubectl rollout restart deployment -l uses-db=true -n ems-prod

# 2. API Keys
# Generate new key (application-specific)
NEW_KEY=$(openssl rand -hex 32)
kubectl create secret generic api-key \
  --from-literal=key=$NEW_KEY \
  -n ems-prod --dry-run=client -o yaml | kubectl apply -f -

# Invalidate old key in database
psql -c "UPDATE api_keys SET status='revoked', revoked_reason='credential_leak' WHERE key_hash='<old_key_hash>';"

# 3. AWS Credentials
# Using AWS CLI
aws iam delete-access-key --user-name <user> --access-key-id <leaked_key_id>
aws iam create-access-key --user-name <user>

# 4. SSL/TLS Certificates
# Generate new certificate
openssl req -new -key new-private.key -out new.csr
# Submit to CA and replace

# 5. Encryption Keys
# Generate new key
NEW_KEY=$(openssl rand -base64 32)
# Re-encrypt affected data (complex, may need application changes)
```

---

## 4. Investigation

### 4.1 How Was It Leaked?

| Source | Investigation Steps |
|--------|---------------------|
| **Git Repository** | `git log -p -S '<credential>'` |
| **CI/CD Logs** | Review pipeline logs |
| **Paste Site** | Check submission timestamp |
| **Breach Database** | Check breach date |
| **Insider** | Review access logs |

### 4.2 Git Repository Investigation

```bash
# 1. Search git history for the credential
git log -p --all -S '<partial_credential>' --source --remotes

# 2. Identify the commit
git show <commit_hash>

# 3. Identify who committed it
git log --format="%H %an %ae" <commit_hash>

# 4. Check if it was in a fork or main repo
git branch --contains <commit_hash>

# 5. Purge from git history (if still present)
# Using BFG Repo Cleaner
java -jar bfg.jar --replace-text secrets.txt repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (CAUTION)
git push --force --all
```

### 4.3 Exposure Analysis

```bash
# 1. When was it committed?
git log -1 --format="%ci" <commit_hash>

# 2. When was it pushed to public?
# Check GitHub events API or repository insights

# 3. How long was it exposed?
# Calculate: discovery_time - push_time

# 4. Was the repository public?
# Check repository visibility settings

# 5. Was it scraped by known scanners?
# Check GitHub secret scanning alerts
# Check GitGuardian, TruffleHog alerts
```

---

## 5. Credential-Specific Response

### 5.1 Database Credentials

```bash
# 1. Rotate password immediately
psql -c "ALTER USER app_user WITH PASSWORD '$(openssl rand -base64 24)';"

# 2. Review database access logs
psql -c "
SELECT usename, client_addr, backend_start, state, query
FROM pg_stat_activity
WHERE usename = 'app_user'
ORDER BY backend_start DESC;
"

# 3. Check for data exfiltration
# Review query logs for COPY, pg_dump, large SELECTs

# 4. Audit user permissions
psql -c "\du app_user"
psql -c "SELECT * FROM information_schema.role_table_grants WHERE grantee = 'app_user';"

# 5. Consider rotating all database credentials
# If root/admin was leaked
```

### 5.2 Cloud Provider Credentials (AWS)

```bash
# 1. Deactivate the key immediately
aws iam update-access-key --user-name <user> --access-key-id <key> --status Inactive

# 2. Check what actions were performed
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=<leaked_key> \
  --start-time <leak_time> \
  --query 'Events[*].{Time:EventTime,Event:EventName,Resource:Resources}' \
  --output table

# 3. Look for suspicious activity
# - New IAM users/roles created
# - New EC2 instances
# - S3 bucket access
# - Unusual regions

# 4. Delete the key (after investigation)
aws iam delete-access-key --user-name <user> --access-key-id <key>

# 5. Create new credentials
aws iam create-access-key --user-name <user>
```

### 5.3 OAuth/JWT Secrets

```bash
# 1. Rotate client secret
# Generate new secret in IdP (Keycloak, etc.)

# 2. Update application configuration
kubectl create secret generic oauth-credentials \
  --from-literal=client-secret='<new_secret>' \
  -n ems-prod --dry-run=client -o yaml | kubectl apply -f -

# 3. Invalidate all existing tokens (if JWT secret leaked)
# Change JWT signing key
kubectl create secret generic jwt-signing-key \
  --from-literal=key="$(openssl rand -base64 64)" \
  -n ems-prod --dry-run=client -o yaml | kubectl apply -f -

# 4. Force all users to re-authenticate
valkey-cli FLUSHDB  # Clear session cache

# 5. Notify users of forced re-login
```

### 5.4 Encryption Keys

```bash
# CRITICAL: Data re-encryption may be required

# 1. Generate new encryption key
NEW_KEY=$(openssl rand -base64 32)

# 2. If data was accessed with old key
# - Assume data is compromised
# - Follow Data Breach playbook

# 3. Re-encrypt all data (application-specific)
# This may require maintenance window

# 4. Securely destroy old key
# After re-encryption is verified

# 5. Update key in all locations
kubectl create secret generic encryption-key \
  --from-literal=key="$NEW_KEY" \
  -n ems-prod --dry-run=client -o yaml | kubectl apply -f -
```

---

## 6. Prevention

### 6.1 Enable Secret Scanning

```yaml
# GitHub secret scanning
# .github/workflows/secret-scan.yml
name: Secret Scanning
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: TruffleHog OSS
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          extra_args: --only-verified

      - name: Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 6.2 Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']

  - repo: https://github.com/zricethezav/gitleaks
    rev: v8.16.0
    hooks:
      - id: gitleaks
```

---

## 7. Communication

### 7.1 Internal Notification

```markdown
Subject: URGENT: Credential Leak Detected - Rotation Required

CONFIDENTIAL

Credential Type: [TYPE]
System Affected: [SYSTEM]
Exposure Window: [TIME RANGE]
Discovery: [HOW FOUND]

ACTIONS COMPLETED:
✓ Credential rotated
✓ Old credential invalidated
✓ Audit logs reviewed

ACTIONS REQUIRED:
□ Update any local configurations
□ Verify services are working
□ Report any issues to #security

If you committed this credential, please contact Security immediately.

Security Team
```

### 7.2 User Notification (If User Credentials)

```markdown
Subject: Security Notice - Password Reset Required

Dear [User],

We detected that your password may have been exposed in a security
incident outside of EMS systems.

As a precaution, we have reset your password and logged you out
of all sessions.

WHAT YOU NEED TO DO:
1. Reset your password: [LINK]
2. Enable two-factor authentication
3. If you used this password elsewhere, change it there too

We take security seriously and apologize for any inconvenience.

EMS Security Team
```

---

## 8. Post-Incident

### 8.1 Verification

```bash
# 1. Verify old credential no longer works
curl -H "Authorization: Bearer <old_key>" https://api.ems.com/health
# Should return 401

# 2. Verify new credential works
curl -H "Authorization: Bearer <new_key>" https://api.ems.com/health
# Should return 200

# 3. Verify services are healthy
kubectl get pods -n ems-prod
curl https://api.ems.com/health

# 4. Monitor for suspicious activity (24-48 hours)
```

### 8.2 Lessons Learned

- How did the credential get exposed?
- Were secrets management best practices followed?
- Are pre-commit hooks in place?
- Is secret scanning enabled?
- Are credentials rotated regularly?

---

## 9. Escalation

| Condition | Escalation |
|-----------|------------|
| Data accessed with leaked credential | Data Breach playbook |
| Cloud infrastructure credential | Infrastructure team + CISO |
| Production database | DBA team + Security |
| SSL certificate | Certificate team |

---

## 10. Resources

| Tool | Purpose |
|------|---------|
| **GitHub Secret Scanning** | Automatic detection |
| **GitGuardian** | Real-time monitoring |
| **TruffleHog** | Historical scanning |
| **Gitleaks** | Pre-commit scanning |
| **detect-secrets** | Pre-commit hooks |
| **Have I Been Pwned** | Breach checking |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Security Team | Initial release |
