# ORNEXIS ONE

# Sprint 003

## AUTHENTICATION

---

## Sprint Goal

Complete and harden the ORNEXIS ONE authentication lifecycle so users can securely activate accounts, log in, maintain sessions, refresh access, log out, recover passwords and accept invitations.

---

## Objectives

- Review and preserve the existing login foundation
- Harden account activation
- Introduce secure invitation and activation tokens
- Introduce refresh tokens
- Implement session revocation
- Implement logout
- Implement password reset
- Update login activity
- Protect suspended and disabled accounts
- Improve audit coverage
- Ensure sensitive authentication data is never exposed
- Verify authentication behavior end-to-end

---

## Existing Authentication Foundation

☑ Password hashing with bcrypt

☑ Login by email and password

☑ JWT access token generation

☑ JWT access token verification

☑ Access token expiry

☑ Authenticated `/auth/me` endpoint

☑ Suspended account login protection

☑ Disabled account login protection

☑ Login audit logging

☑ Sensitive password hash excluded from `/auth/me`

☑ Authentication input validation foundation

---

## Login Hardening

☑ Review login response structure

☑ Update `lastLoginAt` after successful login

☑ Confirm invalid credentials return generic responses

☑ Confirm suspended accounts cannot authenticate

☑ Confirm disabled accounts cannot authenticate

☑ Review active access-token behavior after account suspension or disablement

☑ Verify login audit record

### Login Review Conclusion

Successful login now returns:

```text
user
accessToken
refreshToken
```

The access token expires after one hour.

A successful login also creates a refresh session and updates `lastLoginAt`.

Suspended and disabled accounts cannot log in.

Existing access tokens are checked against the current database user state on every protected request, so a user who is no longer `ACTIVE` cannot continue using an otherwise valid access token.

---

## Access Tokens

☑ JWT access token implemented

☑ Access token expiration configured

☑ Bearer authentication implemented

☑ Review JWT payload design

☑ Review JWT secret configuration

☑ Confirm expired tokens are rejected

☑ Confirm malformed tokens are rejected

☑ Confirm protected endpoints reject missing tokens

### Access Token Design

The access-token payload currently contains:

```text
userId
```

Organization context is intentionally not embedded into the JWT.

Organization selection and authorization remain separate from authentication and are validated using the active organization context and membership.

The authentication middleware now verifies:

```text
JWT signature and expiry
        ↓
userId payload
        ↓
User exists
        ↓
User status is ACTIVE
        ↓
request authenticated
```

---

## Refresh Tokens

☑ Design refresh-token persistence

☑ Create refresh-token/session database model

☑ Store refresh tokens securely

☑ Issue refresh token during login

☑ Implement token refresh endpoint

☑ Rotate refresh tokens

☑ Revoke replaced refresh tokens

☑ Detect invalid or revoked refresh tokens

☑ Expire refresh sessions

☑ Associate refresh sessions with users

☑ Capture session metadata where appropriate

### Refresh Session Design

Refresh tokens are cryptographically generated opaque tokens.

The raw refresh token is returned to the client while only its SHA-256 hash is persisted.

Refresh sessions store:

- User ownership
- Token hash
- Expiration
- Revocation timestamp
- Last-used timestamp
- IP address where available
- User agent where available
- Creation and update timestamps

Refresh sessions currently expire after 30 days.

A successful refresh performs rotation:

```text
existing refresh token
        ↓
validate hash
        ↓
confirm session active and unexpired
        ↓
confirm User remains ACTIVE
        ↓
revoke existing refresh session
        ↓
create replacement refresh session
        ↓
issue new access token
        ↓
return new refresh token
```

Reuse of a rotated or revoked refresh token is rejected.

### Future Hardening

Concurrent refresh-token replay detection and token-family invalidation may be introduced in a later security-hardening milestone.

---

## Logout

☑ Implement logout endpoint

☑ Revoke active refresh session

☑ Prevent revoked refresh token reuse

☑ Create `USER_LOGOUT` audit record

☑ Verify logout behavior end-to-end

### Logout Review Conclusion

`POST /auth/logout` accepts the refresh token representing the active session.

The corresponding refresh session is revoked and cannot subsequently be used to obtain new access tokens.

Logout activity is recorded in the audit log.

---

## Invitations and Activation

The previous activation mechanism accepted:

```text
userId + password
```

This has been replaced by secure token-based activation.

☑ Design invitation token model

☑ Generate cryptographically secure invitation tokens

☑ Store only secure token representations where appropriate

☑ Add invitation expiration

☑ Associate invitation with user and organization membership

☑ Explicitly test expired invitation rejection

☑ Prevent reused invitation use

☑ Replace direct `userId` activation with token-based activation

☑ Activate user after valid invitation acceptance

☑ Set membership state appropriately after activation

☑ Create invitation/activation audit records

☑ Return generic invalid or expired invitation errors

☑ Enforce invitation membership/user ownership at database level

### Invitation Design

Invitation tokens expire after 72 hours.

Only the token hash is stored in PostgreSQL.

Creating a new invitation for an organization membership invalidates previous unused invitation tokens for that membership.

Invitation acceptance requires:

```text
valid invitation token
        ↓
token not consumed
        ↓
token not expired
        ↓
User eligible for activation
        ↓
OrganizationUser status is INVITED
```

Activation runs inside a Prisma transaction and performs:

```text
User
INVITED → ACTIVE

OrganizationUser
INVITED → ACTIVE

joinedAt
→ activation timestamp

InvitationToken
consumedAt → activation timestamp
```

Successful activation creates:

```text
USER_ACTIVATED
INVITATION_ACCEPTED
```

audit records.

Invitation creation creates:

```text
INVITATION_CREATED
```

The database also enforces that the `userId` stored on an invitation token belongs to the same `OrganizationUser` membership referenced by the token.

---

## Password Reset

☑ Implement forgot-password endpoint

☑ Generate secure password reset token

☑ Store password reset token securely

☑ Add reset-token expiration

☑ Avoid revealing whether an email exists in production

☑ Implement reset-password endpoint

☑ Validate new password

☑ Hash new password using bcrypt

☑ Mark reset token as consumed

☑ Revoke relevant existing refresh sessions after password reset

☑ Create password reset completion audit record

☑ Verify reset token cannot be reused

☑ Explicitly test expired reset-token rejection

### Password Reset Design

Password-reset tokens expire after 60 minutes.

Only the SHA-256 token hash is stored in PostgreSQL.

Creating a new password-reset token invalidates previous unused reset tokens for the same user.

A successful reset runs transactionally and performs:

```text
passwordHash
→ replaced

PasswordResetToken
→ consumed

active RefreshSessions
→ revoked
```

The reset token cannot be reused.

Existing active refresh sessions were explicitly tested and confirmed to become unusable after password reset.

### Account Enumeration Protection

In production mode, both an existing and nonexistent email receive exactly the same public response:

```text
If an account exists for this email,
password reset instructions have been generated
```

The raw reset token is not returned in production.

During local development only, a reset token may be returned to support end-to-end testing until email delivery is implemented.

---

## Password Security

☑ Passwords hashed using bcrypt

☑ Password hashes excluded from normal user API responses

☑ Review bcrypt cost configuration

☐ Finalize stronger password policy

☑ Confirm authentication code does not intentionally log plain-text passwords

☑ Confirm authentication code does not intentionally log raw tokens

### Password Security Review

Passwords are hashed using bcrypt with cost factor:

```text
12
```

Normal user API responses use explicit safe field selection and exclude `passwordHash`.

The current minimum password length is:

```text
8 characters
```

A stronger production password policy may be introduced later without redesigning the authentication architecture.

---

## Account State

☑ User statuses include:

- INVITED
- ACTIVE
- SUSPENDED
- DISABLED

☑ Confirm only ACTIVE users can maintain authenticated sessions

☑ Review behavior of existing access tokens after suspension

☑ Review behavior of refresh tokens after suspension

☑ Revoke refresh session when inactive account attempts refresh

☑ Revoke active refresh sessions after password reset

☐ Automatically revoke all sessions immediately when an administrator suspends or disables an account

### Account-State Review

An already-issued access token was tested after the associated user was changed to `SUSPENDED`.

The same valid JWT was immediately rejected because authentication checks the current database user state.

A refresh token was also tested after suspension.

Refresh was rejected and the attempted refresh session was revoked.

A future account-management operation should revoke all active sessions immediately when an administrator suspends or disables a user rather than waiting for individual sessions to be used.

---

## Audit

☑ `USER_LOGIN`

☑ `USER_LOGOUT`

☑ `USER_ACTIVATED`

☑ `INVITATION_CREATED`

☑ `INVITATION_ACCEPTED`

☐ `PASSWORD_RESET_REQUESTED`

☑ `PASSWORD_RESET_COMPLETED`

☐ Dedicated session/token revocation audit events

### Audit Review

Authentication events currently record relevant security activity including:

- User
- Organization where applicable
- Entity
- IP address where available
- User agent where available
- Timestamp

Additional audit events for reset requests and session revocation may be added in a later security-hardening milestone.

---

## User API Security

☑ Protect `/users` from anonymous access

☑ Require authentication

☑ Require active organization context

☑ Require organization-user permissions

☑ Tenant-scope user listing

☑ Tenant-scope individual user lookup

☑ Exclude `passwordHash`

### User API Review

`GET /users` and `GET /users/:id` now return only users associated with the active organization through `OrganizationUser`.

Users with membership status `REMOVED` are excluded.

The current user-creation workflow remains intentionally separated:

```text
POST /users
        ↓
create global User identity

POST /organization-users
        ↓
create tenant membership
        ↓
generate invitation when INVITED
```

A unified organization invitation endpoint may replace this two-step administrative workflow in a later user-management milestone.

---

## Organization Boundary Hardening

☑ Protect `GET /organizations/:id`

☑ Require authentication and organization context

☑ Require `organizations.view`

☑ Ensure requested organization ID matches active organization context

☑ Harden organization deletion against cross-tenant IDs

### Organization Security Review

Organization records can no longer be retrieved anonymously through the ID endpoint.

A caller cannot request a different organization UUID while operating under another organization's context.

Deletion also verifies that the target organization ID matches the authenticated organization context before reaching the deletion service.

Organization lifecycle and tenant self-deletion policy will be reviewed separately from authentication.

---

## Security Requirements

Authentication follows these principles:

- Passwords are never stored in plain text
- Raw refresh, invitation and password-reset tokens are not stored in PostgreSQL
- Password hashes are not returned by public or tenant APIs
- Authentication errors avoid unnecessary account enumeration
- Refresh tokens are revocable
- Refresh tokens are rotated
- Invitation and password-reset tokens expire
- Consumed tokens cannot be reused
- Password reset invalidates active refresh sessions
- Account state is checked during authenticated access
- Organization membership is not inferred solely from authentication
- Authentication and authorization remain separate concerns
- Important account-security events are auditable

---

## API Endpoints

Implemented:

```text
POST /auth/login
POST /auth/activate
POST /auth/refresh
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/me
```

---

## Database Models

Authentication persistence now includes:

```text
RefreshSession
InvitationToken
PasswordResetToken
```

### RefreshSession

Supports:

- Hashed refresh tokens
- User ownership
- Expiration
- Revocation
- Rotation
- Session metadata
- Last-used tracking

### InvitationToken

Supports:

- Hashed invitation token
- User ownership
- Organization membership ownership
- Expiration
- Single-use consumption
- Database-level membership/user integrity

### PasswordResetToken

Supports:

- Hashed reset token
- User ownership
- Expiration
- Single-use consumption

---

## Database Migrations

Sprint 003 introduced:

1. `20260814083556_add_authentication_sessions_and_tokens`
2. `20260814104822_enforce_invitation_membership_user_integrity`

The project migration history now contains five migrations.

Migration status has been verified and the development database is up to date.

---

## Testing

☑ Successful login

☑ Invalid credentials behavior reviewed

☑ Suspended-user login protection

☑ Disabled-user login protection implemented

☑ Valid access token

☑ Invalid/malformed access token

☑ Missing access token

☑ Existing access token rejected after user suspension

☑ Valid refresh token

☑ Revoked refresh token

☑ Refresh-token rotation

☑ Old refresh token rejected after rotation

☑ Successful logout

☑ Refresh after logout rejected

☑ Valid invitation activation

☑ Explicit expired invitation test

☑ Reused invitation rejected

☑ Password reset request

☑ Valid password reset

☑ Explicit expired reset-token test

☑ Reused reset token rejected

☑ Existing refresh session revoked after password reset

☑ Existing refresh token rejected after user suspension

☑ `/auth/me` excludes sensitive fields

☑ `/users` excludes password hashes

☑ Anonymous `/users` access rejected

☑ Production forgot-password enumeration protection

---

## Quality

☑ Prisma schema validation

☑ Migration status verified

☑ TypeScript validation

☑ Authentication API manual testing completed

☑ Core authentication security review completed

☑ Database integrity review completed

☑ Tenant-boundary security review completed

☑ Explicit expiration tests completed

☐ Documentation finalized

☐ Git commit

☐ Final review completed

☐ Ready for Sprint 4

---

## Remaining Sprint 003 Work

Before Sprint 003 is closed:

1. Run the final Prisma, migration, TypeScript and Git checks.
2. Finalize this documentation.
3. Commit and push Sprint 003.

The following improvements are intentionally deferred rather than required for Sprint 003 closure:

- Stronger configurable password policy
- `PASSWORD_RESET_REQUESTED` audit event
- Dedicated token/session revocation audit events
- Automatic revocation of all sessions from a future administrative suspend/disable operation
- Refresh-token family/replay detection for concurrent refresh requests
- Unified organization invite-user endpoint
- Production email delivery for invitation and password-reset tokens

---

## Definition of Success

Sprint 003 is complete when ORNEXIS ONE provides a secure, auditable authentication lifecycle covering login, account activation, invitations, access tokens, refresh tokens, logout and password recovery.

Authentication must support future web and mobile clients without coupling session security to a specific frontend.

The system must protect sensitive credential material, prevent token reuse where required, enforce account state during authenticated access and preserve a clear separation between authentication, organization context and authorization.

---

## Status

IN PROGRESS