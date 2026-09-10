# Session Schema Migration

**Date**: September 10, 2026  
**Status**: ✅ Completed

## Overview

The user session schema has been updated to support multiple organizations per user with a cleaner, more scalable structure.

### Before Migration

```typescript
// Old schema - single organization per session
{
  user: {
    id: string;
    email: string;
    accountId: string; // One org ID
    organizationName: string; // One org name
    role: 'owner' | 'admin' | 'member'; // Role in that org
  }
}
```

### After Migration

```typescript
// New schema - all organizations per user
{
  user: {
    id: string;
    email: string;
    accountId: string; // First organization (default)
    organizations: Array<{
      id: string;
      name: string;
    }>; // All user's organizations
  }
}
```

## Key Changes

1. **Removed `organizationName`**: No longer a single string; now use `organizations` array
2. **Removed `role` from session**: Role is specific to a membership and fetched contextually
3. **Added `organizations` array**: Allows access to all user organizations without fetching

## Database Impact

**No changes to MongoDB data structures.** The migration only affects how data is presented in the session.

- ✅ Organizations table: Unchanged (still has `name`, `slug`, `createdByUserId`)
- ✅ Membership table: Unchanged (still has `role` per organization)
- ✅ Sites, Pages, Suggestions: Unchanged (still use `organizationId`)

## Files Modified

### Core Authentication
- `lib/auth/auth.ts` - JWT and session callbacks
- `types/next-auth.d.ts` - TypeScript definitions

### API Route Handlers
- `app/api/organizations/[orgId]/route.ts` - Removed session enrichment
- `app/api/sites/route.ts` - Removed session enrichment
- `app/api/crawl/route.ts` - Removed session enrichment
- `app/api/suggestions/route.ts` - Removed session enrichment

### Components
- `components/DialogSugestion.tsx` - Use `organizations[0].name`
- `app/sugerence/page.tsx` - Use `organizations[0].name`

## Migration Verification

### API Endpoint: GET /api/migrations/session-schema

Verify the migration status without authentication in development:

```bash
curl http://localhost:3000/api/migrations/session-schema
```

**Response includes:**
- Total memberships and validity status
- Total organizations and validity status
- Example users with their organizations array
- List of invalid relationships (if any)

### Example Response

```json
{
  "status": "success",
  "summary": {
    "totalMemberships": 3,
    "validMemberships": 3,
    "invalidMemberships": 0,
    "totalOrganizations": 2,
    "validOrganizations": 2,
    "totalUsersWithOrganizations": 2
  },
  "details": {
    "exampleUsers": [
      {
        "userId": "user123",
        "organizations": [
          { "id": "org456", "name": "My Organization" },
          { "id": "org789", "name": "Another Org" }
        ]
      }
    ]
  }
}
```

## Cleanup Invalid Data

If there are orphaned memberships (user with membership to deleted org):

```bash
curl -X POST http://localhost:3000/api/migrations/session-schema \
  -H "Content-Type: application/json" \
  -d '{"action":"cleanup-invalid-memberships"}'
```

## How the New Schema Works

### Session Building

When a user logs in:

1. **JWT Callback** (`lib/auth/auth.ts`):
   - Fetches ALL memberships for the user: `Membership.find({ userId })`
   - For each membership, fetches the organization data
   - Builds: `token.organizations = [{ id, name }, ...]`
   - Sets `token.accountId = memberships[0].organizationId` (first org as default)

2. **Session Callback** (`lib/auth/auth.ts`):
   - Applies the same logic: fetches all organizations
   - Sets `session.user.organizations` as an array
   - Sets `session.user.accountId` to the default organization

### Accessing Organization Info

**Get the default organization:**
```typescript
const { session } = useSession();
session.user.organizations[0].name; // First org name
session.user.accountId; // First org ID
```

**Get all organizations:**
```typescript
const { session } = useSession();
session.user.organizations.map(org => ({
  id: org.id,
  name: org.name,
}));
```

**Get user's role in a specific org:**
```typescript
// Role is NOT in the session anymore
// Fetch it specifically when needed:
const membership = await Membership.findOne({
  userId: session.user.id,
  organizationId: orgId,
});
const role = membership.role; // 'owner' | 'admin' | 'member'
```

## Backward Compatibility

**This is a breaking change.** Any client code using:
- `session.user.organizationName` ❌
- `session.user.role` ❌

Must be updated to:
- `session.user.organizations[0].name` ✅
- Fetch role from DB when needed ✅

All impacted files have been updated:
- ✅ `DialogSugestion.tsx`
- ✅ `sugerence/page.tsx`
- ✅ All API route handlers

## Performance Implications

**Positive:**
- Users with multiple orgs can access all of them without additional DB queries
- Session data is self-contained
- No need to fetch org list separately

**Trade-offs:**
- Slightly larger JWT token (storing all org names)
- Multiple DB queries on first sign-in (one per organization)

**Mitigations:**
- JWT tokens are still reasonable size (typically < 5 orgs per user)
- First sign-in happens rarely; subsequent sessions use the JWT
- Org data is cached in the token until session expires

## Testing

To test the new schema:

1. **Login with a user:**
   ```typescript
   const { data: session } = useSession();
   console.log(session.user.organizations);
   ```
   Should output: `[{ id: "...", name: "..." }, ...]`

2. **Verify multiple orgs:**
   - Create a second organization
   - Switch between them in the navbar
   - Session should update automatically

3. **Verify role isolation:**
   - Role is shown in the dashboard but NOT in `session.user`
   - Fetch it from DB when needed (see Dashboard component)

## Rollback Plan

If needed to revert:

1. Revert to the previous commit
2. Clear user JWT tokens (they'll get new ones with old schema)
3. No DB migrations needed (data structure unchanged)

However, this is a recommended change that improves UX for multi-org users.

## Related Documentation

- `CHANGELOG_FASE1A.md` - Phase 1A overview (includes org improvements)
- `lib/auth/auth.ts` - JWT configuration
- `types/next-auth.d.ts` - Session type definitions

---

**Questions?** Check the session callbacks in `lib/auth/auth.ts` for implementation details.
