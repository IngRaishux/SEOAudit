# Settings Architecture

**Date**: September 10, 2026  
**Last Updated**: September 10, 2026  
**Status**: ✅ Restructured

## Overview

Settings are organized into two distinct modules with clear separation of concerns:

1. **User Settings** (`/settings`) - Global preferences for the user across all organizations
2. **Organization Settings** (`/organization-settings/[orgId]`) - Configuration for specific organization, accessible from dashboard

## Structure

```
Settings
├── /settings
│   └── page.tsx (User Settings only)
│
└── /organization-settings
    └── /[orgId]
        └── page.tsx (Organization Settings)
```

## Access Pattern

**User Settings:**
- Direct access: `/settings`
- No authentication required beyond login
- Accessible from any page

**Organization Settings:**
- Access via: Dashboard → Select Organization → Settings button
- Route: `/organization-settings/[orgId]`
- Context-aware: Only handles the selected organization
- Server-side validation of membership

## User Settings

**Location**: `/settings`  
**Database Model**: `UserSettings`  
**Scope**: Per user (global, across all organizations)  
**Access**: Direct, from any page

### Fields

```typescript
interface IUserSettings {
  userId: string;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  emailNotifications?: boolean;
  weeklyReport?: boolean;
}
```

### API Endpoints

- `GET /api/user/settings` - Fetch user settings
- `POST /api/user/settings` - Update user settings

### Use Cases

- Global theme preference
- Email notification preferences
- Language selection
- Weekly report subscription

## Organization Settings

**Location**: `/organization-settings/[orgId]`  
**Database Model**: `Organization` (existing)  
**Scope**: Per organization (one org at a time)  
**Access**: Via Dashboard → Settings button  
**Context**: Client component with server-side validation

### Managed Settings

- Organization name (editable by owner only)
- Organization slug (read-only)
- Organization deletion (owner only, danger zone)
- Role display (current user's role in org)

### Access Control

- **Owner**: 
  - Full edit access to organization name
  - Can delete organization
  - Delete confirmation required
- **Admin/Member**: 
  - Read-only access to organization details
  - Cannot edit or delete

### Data Flow

1. User clicks "Settings" in Dashboard
2. Navigates to `/organization-settings/[orgId]`
3. Client component fetches `/api/organizations/[orgId]/info`
4. Endpoint validates user membership
5. Returns organization + membership data
6. UI renders based on user role

## Site Settings

**Location**: Future implementation  
**Database Model**: `SiteSettings` (defined, not yet integrated)  
**Scope**: Per site within an organization  
**Status**: ⏳ Planned for Fase 1B

### Planned Features

```typescript
interface ISiteSettings {
  siteId: string;
  organizationId: string;
  crawlFrequency?: 'daily' | 'weekly' | 'monthly' | 'manual';
  maxPages?: number;
  followRobots?: boolean;
  checkSSL?: boolean;
  trackMetrics?: boolean;
  customHeaders?: Record<string, string>;
  excludePatterns?: string[];
}
```

### Planned Configuration

- **Crawl Frequency**: How often to automatically crawl (manual, daily, weekly, monthly)
- **Max Pages**: Maximum pages to crawl per run
- **Follow Robots.txt**: Respect robots.txt rules
- **Check SSL**: Validate SSL certificates
- **Track Metrics**: Collect Core Web Vitals
- **Exclusion Patterns**: URLs to skip during crawling

### Planned API Endpoints

- `GET /api/site-settings/[siteId]` - Fetch site settings
- `POST /api/site-settings/[siteId]` - Update site settings

## Database Schema

### UserSettings Collection

```json
{
  "_id": ObjectId,
  "userId": "string (unique)",
  "theme": "light|dark|system",
  "language": "string",
  "emailNotifications": boolean,
  "weeklyReport": boolean,
  "createdAt": Date,
  "updatedAt": Date
}
```

### SiteSettings Collection

```json
{
  "_id": ObjectId,
  "siteId": ObjectId (unique),
  "organizationId": ObjectId,
  "crawlFrequency": "daily|weekly|monthly|manual",
  "maxPages": number,
  "followRobots": boolean,
  "checkSSL": boolean,
  "trackMetrics": boolean,
  "customHeaders": Object,
  "excludePatterns": [string],
  "createdAt": Date,
  "updatedAt": Date
}
```

## Layout Structure

Clean separation between global and contextual settings:

**User Settings Page** (`/settings`)
```
/settings
└── User Preferences
    ├── Account Info (name, email, org count)
    ├── Theme (light/dark/system)
    ├── Notifications (email, weekly report)
    └── Save button
```

**Organization Settings Page** (`/organization-settings/[orgId]`)
```
/organization-settings/[orgId]
├── Header (org name, user role, back button)
├── Organization Settings
│   ├── Edit name (owner only)
├── Organization Information
│   ├── Name (read-only display)
│   ├── Slug (read-only display)
│   └── Your Role
└── Danger Zone (owner only)
    └── Delete Organization
```

## Navigation Flow

**To User Settings:**
1. Click profile menu
2. Select "Settings"
3. Lands on `/settings`

**To Organization Settings:**
1. On Dashboard, select organization
2. Click "Settings" button (next to Crawl New Site)
3. Navigates to `/organization-settings/[orgId]`
4. Server validates membership
5. Client renders org-specific settings

## Access Control

### User Settings (`/settings`)
- ✅ User can edit their own preferences
- ❌ No organization-level controls
- ✅ No authentication boundary (beyond login)

### Organization Settings (`/organization-settings/[orgId]`)
- ✅ **Owner**: 
  - Edit organization name
  - Delete organization
  - See all membership info
- ⚠️ **Admin/Member**: 
  - View organization details
  - Cannot edit or delete
  - Cannot manage members (Fase 1B feature)

### Site Settings (Future)
- **Planned Access**:
  - Owner/Admin: Full settings access
  - Member: Read-only view
  - Guest: No access

## Future Enhancements

1. **Shared Site Settings**: Allow sharing settings between similar sites
2. **Role-based Site Settings**: Different permissions per role
3. **Setting Templates**: Pre-configured crawl profiles
4. **Audit Log**: Track setting changes
5. **API Keys**: Generate API keys for automation
6. **Webhooks**: Notify on crawl completion or SEO issues
7. **Rate Limiting**: Per-site crawl rate limits
8. **Custom Rules**: Advanced crawl rules (JavaScript rendering, headers, etc.)

## Migration from Old Settings

The previous settings page (`/settings?org=orgId`) has been refactored:

**Before**:
- Single settings page mixed user and org settings
- Organization selector inline

**After**:
- Separated into three distinct tabs
- Clear hierarchy: User → Org → Sites
- Organization selector on each org-level page
- Site-specific settings on dedicated pages

**Backward Compatibility**: Old URL `/settings?org=orgId` now redirects to `/settings/organization?org=orgId`

## Files Structure

```
lib/models/
├── UserSettings.ts (user preferences)
└── SiteSettings.ts (future: site settings)

app/settings/
└── page.tsx (user settings only)

app/organization-settings/
└── [orgId]/
    └── page.tsx (organization settings)

app/api/
├── user/settings/
│   └── route.ts (GET/POST user settings)
├── organizations/[orgId]/
│   └── info/
│       └── route.ts (GET org info & memberships)
└── site-settings/
    └── [siteId]/
        └── route.ts (future)
```

## Previous Structure Removed

```
❌ app/settings/layout.tsx (no longer needed)
❌ app/settings/organization/ (moved to /organization-settings)
❌ app/settings/sites/ (planned for future)
❌ app/settings/site/[siteId]/ (planned for future)
```

## Implementation Details

### User Settings (`/settings`)
- **Client Component**: No
- **Server Component**: Yes
- **Data Source**: `GET /api/user/settings`
- **Mutations**: `POST /api/user/settings`
- **Authentication**: NextAuth session

### Organization Settings (`/organization-settings/[orgId]`)
- **Client Component**: Yes (with Suspense for useSearchParams)
- **Server Component**: No (Suspense boundary required)
- **Data Source**: `GET /api/organizations/[orgId]/info`
- **Mutations**: Via OrganizationSettings component
- **Authentication**: Membership validation in API

### API Endpoint: `/api/organizations/[orgId]/info`
```
GET /organizations/{orgId}/info
├── Validate: session.user.email exists
├── Resolve: userId from email if missing
├── Fetch: Memberships for user
├── Verify: User is member of orgId
├── Return:
│   ├── organization (id, name, slug)
│   ├── membership (role, orgId)
│   └── memberships (all orgs user belongs to)
└── Error Handling:
    ├── 401: No email or user not found
    ├── 403: User not member of org
    └── 404: Organization not found
```

## Migration from Old Structure

Old route hierarchy:
```
/settings
├── /organization (with multi-org selector)
└── /sites (with site list)
```

New route hierarchy:
```
/settings (user settings only)
/organization-settings/[orgId] (from dashboard)
```

**Why this change:**
- Clear separation: global user prefs vs. org-specific config
- Contextual access: org settings tied to dashboard context
- Better UX: no confusing tabs, direct navigation
- Scalable: site settings can follow same pattern

## Related Documentation

- `SESSION_SCHEMA_MIGRATION.md` - User session structure  
- `CHANGELOG_FASE1A.md` - Complete changelog of Fase 1A
