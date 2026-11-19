# Legacy account migration and rollback runbook

## Scope and current state

The application performs **lazy, per-account migration at successful login**. There is no bulk password migration command. No production database has been connected to or modified during Phase B.3.

This runbook is for an operator preparing a dedicated pre-production copy. Never run these steps against production without separate change approval and a verified backup.

## 1. Backup before migration

1. Announce a maintenance window and pause administrative writes on the pre-production copy.
2. Verify that the MongoDB URI points to the intended non-production database. Do not print it or place it in shell history.
3. Store a MongoDB Database Tools configuration file in a protected secret mount with permissions 0600. The URI must not be passed as a command-line argument.
4. Create an encrypted, access-controlled archive:

    mongodump --config=/run/secrets/prm-mongodump.yml --archive=/secure-backups/prm-pre-auth-migration.archive.gz --gzip

    sha256sum /secure-backups/prm-pre-auth-migration.archive.gz

5. Confirm the archive is readable by restoring it into a separate disposable MongoDB instance and verifying collections and document counts.
6. Record backup timestamp, database name, archive checksum, operator, and restore-test result in the change record.

The URI must remain in the secret file, not in a terminal command, log, issue, commit, or artifact.

## 2. Migrability assessment

The production database has **not** been inspected in this phase. Therefore the actual number of migratable, already-hashed, disabled, or reset-required accounts is unknown. Do not infer account counts from test fixtures.

| Existing account state | Expected treatment |
|---|---|
| Has a valid passwordHash | No password migration required |
| Has legacy plaintext; submitted value matches exactly; 12+ characters and at most 72 UTF-8 bytes | On successful login, bcrypt hash is created and legacy password field is unset |
| Has legacy plaintext shorter than 12 characters | Login returns PASSWORD_RESET_REQUIRED; operator reset required |
| Has legacy plaintext longer than bcrypt's 72-byte input boundary | Exact legacy value can be verified, but automatic hash migration is refused; operator reset required |
| Incorrect submitted password | No migration; legacy field remains unchanged |
| Disabled account | Authentication refused; password reset does not reactivate it |
| Regional/provincial administrator with missing geographic scope | Access denied until verified scope is assigned |

Never hash a database plaintext value by itself. The submitted login value must first match the exact stored legacy value.

## 3. Pre-production migration rehearsal

1. Restore the backup into a **separate** pre-production MongoDB database.
2. Configure the pre-production API with that database, HTTPS, exact CLIENT_ORIGINS, COOKIE_SECURE=true, and a strong AUDIT_IP_HASH_KEY.
3. Confirm the role and geographic assignments with the system owner.
4. Test one disposable legacy account whose password meets the current policy. Sign in and verify:
   - passwordHash is present;
   - password is unset;
   - the session cookie is HttpOnly and Secure;
   - the account's role and geographic scope are unchanged.
5. Test a weak legacy password and verify it receives PASSWORD_RESET_REQUIRED without changing either password field.
6. Test an incorrect password and verify no migration occurs.
7. Verify that disabled accounts remain disabled and that missing geographic scope fails closed.
8. Run npm test in server/server and the frontend tests/build in client.

## 4. Operator-assisted password reset

Only run this command against the approved target database. Supply values through a secret manager or protected environment injection, never command-line arguments:

    cd server/server
    export RESET_ADMIN_USERNAME="approved-account"
    read -s RESET_ADMIN_PASSWORD
    export RESET_ADMIN_PASSWORD
    npm run admin:reset
    unset RESET_ADMIN_USERNAME RESET_ADMIN_PASSWORD

The reset stores a bcrypt hash, removes the legacy plaintext field, revokes all sessions, and does not reactivate a disabled account. Verify the account state after reset.

## 5. Geographic scope assignment

Verify the region/province from the authoritative administrative source before assigning it. The script checks that the requested scope type matches the account role.

Regional example:

    cd server/server
    export SCOPE_ADMIN_USERNAME="regional-account"
    export SCOPE_ADMIN_REGION="verified-region"
    npm run admin:scope
    unset SCOPE_ADMIN_USERNAME SCOPE_ADMIN_REGION

Provincial accounts use SCOPE_ADMIN_PROVINCE instead. Re-test access to both an in-scope and out-of-scope record.

## 6. Rollback

1. Stop administrative writes and put the pre-production application into maintenance mode.
2. Preserve logs and the current database snapshot for investigation.
3. Roll back application code only to a release that understands bcrypt passwordHash sessions. **Do not roll back to the original plaintext-only authentication code after any account has been migrated.**
4. If a database rollback is required, restore the pre-migration snapshot into a separate database first and validate it. Restoring the Admin collection can overwrite accounts created or changed after the backup; reconcile those changes under a documented maintenance procedure before any production restore.
5. Never restore an entire production database with a destructive drop operation as an improvised rollback. Obtain explicit approval, verify the target database, and retain the pre-restore snapshot.
6. Rotate any credentials or session secrets that may have been exposed. Require re-authentication after session-store restoration.

## 7. Required operator sign-off

- [ ] Backup archive created and checksum recorded
- [ ] Restore test completed in a separate database
- [ ] Pre-production database target verified
- [ ] Account role and geographic scope mapping approved
- [ ] Legacy weak/long-password reset list prepared
- [ ] Test migration completed on disposable accounts
- [ ] Rollback rehearsal completed
- [ ] Production migration separately authorized

**No production migration has been run or authorized by this document.**
