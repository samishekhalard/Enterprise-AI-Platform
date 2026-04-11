# RUNBOOK-012: Encryption at Rest

| Field | Value |
|-------|-------|
| ID | RUNBOOK-012 |
| Title | Encryption at Rest — Docker Compose Environments |
| ADR | ADR-019 |
| Issues | ISSUE-INF-016, ISSUE-INF-017, ISSUE-INF-018 |
| Status | Active |
| Last Updated | 2026-03-04 |

---

## Overview

This runbook covers two layers of encryption at rest for EMSIST dev/staging environments:

| Layer | What | How | Status |
|-------|------|-----|--------|
| **Backup archives** | PostgreSQL dumps, Neo4j tar, Valkey RDB | `age` encryption in backup-cron | ✅ Implemented |
| **Volume data at rest** | Docker named volumes (`/var/lib/docker/volumes/`) | Host filesystem encryption | ⏳ Host setup required |

The backup-cron sidecar handles Layer 1 automatically when `AGE_PUBLIC_KEY` is set.
Layer 2 requires a one-time host-level setup documented below.

---

## Layer 1: Encrypted Backup Archives

### Setup

1. Install `age` on your workstation (for decryption):
   ```bash
   # macOS
   brew install age

   # Linux
   apt install age  # or: go install filippo.io/age/cmd/age@latest
   ```

2. Generate a keypair — **store the private key offline**:
   ```bash
   age-keygen -o ~/.age-backup-key.txt
   # Output:
   #   Public key: age1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   #   Secret key: AGE-SECRET-KEY-1...
   ```

3. Add the public key to `.env.dev` or `.env.staging`:
   ```bash
   AGE_PUBLIC_KEY=age1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. Restart the backup-cron service:
   ```bash
   docker compose -f docker-compose.dev-data.yml --env-file .env.dev restart backup-cron
   ```

5. Verify encryption is active:
   ```bash
   docker exec ems-dev-backup-cron /usr/local/bin/backup-now.sh
   docker exec ems-dev-backup-cron ls /backups/postgresql/
   # Expect: *.dump.age files (not *.dump)
   ```

### Decrypting a Backup

```bash
# Decrypt a PostgreSQL dump
age --decrypt -i ~/.age-backup-key.txt master_db_20260304_030000.dump.age > master_db.dump

# Restore PostgreSQL from decrypted custom-format dump
docker exec -i ems-dev-postgres-1 pg_restore \
    -U postgres -d master_db --clean --if-exists < master_db.dump

# Decrypt Neo4j archive
age --decrypt -i ~/.age-backup-key.txt neo4j-data_20260304_030000.tar.gz.age \
    | tar -xzf - -C /tmp/neo4j-restore/

# Decrypt Valkey RDB
age --decrypt -i ~/.age-backup-key.txt valkey-dump_20260304_0300.rdb.age > dump.rdb
# Copy to Valkey container's data volume, then restart
```

### Private Key Security

- Never store the private key in the repo, `.env` files, or Docker volumes
- Recommended storage: hardware security key (YubiKey) or offline encrypted USB
- For team environments: use `age` with SSH keys (`-R ssh-ed25519 AAAA...`) so each team member can decrypt independently without sharing a single private key

---

## Layer 2: Host Filesystem Encryption

Docker named volumes are stored on the host at:
- **Linux**: `/var/lib/docker/volumes/`
- **macOS (Docker Desktop)**: inside the Docker Desktop VM image at `~/Library/Containers/com.docker.docker/Data/vms/0/data/`

### macOS: Enable FileVault

FileVault encrypts the entire macOS boot disk including Docker Desktop VM storage.

```bash
# Check current FileVault status
fdesetup status

# Enable FileVault (requires restart)
sudo fdesetup enable

# Verify after restart
fdesetup status
# Expected: FileVault is On.

# Verify Docker volumes are on encrypted disk
diskutil info / | grep -E "Encrypted|FileVault"
# Expected: FileVault: Yes (Unlocked)
```

**Note:** Docker Desktop on macOS stores its VM disk image at `~/Library/Containers/com.docker.docker/`. With FileVault enabled, this path is encrypted automatically when the user is not logged in (screen locked or machine off).

### Linux: LUKS Encryption for Docker Volumes

If running on a Linux host without full-disk encryption, encrypt the Docker volume storage directory:

```bash
# PREREQUISITE: Docker must be stopped
systemctl stop docker

# 1. Create a dedicated block device or partition (e.g., /dev/sdb)
#    Or create a loopback device for testing:
dd if=/dev/urandom of=/opt/docker-volumes.img bs=1G count=50
LOOP=$(losetup --find --show /opt/docker-volumes.img)

# 2. Format with LUKS
cryptsetup luksFormat --type luks2 "$LOOP"
# Enter a strong passphrase when prompted

# 3. Open the LUKS container
cryptsetup luksOpen "$LOOP" docker-volumes-enc

# 4. Create filesystem
mkfs.ext4 /dev/mapper/docker-volumes-enc

# 5. Mount and migrate existing Docker volumes
mkdir -p /var/lib/docker-encrypted
mount /dev/mapper/docker-volumes-enc /var/lib/docker-encrypted
rsync -av /var/lib/docker/volumes/ /var/lib/docker-encrypted/

# 6. Update Docker daemon to use the encrypted path
# Edit /etc/docker/daemon.json:
cat > /etc/docker/daemon.json << 'EOF'
{
  "data-root": "/var/lib/docker-encrypted"
}
EOF

# 7. Restart Docker
systemctl start docker

# 8. Verify
docker info | grep "Docker Root Dir"
# Expected: Docker Root Dir: /var/lib/docker-encrypted
```

**Auto-unlock at boot (systemd)**:
```bash
# /etc/crypttab entry for auto-unlock with keyfile
echo "docker-volumes-enc /opt/docker-volumes.img /etc/docker-luks-key luks" \
    >> /etc/crypttab

# Generate and restrict keyfile
dd if=/dev/urandom of=/etc/docker-luks-key bs=4096 count=1
chmod 400 /etc/docker-luks-key

# Add keyfile to LUKS container
cryptsetup luksAddKey /opt/docker-volumes.img /etc/docker-luks-key

# /etc/fstab entry
echo "/dev/mapper/docker-volumes-enc /var/lib/docker-encrypted ext4 defaults 0 2" \
    >> /etc/fstab
```

### Verify Encryption Active

```bash
# macOS
diskutil info / | grep "FileVault"

# Linux
lsblk -o NAME,TYPE,FSTYPE,MOUNTPOINT | grep crypt
cryptsetup status docker-volumes-enc
```

---

## Verification Checklist

After setup, verify both layers are active:

```bash
# Layer 1: Encrypted backup archives
docker exec ems-dev-backup-cron /usr/local/bin/backup-now.sh
docker exec ems-dev-backup-cron ls /backups/postgresql/
# Expect: files ending in .age

# Try to read an encrypted file (should fail without private key)
docker exec ems-dev-backup-cron cat /backups/postgresql/master_db_*.dump.age
# Expect: binary/encrypted data (not readable SQL)

# Layer 2: Host encryption
fdesetup status    # macOS
# OR
cryptsetup status docker-volumes-enc  # Linux
```

---

## Related

- ADR-019: Encryption at Rest strategy
- ADR-018: High Availability Multi-Tier
- ISSUE-INF-016: PostgreSQL volume encryption
- ISSUE-INF-017: Neo4j volume encryption
- ISSUE-INF-018: Valkey volume encryption
- RUNBOOK-011: Docker Volume Management
