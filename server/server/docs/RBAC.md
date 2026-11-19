# Role-based access control

All permissions are enforced by the API. Frontend route guards are usability controls only and are never an authorization boundary.

| Canonical role | Legacy role aliases | Scope |
|---|---|---|
| `SUPER_ADMIN` | `admin_general` | All records and administration |
| `ADMIN` | `admin` | Global operational administration, subordinate accounts |
| `REGIONAL_ADMIN` | `president_regional`, `Director_Regional`, `direction_regional` | Records whose `region` exactly matches the administrator |
| `PROVINCIAL_ADMIN` | `president_provincial`, `director_provincial`, `direction_provincial` | Records whose `province` exactly matches the administrator |
| `USER` | `user` | Own registration/profile capabilities; no administrative access |

## Permission catalogue

- `users:read`, `users:create`, `users:update`, `users:disable`
- `registrations:create`, `registrations:read`, `registrations:validate`
- `regions:manage`, `provinces:manage`, `provinces:read`
- `statistics:read`
- `admins:read`, `admins:create`, `admins:update`, `admins:disable`
- `settings:manage`
- `profile:read`, `profile:update`

## Geographic enforcement

Regional and provincial scope is derived from the authenticated administrator record in MongoDB. A client-supplied region or province is never treated as authority. Provincial administrators are restricted to their assigned province; regional administrators are restricted to their assigned region. Missing scope fails closed. Cross-scope access returns HTTP 403.

## Account provisioning

Only an authenticated administrator with `admins:create` can create subordinate accounts through the API. The first super administrator must be provisioned from the backend CLI. Public registration creates a pending registration record only; it does not create an administrator account.

## Legacy account migration

On a successful login, a legacy plaintext password is compared with the exact submitted value using a constant-time comparison. Only after a successful match is it hashed with bcrypt and the legacy `password` field unset. Incorrect values are never migrated. A legacy password shorter than the current 12-character policy is verified but is not automatically upgraded; the account must be reset by an authorized operator. Disabled accounts cannot authenticate.
