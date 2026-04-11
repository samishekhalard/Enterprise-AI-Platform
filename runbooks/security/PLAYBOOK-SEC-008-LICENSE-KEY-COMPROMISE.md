# PLAYBOOK-SEC-008: License Signing Key Compromise (Air-Gapped Recovery)

**Status:** Draft
**Date:** 2026-02-27
**Author:** SEC Agent
**Related ADR:** [ADR-015](../../docs/adr/ADR-015-on-premise-license-architecture.md)
**Severity:** CRITICAL
**Audience:** Vendor Security Team, Client IT Administrators

---

## Incident Description

The Ed25519 private signing key used to generate EMSIST license files has been compromised, suspected compromised, or the HSM containing it has been breached. This playbook covers the manual public key replacement protocol for **air-gapped client environments** where automatic updates are impossible.

## Threat Model

| Threat | Impact | Likelihood |
|--------|--------|------------|
| Attacker forges license files with stolen private key | Unauthorized feature access, unlimited seats, extended expiry | HIGH (if key is actually compromised) |
| Attacker modifies existing license payloads and re-signs | Privilege escalation, tenant boundary bypass | HIGH |
| Attacker distributes forged licenses to clients | Supply chain attack on client installations | MEDIUM |

## Preconditions

- Vendor uses Ed25519 key pair stored in HSM for license signing
- Public key is embedded in application JAR at `license/emsist-license-public.pem`
- License files use `KID` field in header for key selection (e.g., `EMSIST-LICENSE-V1;KID=emsist-2026-k1`)
- Client environments may be fully air-gapped (no internet access)

---

## Phase 1: Vendor-Side Actions (Immediate, T+0 to T+2h)

### 1.1 Confirm Compromise

```
[ ] Verify the compromise report (forensics, HSM audit logs, threat intelligence)
[ ] Determine scope: which key IDs are affected?
[ ] Determine if any forged licenses have been distributed
[ ] Activate incident response team
```

### 1.2 Generate New Key Pair

```
[ ] Generate new Ed25519 key pair in replacement HSM
[ ] Assign new KID (e.g., emsist-2026-k2-emergency)
[ ] Verify key generation was successful (sign + verify test payload)
[ ] Secure old HSM (power down, isolate, preserve for forensics)
```

### 1.3 Re-Sign All Active Customer Licenses

```
[ ] Export all active license payloads from CRM/license management system
[ ] Re-sign each payload with the new private key
[ ] Update KID in each license header to new KID
[ ] Generate revocation package (.revoke file) for the compromised KID
[ ] Package for distribution:
    - New .lic file per customer
    - New public key file (emsist-2026-k2-emergency.pem)
    - Revocation package
    - Installation instructions
```

### 1.4 Build Emergency Application Patch

```
[ ] Add new public key to application resources:
    src/main/resources/license/emsist-2026-k2-emergency.pem
[ ] Remove or mark compromised public key:
    src/main/resources/license/emsist-2026-k1.pem.REVOKED
[ ] Update LicenseSignatureVerifier to reject the compromised KID
[ ] Build and test emergency patch JAR/Docker image
[ ] Sign the patch with application code-signing certificate
[ ] Generate SHA-256 checksum of patch artifacts
```

---

## Phase 2: Client Notification (T+2h to T+4h)

### 2.1 Notification Content

Notify all clients via secure channels (phone, encrypted email, secure portal):

```
SECURITY ADVISORY: EMSIST License Key Rotation Required

Severity: CRITICAL
Action Required: Manual public key replacement
Deadline: Within 72 hours of receiving this advisory

What happened:
- The Ed25519 signing key used for EMSIST license files has been rotated
  due to a security concern.

What you need to do:
1. Apply the emergency application patch (attached)
2. Import the new license file (attached)
3. Verify the new license is active
4. Report completion to your EMSIST support contact

What happens if you don't act:
- After 72 hours, the old public key will be treated as revoked
- The application will enter TAMPERED state, blocking all operations
  except master tenant access
```

### 2.2 Distribution Methods (Air-Gapped)

| Method | When to Use | Security |
|--------|------------|----------|
| **Encrypted USB drive** | Courier delivery for highest-security sites | AES-256 encrypted, courier with chain-of-custody form |
| **Secure file transfer** | Sites with limited connectivity (SFTP/SCP) | TLS 1.3, client certificate authentication |
| **Vendor field engineer** | Sites requiring hands-on assistance | Engineer performs installation on-site |
| **Registered mail** | Sites in remote locations | Encrypted media, signed delivery receipt |

---

## Phase 3: Client-Side Installation (Air-Gapped Protocol)

### 3.1 Prerequisites

```
[ ] Receive emergency patch package from vendor
[ ] Verify SHA-256 checksum of all received files
[ ] Verify vendor's code-signing certificate on patch JAR
[ ] Schedule maintenance window (15-30 minutes downtime)
[ ] Ensure master tenant superadmin credentials are available
```

### 3.2 Backup Current State

```bash
# Backup current application directory
cp -r /opt/emsist /opt/emsist-backup-$(date +%Y%m%d)

# Backup current license database state
pg_dump -h localhost -U emsist license_db > license_db_backup_$(date +%Y%m%d).sql

# Record current license file hash
sha256sum /opt/emsist/config/current.lic > license_hash_before.txt
```

### 3.3 Apply Emergency Patch

```bash
# Stop the application
systemctl stop emsist

# Replace the application JAR (or update Docker image)
# Option A: JAR deployment
cp emsist-emergency-patch.jar /opt/emsist/emsist.jar

# Option B: Docker deployment
docker load < emsist-emergency-patch.tar
docker-compose -f docker-compose.yml pull license-service
docker-compose -f docker-compose.yml up -d license-service

# Verify new public key is present
jar -tf /opt/emsist/emsist.jar | grep license/
# Expected output:
#   BOOT-INF/classes/license/emsist-2026-k2-emergency.pem
#   BOOT-INF/classes/license/emsist-2026-k1.pem.REVOKED
```

### 3.4 Import New License File

```bash
# Start the application
systemctl start emsist

# Wait for application to be healthy
until curl -sf http://localhost:8085/actuator/health; do sleep 2; done

# Login as master tenant superadmin
# Navigate to: Administration > License Management > Import License
# Upload the new .lic file received from vendor
# Verify: License state should show ACTIVE with new KID
```

### 3.5 Verify Installation

```
[ ] Application starts without errors
[ ] License state shows ACTIVE (not TAMPERED or EXPIRED)
[ ] KID in license details shows new key ID (emsist-2026-k2-emergency)
[ ] Seat validation works: regular user can log in
[ ] Feature gates work: licensed features are accessible
[ ] Audit log shows license import event
[ ] Old license with compromised KID is rejected if re-imported
```

### 3.6 Report Completion

```
[ ] Notify vendor support that installation is complete
[ ] Provide: client ID, installation timestamp, new KID, license state
[ ] Retain backup files for 30 days, then securely delete
```

---

## Phase 4: Post-Incident (T+72h to T+2 weeks)

### 4.1 Vendor Actions

```
[ ] Confirm all clients have completed key replacement
[ ] Publish security advisory with post-mortem (sanitized)
[ ] Update threat model in ADR-015
[ ] Review HSM access controls and add additional safeguards
[ ] Schedule next routine key rotation (accelerated if needed)
[ ] Update license generation tooling to use new key
```

### 4.2 Forensics

```
[ ] Determine root cause of compromise
[ ] Identify all licenses signed with compromised key
[ ] Verify no forged licenses were imported by any client
[ ] Check audit logs across all client installations for anomalies
[ ] File incident report per regulatory requirements
```

### 4.3 Prevention Improvements

| Improvement | Description | Priority |
|-------------|-------------|----------|
| HSM access audit trail | Real-time monitoring of HSM key usage | HIGH |
| Key usage anomaly detection | Alert on unusual signing frequency or off-hours usage | HIGH |
| Client-side revocation check | Application checks revocation list on startup (offline-capable) | MEDIUM |
| Dual-control key generation | Require two authorized personnel for key operations | MEDIUM |
| Hardware-bound instance ID | Bind license to specific hardware fingerprint | LOW |

---

## Rollback Procedure

If the emergency patch causes issues:

```bash
# Stop application
systemctl stop emsist

# Restore backup
cp /opt/emsist-backup-$(date +%Y%m%d)/emsist.jar /opt/emsist/emsist.jar

# Restore license database
psql -h localhost -U emsist license_db < license_db_backup_$(date +%Y%m%d).sql

# Restart with old version
systemctl start emsist

# IMPORTANT: The old public key is still valid until the
# vendor pushes a revocation update. Contact vendor support
# immediately to coordinate an alternative patch.
```

---

## Escalation Contacts

| Role | Responsibility | Contact Method |
|------|---------------|----------------|
| Vendor Security Lead | Incident commander, key rotation authority | Phone (24/7 on-call) |
| Vendor Engineering Lead | Patch creation and validation | Secure Slack channel |
| Client IT Administrator | On-site installation | Per-client contact list |
| Legal/Compliance | Regulatory notification if required | Email + phone |

---

## Checklist Summary

```
Phase 1 - Vendor (T+0 to T+2h):
  [ ] Confirm compromise
  [ ] Generate new key pair in HSM
  [ ] Re-sign all active customer licenses
  [ ] Build emergency application patch

Phase 2 - Notification (T+2h to T+4h):
  [ ] Notify all clients via secure channels
  [ ] Distribute patch + new license via secure method

Phase 3 - Client Installation (T+4h to T+72h):
  [ ] Backup current state
  [ ] Apply emergency patch
  [ ] Import new license file
  [ ] Verify installation
  [ ] Report completion

Phase 4 - Post-Incident (T+72h to T+2 weeks):
  [ ] Confirm all clients migrated
  [ ] Complete forensics
  [ ] Implement prevention improvements
```
