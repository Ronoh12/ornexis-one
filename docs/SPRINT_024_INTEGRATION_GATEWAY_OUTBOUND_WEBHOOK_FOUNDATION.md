# Sprint 024 — Integration Gateway and Outbound Webhook Foundation

Specification: LOCKED

Implementation status: ACCEPTANCE PASSED — 2026-09-12

Strategic requirement: SR-030 — API-First Integration and Extensibility
Architecture

## 1. Purpose

Sprint 024 establishes a reusable, provider-neutral, tenant-isolated,
permission-aware and auditable integration foundation for ORNEXIS ONE.

The foundation allows organizations to register dedicated machine identities,
issue controlled API credentials, assign explicit scopes, configure outbound
webhook endpoints, subscribe to approved platform events and inspect delivery
history.

External integrations must extend ORNEXIS ONE without bypassing normal
security, authorization, tenant isolation, validation or audit controls.

## 2. Sprint Boundary

Sprint 024 provides:

- tenant-owned integration clients
- integration-client lifecycle management
- dedicated machine credentials
- one-time credential-secret display
- hashed credential persistence
- credential expiry and revocation
- explicit integration permission scopes
- machine-to-machine authentication middleware
- tenant-safe integration identity context
- outbound webhook endpoint configuration
- encrypted webhook signing secrets
- approved event-type subscriptions
- transactional integration-event publication
- idempotent event identity
- webhook delivery records
- HMAC-signed webhook payloads
- bounded retry scheduling
- delivery processing job
- delivery attempt history
- endpoint failure tracking
- integration observability APIs
- integration auditing
- runtime acceptance coverage

Sprint 024 does not provide:

- inbound webhooks
- OAuth authorization-server flows
- interactive user impersonation
- vendor-specific adapters
- M-Pesa integration
- banking integration
- payment processing
- live SIEM forwarding
- customer-defined executable code
- arbitrary event subscriptions
- unrestricted internal network access
- a general-purpose message broker
- guaranteed exactly-once external delivery

Those capabilities remain reserved for later integration and industry sprints.

## 3. Design Principles

The integration foundation must be:

- tenant-isolated
- least-privileged
- provider-neutral
- revocable
- auditable
- idempotent
- retry-safe
- bounded
- observable
- secret-safe
- data-minimized
- backward-compatible
- independent of employee credentials

Client-provided organization ownership must never be trusted.

## 4. Integration Clients

An integration client represents a machine, application, connector or partner
system authorized by one organization.

An integration client contains:

- ID
- organization ID
- normalized code
- name
- optional description
- active state
- optional external-system name
- optional owner organization-user ID
- optional last-used timestamp
- creation time
- update time

Client codes are unique within an organization.

Client names are unique within an organization.

An integration client is not an ordinary `User`.

An integration client cannot sign into employee-facing authentication flows.

## 5. Client Ownership

An integration client may reference an active organization member as its
operational owner.

The owner is responsible for business oversight and does not become the
machine actor.

Owner assignment does not grant the owner additional integration
permissions.

Foreign organization memberships cannot become integration owners.

Owner deletion or removal must not destroy historical integration records.

## 6. Integration Client Status

Initial client status values are:

- `ACTIVE`
- `SUSPENDED`
- `REVOKED`

Only active clients may authenticate.

Suspended clients retain configuration and history but cannot authenticate or
deliver new work.

Revoked clients cannot be reactivated.

Client revocation also invalidates all active credentials.

## 7. Integration Credentials

Credentials belong to one integration client and organization.

A credential contains:

- ID
- organization ID
- integration client ID
- public key identifier
- credential-secret hash
- optional label
- active state
- optional expiry time
- optional last-used time
- optional revoked time
- optional revoking organization-user ID
- creation time
- update time

Multiple credentials support controlled rotation.

## 8. Credential Secret Format

A generated credential contains:

- a recognizable ORNEXIS integration prefix
- a public credential identifier
- a cryptographically random secret

The full credential is displayed exactly once after creation.

Only the public identifier and SHA-256 secret hash are persisted.

The raw API secret is never stored in plaintext.

The raw API secret is never returned by list or retrieval endpoints.

Credential generation uses cryptographically secure randomness.

## 9. Credential Authentication

Machine requests use a dedicated authorization scheme.

Initial format:

`Authorization: OrnexisIntegration <credential>`

The authentication middleware:

- parses the credential format strictly
- identifies the credential using its public identifier
- hashes the presented secret
- compares hashes using constant-time comparison
- verifies credential active state
- verifies expiry
- verifies client active state
- loads organization ownership
- loads effective permission scopes
- records bounded usage metadata
- exposes a dedicated integration-auth context

Invalid, expired, suspended or revoked credentials return the same safe
authentication response.

## 10. Integration Authentication Context

A successful machine request receives trusted context containing:

- integration client ID
- integration credential ID
- organization ID
- effective permission codes
- authentication type
- request time

Integration context is distinct from employee JWT context.

A route must explicitly support integration authentication before machine
credentials may access it.

Existing employee routes do not automatically accept integration credentials.

## 11. Integration Scopes

Integration scopes reuse the platform Permission registry.

A client receives explicit permission assignments through an
organization-owned join record.

Initial management permissions are:

- `integrations.view`
- `integrations.manage`
- `integrations.credentials`
- `integrations.webhooks`
- `integrations.deliveries`
- `integrations.publish`

These permissions control human administration of the Integration Centre.

Machine scopes use existing or future business permission codes assigned
explicitly to the integration client.

An integration client receives no implicit Administrator bypass.

## 12. Scope Governance

Only permissions registered as integration-assignable may be assigned to
machine clients.

Sprint 024 introduces an integration-assignable marker on Permission.

Existing permissions default to not integration-assignable.

Initial integration-assignable permissions are limited to Sprint 024 test and
publication capabilities.

Administrative permissions cannot be assigned to machine identities unless
explicitly approved by later governance.

Scope changes are audited.

## 13. Credential Lifecycle

Authorized administrators may:

- create a credential
- list credential metadata
- revoke a credential
- rotate by creating a replacement
- inspect last-used and expiry state

Credential secrets cannot be retrieved after creation.

Credential records are preserved after revocation.

A client must not be physically deleted while credentials, endpoints, events
or delivery history depend on it.

## 14. Expiry

Credential expiry is optional.

An expiry time must occur in the future when the credential is created.

Expired credentials remain stored but cannot authenticate.

Expiry checks use server time.

Credential list responses expose expiry metadata but never the secret hash.

## 15. Credential Usage

Successful authentication updates:

- credential last-used timestamp
- client last-used timestamp

Usage updates are best-effort and must not expose credential material.

Authentication failure never updates last-used timestamps.

Credential hashes and signing secrets never appear in audit values.

## 16. Human Management Authorization

Integration Centre management routes require:

- employee authentication
- active organization context
- relevant integration permission

Machine credentials cannot call human credential-management routes.

Human management permissions do not grant machine access to business routes.

## 17. Tenant Isolation

Tenant isolation applies to:

- clients
- owners
- credentials
- scope assignments
- endpoints
- subscriptions
- integration events
- deliveries
- attempts
- authentication
- listing
- filtering
- retry operations
- auditing

Foreign resource identifiers return safe not-found responses.

No integration credential may supply or override organization ownership.

## 18. Secret Protection

Credential hashes are excluded from every API response.

Webhook signing secrets are encrypted at rest using an application encryption
key.

Encryption uses authenticated encryption.

The application stores:

- encrypted secret ciphertext
- initialization vector
- authentication tag
- key version

The raw webhook signing secret is displayed only during endpoint creation or
explicit rotation.

Application startup or secret operations fail clearly when required
encryption configuration is absent.

Secrets never appear in logs, audit records, delivery records or error
responses.

## 19. Outbound Webhook Endpoints

An organization may configure multiple outbound webhook endpoints.

Each endpoint records:

- organization ownership
- owning integration client
- display name
- HTTPS destination URL
- encrypted signing secret
- signing-secret key version
- active or disabled status
- optional description
- creation and update timestamps
- creator context where available

Endpoint responses never expose:

- encrypted secret material
- initialization vectors
- authentication tags
- secret hashes
- encryption-key metadata beyond a safe key-version identifier

A newly generated signing secret is returned only once.

## 20. Webhook Endpoint URL Security

Webhook destinations are security-sensitive.

Production destinations must use HTTPS.

Destination validation rejects:

- embedded usernames or passwords
- URL fragments
- loopback addresses
- private-network addresses
- link-local addresses
- multicast addresses
- unspecified addresses
- cloud-instance metadata addresses
- unsupported ports where policy prohibits them
- malformed or excessively long URLs

Hostname resolution must be checked before delivery.

The resolved delivery address must remain public and allowed.

Redirects are not followed automatically.

Delivery protection must account for DNS rebinding by validating the resolved
destination used for each attempt.

Runtime acceptance uses an injected delivery transport and does not require
unsafe localhost exceptions in production validation.

## 21. Webhook Event Registry

Webhook subscriptions use registered event types.

Event names are stable, normalized identifiers such as:

- `work_item.created`
- `work_item.updated`
- `request.created`
- `request.updated`
- `document.created`
- `organization_user.updated`
- `hierarchy.assignment.created`
- `audit.export.completed`

Arbitrary unregistered event names are rejected.

Each registered event type defines:

- event name
- description
- payload version
- supported entity type
- whether external publication is enabled
- required publisher permission or internal capability
- maximum payload classification

The registry is provider-neutral.

## 22. Webhook Subscriptions

A webhook subscription connects:

- one organization
- one active webhook endpoint
- one registered event type

Subscriptions support active and inactive states.

The same endpoint cannot contain duplicate active subscriptions for the same
event type.

Subscription changes are audited.

Disabling a subscription prevents creation of future deliveries without
removing historical delivery records.

## 23. Integration Events

An integration event is an immutable organization-owned outbox record.

Each event records:

- organization
- registered event type
- payload version
- entity type
- optional entity identifier
- redacted payload
- occurrence time
- publication time
- optional idempotency key
- deterministic payload hash
- originating user or organization membership where available
- audit correlation and request identifiers where available

Publishing an event creates delivery records for active matching
subscriptions in the same transaction.

An event is not a substitute for the source business record.

## 24. Event Payload Safety

Webhook payloads contain the minimum information required for the registered
event contract.

Payload generation applies sensitive-value redaction.

Payloads never contain:

- passwords
- credential plaintext
- signing secrets
- authorization headers
- cookies
- access or refresh tokens
- encryption keys
- internal storage credentials
- unrestricted audit snapshots
- data outside the owning organization

Payload size is bounded before persistence and delivery.

## 25. Event Idempotency

Publishers may provide an idempotency key.

The database enforces uniqueness for:

- organization
- event type
- idempotency key

Repeating the same idempotency key with the same canonical payload returns the
existing event and deliveries.

Repeating the same key with materially different event identity or payload is
rejected as an idempotency conflict.

Concurrent identical publication persists one event outcome.

## 26. Webhook Deliveries

A webhook delivery represents one integration event sent to one endpoint.

Delivery states are:

- `PENDING`
- `PROCESSING`
- `DELIVERED`
- `FAILED`
- `DEAD_LETTER`
- `CANCELLED`

The database prevents duplicate delivery records for the same event and
endpoint.

Delivery records preserve:

- event
- endpoint
- organization
- current state
- attempt count
- next-attempt time
- lease owner and lease expiry where applicable
- last HTTP status
- sanitized last error
- first-attempt time
- delivered time
- terminal time
- creation and update timestamps

Historical delivery records remain available after endpoint disablement.

## 27. Delivery Attempts

Every actual outbound request creates a delivery-attempt record.

An attempt records:

- delivery
- organization
- attempt number
- start and completion time
- result
- HTTP status where available
- response duration
- sanitized error category and message
- response-body summary only where explicitly safe
- request timestamp used for signing

Response headers and bodies are bounded.

Secrets and sensitive remote response content are never persisted.

Attempt history is append-oriented.

## 28. Delivery Claiming and Concurrency

Workers claim eligible deliveries safely.

Claiming must prevent two workers from sending the same attempt concurrently.

The implementation may use:

- atomic conditional updates
- transaction-scoped row locking
- `FOR UPDATE SKIP LOCKED`
- bounded leases with expiration recovery

A claimed delivery moves to `PROCESSING`.

Expired leases may be recovered safely.

Attempt numbers remain unique per delivery.

## 29. Webhook Signing

Outbound webhook requests are signed using HMAC-SHA-256.

Delivery headers include:

- `X-Ornexis-Event-Id`
- `X-Ornexis-Delivery-Id`
- `X-Ornexis-Event-Type`
- `X-Ornexis-Timestamp`
- `X-Ornexis-Signature`
- `Content-Type: application/json`

The signature input is:

`timestamp + "." + rawRequestBody`

The signature header uses an explicit version:

`v1=<lowercase hexadecimal digest>`

The exact raw body sent over HTTP is the body used for signature generation.

Retries preserve the event payload but use a fresh attempt timestamp and
signature.

## 30. Delivery Success and Failure

HTTP status codes from 200 through 299 represent successful delivery.

Successful delivery moves the record to `DELIVERED`.

Other HTTP responses and transport failures are classified safely.

Failure records contain enough operational context for investigation without
exposing credentials or sensitive payload data.

Remote response content is never trusted as safe user-facing text.

## 31. Retry Policy

Failed deliveries use bounded retry handling.

The initial retry schedule is:

- one minute
- five minutes
- fifteen minutes
- one hour
- six hours

After the configured maximum attempts, the delivery moves to `DEAD_LETTER`.

Retry scheduling is deterministic from the completed attempt time.

Disabled endpoints do not receive new attempts.

Already delivered records are never retried.

Manual replay is outside this sprint unless explicitly introduced through a
separately authorized and audited operation.

## 32. Delivery Worker

Sprint 024 provides a bounded delivery worker.

The worker:

- loads eligible deliveries
- claims a limited batch
- decrypts the endpoint secret only when required
- validates the destination again
- signs the exact payload
- performs the outbound request through an injectable transport
- records one attempt
- updates delivery state
- schedules retry where appropriate
- clears or expires its lease safely

One failed delivery does not prevent processing of unrelated deliveries.

The worker has a command-line job entry point suitable for scheduled
execution.

## 33. Integration API Authentication

Machine authentication is separate from employee JWT authentication.

A valid integration credential establishes:

- integration-client identity
- organization identity
- credential identity
- assigned scope codes
- active and expiry state

Machine requests do not impersonate an employee.

Integration authentication rejects:

- unknown credentials
- malformed credentials
- expired credentials
- revoked credentials
- suspended clients
- cross-organization context
- missing required scopes

Credential comparison uses stored hashes and timing-safe behavior where
practical.

Successful and denied security-significant authentication activity is
auditable without recording credential plaintext.

## 34. Rate and Abuse Controls

Integration requests and event publication are bounded.

The foundation supports limits for:

- request body size
- event payload size
- client credential count
- endpoint count
- subscription count
- list size
- export size where applicable
- worker batch size
- retry count
- stored response summary size

Rate-limit policy is enforced at the integration boundary where introduced.

Rate limiting must remain tenant-aware and client-aware.

## 35. Integration Observability

Authorized users may inspect:

- client status
- credential status and expiry
- endpoint status
- subscription configuration
- event publication state
- delivery status
- attempt count
- next retry time
- last safe error
- delivery-attempt history
- last successful delivery

Operational responses never expose stored secrets or raw credential hashes.

## 36. Auditability

Sprint 024 audits significant integration actions, including:

- client creation and update
- client suspension and revocation
- credential issuance
- credential revocation
- scope assignment and removal
- webhook endpoint creation and update
- webhook secret rotation
- subscription creation and removal
- event publication
- terminal delivery failure
- successful delivery where operationally appropriate
- denied machine authentication where safe attribution exists

Audit events use the Sprint 023 integration category and source where
appropriate.

Audit snapshots are redacted.

## 37. Append-Oriented History

Integration events, deliveries and delivery attempts are historical records.

Ordinary API operations do not update or delete their immutable identity or
history.

Configuration records may be disabled or revoked.

Deleting a configuration must not remove historical event or delivery
evidence.

Retention and archival remain future controlled capabilities.


## 38. Data Model

Sprint 024 introduces the following primary records:

- `IntegrationClient`
- `IntegrationCredential`
- `IntegrationClientPermission`
- `WebhookEndpoint`
- `WebhookSubscription`
- `IntegrationEvent`
- `WebhookDelivery`
- `WebhookDeliveryAttempt`

Supporting enums define:

- integration-client status
- integration-credential status
- webhook-endpoint status
- webhook-subscription status
- integration-event publication source
- webhook-delivery status
- webhook-attempt result

All organization-owned integration records carry explicit organization
identity.

Where practical, compound foreign keys enforce that related records belong to
the same organization.

## 39. Integration Client Model

An integration client records:

- ID
- organization ID
- normalized unique code
- name
- optional description
- status
- optional external-system identifier
- optional metadata
- created-by organization-user ID
- created time
- updated time
- suspended time
- revoked time

Client codes are unique within an organization.

Client identity cannot move between organizations.

Revocation is terminal.

## 40. Integration Credential Model

An integration credential records:

- ID
- organization ID
- integration-client ID
- public credential prefix
- credential hash
- name
- status
- expiry time
- last-used time
- created time
- revoked time
- creator organization-user ID

Credential plaintext is never persisted.

Credential prefixes support safe operational identification without revealing
the secret.

The database enforces global uniqueness of credential prefixes and hashes.

A client may have multiple credentials to support safe rotation.

## 41. Integration Scope Model

Integration scopes reuse registered platform permissions marked as externally
assignable.

`IntegrationClientPermission` records:

- organization
- integration client
- permission
- assigning organization user
- assignment time

The same permission cannot be assigned to one client more than once.

Organization isolation is enforced when assigning scopes.

Human role permissions and integration-client scopes remain separate
authorization domains.

## 42. Webhook Configuration Models

`WebhookEndpoint` records:

- organization
- integration client
- name
- destination URL
- encrypted signing secret
- initialization vector
- authentication tag
- encryption-key version
- status
- optional description
- creator
- timestamps
- last successful delivery time

`WebhookSubscription` records:

- organization
- endpoint
- registered event type
- payload version
- status
- creator
- timestamps

Endpoint names are unique per integration client.

Event subscriptions are unique per endpoint and event type.

## 43. Event and Delivery Models

`IntegrationEvent` records immutable publication identity and payload.

`WebhookDelivery` records current delivery state for one event-endpoint pair.

`WebhookDeliveryAttempt` records append-oriented execution history.

The event payload stored in the outbox is the canonical payload delivered to
subscribers.

The event record stores a deterministic payload hash.

Delivery uniqueness is enforced across:

- organization
- event
- endpoint

Attempt uniqueness is enforced across:

- delivery
- attempt number

## 44. Database Constraints and Indexes

The database enforces where practical:

- nonblank client code and name
- nonblank credential name and prefix
- valid client and credential status
- unique organization-client code
- unique credential prefix
- unique organization-client-permission assignment
- nonblank endpoint name and URL
- unique client-endpoint name
- unique endpoint-event subscription
- nonblank event type
- valid lowercase event-name format
- unique organization-event-type-idempotency key
- valid lowercase SHA-256 payload hash
- unique event-endpoint delivery
- nonnegative attempt count
- positive attempt number
- unique delivery-attempt number
- valid HTTP status range
- organization-safe compound references

Indexes support:

- organization client listing
- active credential lookup
- credential-prefix authentication
- client scope loading
- active endpoint listing
- active event subscription matching
- event investigation by organization and time
- idempotency lookup
- eligible delivery claiming
- delivery status and retry inspection
- endpoint delivery history
- attempt history

Database constraints complement service authorization and validation.

## 45. Management API Routes

Sprint 024 provides human-administration routes under:

`/integrations`

Client routes:

- `GET /integrations/clients`
- `POST /integrations/clients`
- `GET /integrations/clients/:id`
- `PATCH /integrations/clients/:id`
- `POST /integrations/clients/:id/suspend`
- `POST /integrations/clients/:id/activate`
- `POST /integrations/clients/:id/revoke`

Credential routes:

- `GET /integrations/clients/:id/credentials`
- `POST /integrations/clients/:id/credentials`
- `POST /integrations/credentials/:id/revoke`

Scope routes:

- `GET /integrations/clients/:id/scopes`
- `PUT /integrations/clients/:id/scopes`

Webhook endpoint routes:

- `GET /integrations/webhook-endpoints`
- `POST /integrations/webhook-endpoints`
- `GET /integrations/webhook-endpoints/:id`
- `PATCH /integrations/webhook-endpoints/:id`
- `POST /integrations/webhook-endpoints/:id/disable`
- `POST /integrations/webhook-endpoints/:id/activate`
- `POST /integrations/webhook-endpoints/:id/rotate-secret`

Subscription routes:

- `GET /integrations/webhook-endpoints/:id/subscriptions`
- `PUT /integrations/webhook-endpoints/:id/subscriptions`

Observability routes:

- `GET /integrations/events`
- `GET /integrations/events/:id`
- `GET /integrations/deliveries`
- `GET /integrations/deliveries/:id`
- `GET /integrations/deliveries/:id/attempts`

Static route segments are registered before parameterized routes.

## 46. Publication and Machine Routes

Authorized internal publication is exposed through:

- `POST /integrations/events`

This operation requires `integrations.publish`.

Machine-authenticated foundation routes are registered separately under:

`/integration-api`

Sprint 024 provides:

- `GET /integration-api/me`

This endpoint verifies machine authentication and returns safe client identity
and assigned scope codes.

It does not expose credential hashes, secret material or human-user identity.

Business-module machine endpoints are introduced progressively in future
sprints and reuse the same authentication and scope middleware.

## 47. Route Permissions

Management routes require:

- `integrations.view` for client and configuration discovery
- `integrations.manage` for client lifecycle
- `integrations.credentials` for credential issuance and revocation
- `integrations.webhooks` for endpoint and subscription management
- `integrations.deliveries` for events, deliveries and attempt history
- `integrations.publish` for authorized manual or internal event publication

Credential issuance requires both:

- `integrations.manage`
- `integrations.credentials`

Webhook secret rotation requires both:

- `integrations.webhooks`
- `integrations.credentials`

Event publication does not grant delivery-history access.

Permission checks never replace tenant validation.

## 48. List and Pagination Behavior

Integration lists are bounded and deterministic.

Supported list filters include relevant combinations of:

- status
- client ID
- endpoint ID
- event type
- entity type
- entity ID
- delivery status
- created-from time
- created-to time
- search
- cursor
- limit

Default list limit:

`50`

Maximum list limit:

`200`

Ordering uses descending creation time and descending ID unless a route
documents another deterministic order.

Cursor pagination returns no duplicates or omissions.

Malformed and foreign cursors expose no foreign records.

## 49. Request Validation

Validation rejects:

- unknown request properties
- malformed UUIDs
- blank names and codes
- invalid normalized codes
- unsupported statuses
- invalid state transitions
- excessive identifier lengths
- excessive metadata
- invalid expiry times
- unassignable integration scopes
- foreign scope identifiers
- unsafe endpoint URLs
- unregistered event types
- unsupported payload versions
- oversized event payloads
- malformed idempotency keys
- invalid date ranges
- invalid list limits
- malformed cursors

Organization ownership is derived from authenticated context.

Client-supplied organization ownership is rejected.

## 50. Response Safety

API responses use the established envelope containing:

- `success`
- `data`
- `message` where appropriate

Credential creation returns plaintext only in the successful creation response.

Endpoint creation and secret rotation return signing-secret plaintext only in
the successful creation or rotation response.

Subsequent reads expose safe summaries only.

Responses never expose:

- credential hashes
- encrypted secrets
- encryption initialization vectors
- authentication tags
- internal lease tokens
- unrestricted delivery payloads
- raw remote response bodies
- internal stack traces

## 51. Error Behavior

Integration service errors map consistently:

- invalid input returns `400`
- missing authentication returns `401`
- missing permission or scope returns `403`
- missing or foreign records return `404`
- duplicate identity or idempotency conflict returns `409`
- invalid lifecycle transition returns `409`
- rate-limit rejection returns `429`
- unavailable integration-secret configuration returns `503`
- unexpected failures return `500`

Foreign-resource responses are non-disclosing.

Secrets never appear in error messages.

## 52. Compatibility Requirements

Sprint 024 must preserve compatibility with:

- employee JWT authentication
- active organization-context middleware
- human RBAC
- audit creation and querying
- organization administration
- Contacts
- Documents
- Work Items
- Request Centre
- Workflow and approvals
- SLA
- Attention Centre
- Organization Health
- Command Centre
- Daily Brief
- KPI framework
- entity relationships
- entity attachments
- configurable organizational hierarchy
- dashboard

Existing APIs do not require integration credentials.

Existing business modules remain provider-neutral.

## 53. Explicitly Deferred Capabilities

Sprint 024 does not yet provide:

- inbound webhook processing
- OAuth authorization-server behavior
- OAuth provider connections
- browser-based third-party authorization
- vendor-specific adapters
- M-Pesa integration
- bank or payment-gateway integration
- email or SMS provider integration
- identity-provider federation
- automatic publication from every platform mutation
- end-user webhook-payload customization
- arbitrary custom JavaScript transformations
- unrestricted custom headers
- manual dead-letter replay
- webhook deletion that removes delivery history
- customer-managed encryption keys
- distributed queue infrastructure
- full Integration Centre frontend
- full platform-wide rate-limiting product

These capabilities may build on this foundation in later sprints.

## 54. Runtime Acceptance Coverage

Sprint 024 runtime acceptance must verify:

- integration permissions exist
- authentication and organization context are required
- integration permissions are independently enforced
- integration clients are tenant-isolated
- client codes are normalized and unique per organization
- client lifecycle transitions are valid
- revoked clients cannot be reactivated
- credential plaintext is returned once
- credential plaintext is never stored
- credential prefixes are safe and unique
- multiple credentials support rotation
- expired credentials are rejected
- revoked credentials are rejected
- suspended and revoked clients cannot authenticate
- successful machine authentication returns safe identity
- integration scopes are independently enforced
- only externally assignable permissions may become scopes
- cross-tenant scope assignment is rejected
- credential usage updates safely
- credential secrets never appear in audit records
- endpoint signing secrets are encrypted at rest
- endpoint signing-secret plaintext is returned once
- signing-secret rotation invalidates prior secret use
- unsafe webhook URLs are rejected
- endpoint configuration is tenant-isolated
- registered event subscriptions work
- unregistered event subscriptions are rejected
- duplicate subscriptions are rejected
- disabled subscriptions create no new deliveries
- event publication is tenant-isolated
- event payload redaction works
- event payload limits are enforced
- idempotent retry returns the existing event
- changed-payload idempotency conflicts are rejected
- concurrent identical publication persists one event
- matching subscriptions create one delivery each
- delivery claiming prevents concurrent duplicate attempts
- outbound payload signatures verify
- retries use fresh timestamps and signatures
- 2xx responses produce delivered state
- failed responses schedule deterministic retries
- maximum attempts produce dead-letter state
- disabled endpoints receive no new attempts
- delivery attempt history is append-oriented
- delivery errors and responses are bounded and sanitized
- delivery and attempt queries are bounded
- deterministic cursor pagination has no duplicates or omissions
- foreign event and delivery records are non-disclosing
- client, credential, scope and webhook mutations are audited
- successful and terminal delivery outcomes are auditable
- integration reads create no records
- no destructive historical delivery routes exist
- existing audit endpoint remains compatible
- existing Contact endpoint remains compatible
- existing Document endpoint remains compatible
- existing Work Item endpoint remains compatible
- existing Request endpoint remains compatible
- existing Workflow endpoint remains compatible
- existing Organization Health endpoint remains compatible
- existing Command Centre endpoint remains compatible
- existing Daily Brief endpoint remains compatible
- existing KPI endpoint remains compatible
- existing relationship endpoint remains compatible
- existing hierarchy endpoint remains compatible
- existing dashboard endpoint remains compatible
- temporary acceptance fixtures are cleaned
- Prisma validation passes
- Prisma Client generation passes
- TypeScript compilation passes
- migration status is current
- diff validation passes

## 55. Implementation Sequence

Implementation proceeds in this order:

1. extend the permission and integration Prisma models
2. create and review schema migration
3. create integration permissions
4. implement integration types and validation
5. implement secret generation, hashing and encryption
6. implement client lifecycle
7. implement credential lifecycle and machine authentication
8. implement externally assignable scope management
9. implement webhook endpoint and subscription management
10. implement event registry and payload safety
11. implement idempotent transactional event publication
12. implement signing and destination security
13. implement concurrency-safe delivery claiming
14. implement attempts, retries and dead-letter behavior
15. implement management controllers and routes
16. implement machine-authenticated routes
17. implement delivery worker job
18. implement bounded investigation queries
19. create runtime acceptance
20. run compatibility and regression checks
21. record implementation evidence
22. commit and push

## 56. Completion Criteria

Sprint 024 is complete only when:

- the Prisma schema is valid
- migrations apply cleanly
- Prisma Client generation succeeds
- TypeScript compilation succeeds
- diff validation succeeds
- integration permissions exist
- integration clients and credentials are tenant-isolated
- credential and webhook secrets are protected
- machine authentication and scope enforcement work
- webhook endpoint security validation works
- registered subscriptions work
- event publication is transactional and idempotent
- delivery claiming is concurrency-safe
- HMAC signing works
- retry and dead-letter behavior works
- delivery observability is bounded and non-disclosing
- significant integration operations are audited
- runtime acceptance passes
- existing API smoke tests remain green
- implementation evidence is recorded
- the work is committed and pushed

Implementation evidence, not this specification alone, determines completion.

---

## 57. Implementation Evidence

Sprint 024 runtime acceptance passed on 2026-09-12.

Verified capabilities:

- `integrations.view`, `integrations.manage`, `integrations.credentials`, `integrations.webhooks`, `integrations.deliveries` and `integrations.publish` RBAC
- authenticated and organization-context-protected human integration access
- active organization-membership enforcement
- tenant-isolated integration persistence and querying
- normalized tenant-scoped integration-client identity
- integration-client uniqueness enforcement
- active, suspended and terminal revoked client lifecycle
- dedicated machine-to-machine authentication
- one-time integration credential disclosure
- SHA-256 credential hashing without plaintext persistence
- credential expiry and revocation enforcement
- immediate machine-access blocking after client suspension or revocation
- explicitly integration-assignable machine scopes
- rejection of ordinary human permissions as machine scopes
- encrypted webhook signing secrets using AES-256-GCM
- one-time webhook-secret disclosure
- webhook-secret rotation
- safe operational responses without credential hashes or encrypted-secret internals
- HTTPS-only webhook destinations
- private, loopback, link-local and metadata-address rejection
- bracketed IPv6 destination normalization
- DNS-based public-address enforcement
- registered provider-neutral webhook event types
- deterministic webhook subscription identity
- unregistered event-subscription rejection
- transactional integration event and delivery creation
- recursive sensitive-value redaction
- deterministic event payload hashing
- sequential and concurrent event idempotency
- conflicting idempotency-key rejection
- registered event/entity compatibility validation
- disabled-endpoint delivery exclusion
- atomic delivery claiming with expiring leases
- safe concurrent webhook workers
- canonical webhook payload envelopes
- HMAC-SHA256 webhook signing
- event, delivery and timestamp signature headers
- signature verification and changed-payload rejection
- append-oriented webhook delivery attempts
- deterministic exponential retry scheduling
- fresh timestamps and signatures for every retry
- bounded delivery processing batches
- successful delivery completion
- terminal dead-letter handling after retry exhaustion
- prevention of terminal-delivery reprocessing
- exactly-once successful-delivery auditing
- exactly-once terminal-failure auditing
- historical delivery preservation after endpoint rotation and disablement
- bounded deterministic integration-event listing
- bounded deterministic webhook-delivery listing
- opaque cursor support
- strict integration query validation
- tenant-safe event and delivery retrieval
- foreign-record non-disclosure
- ordered delivery-attempt history
- read-only integration observability APIs
- append-oriented event and delivery history without update or delete routes
- existing Contact endpoint compatibility
- existing Document endpoint compatibility
- existing Work Item endpoint compatibility
- existing Request endpoint compatibility
- existing Workflow endpoint compatibility
- existing Organization Health endpoint compatibility
- existing Command Centre endpoint compatibility
- existing Daily Brief endpoint compatibility
- existing KPI endpoint compatibility
- existing comprehensive audit endpoint compatibility
- existing entity-relationship endpoint compatibility
- existing hierarchy endpoint compatibility
- existing dashboard endpoint compatibility
- temporary acceptance fixture cleanup
- Prisma schema validation
- Prisma Client generation
- migration-status validation
- TypeScript compilation
- staged-diff validation

Acceptance command:

`npm run integration:acceptance`

Required acceptance environment:

- `INTEGRATION_SECRET_ENCRYPTION_KEY`
- `INTEGRATION_SECRET_KEY_VERSION`

Acceptance result:

`SPRINT 024 RUNTIME ACCEPTANCE: PASS`
