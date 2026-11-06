# Initial administrator bootstrap

Use this one-time command when provisioning a new workspace. Do not use demo seed credentials for a real deployment.

Set these environment variables from a secret manager or protected shell:

- `BOOTSTRAP_ORG_NAME`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_NAME`
- `BOOTSTRAP_ADMIN_PASSWORD` (at least 16 characters)
- `DATABASE_URL`

Run `npx tsx scripts/bootstrapAdmin.ts` after applying database migrations. The script refuses an existing email or organization name, creates one Admin account in `INVITED` state, and never prints the password. The administrator must sign in, prove mailbox access through the emailed MFA code, and choose a new password before the account becomes active. Remove the bootstrap secret from the shell/secret store after use.
