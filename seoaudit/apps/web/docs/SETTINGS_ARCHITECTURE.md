# Settings Architecture

**Date**: September 10, 2026  
**Status**: ✅ Completed

## Overview

Settings are now organized into three distinct levels:
1. **User Settings** - Global preferences for the user
2. **Organization Settings** - Configuration for each organization
3. **Site Settings** - Crawl and performance settings per site

## Structure

```
/settings
├── / (User Settings)
├── /organization (Organization Settings)
└── /sites (Sites List & Site-specific Settings)
    └── /site/[siteId] (Individual Site Settings)
```

## User Settings

**Location**: `/settings`  
**Database Model**: `UserSettings`  
**Scope**: Per user (across all organizations)

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

**Location**: `/settings/organization`  
**Database Model**: `Organization` (existing)  
**Scope**: Per organization

### Managed Settings

- Organization name (editable by owner)
- Organization slug
- Organization deletion (owner only)

### Access Control

- **Owner**: Full edit access
- **Admin/Member**: Read-only access

## Site Settings

**Location**: `/settings/sites` (list) and `/settings/site/[siteId]` (details)  
**Database Model**: `SiteSettings`  
**Scope**: Per site within an organization

### Fields

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

### Crawl Configuration

- **Crawl Frequency**: How often to automatically crawl (manual, daily, weekly, monthly)
- **Max Pages**: Maximum pages to crawl per run
- **Follow Robots.txt**: Respect robots.txt rules
- **Check SSL**: Validate SSL certificates
- **Track Metrics**: Collect Core Web Vitals

### Exclusion Patterns

URLs matching these patterns won't be crawled. Examples:
- `/admin/*` - Exclude admin pages
- `/api/*` - Exclude API routes
- `*.json` - Exclude JSON files
- `*/cdn/*` - Exclude CDN assets

### API Endpoints

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

All settings pages share a common layout with navigation tabs:

```
Settings
├── [User Settings] Organization Sites
│   └── Account info, preferences
├── User Settings [Organization] Sites
│   └── Edit org, danger zone
└── User Settings Organization [Sites]
    └── Sites list, site-specific settings
```

The current tab is highlighted in blue.

## Navigation Flow

1. **User Settings**: Global preferences across all orgs
2. **Organization Settings**: Org-specific config + selector for multi-org users
3. **Sites Settings**: List of all sites in current org + links to site details

## Access Control

### User Settings
- ✅ User can edit their own settings
- ❌ No organization-level controls

### Organization Settings
- ✅ Owner: Full access
- ⚠️ Admin/Member: Read-only access

### Site Settings
- ✅ All members: Can view settings
- ✅ Owner/Admin: Can edit settings
- ⚠️ Member: Read-only (depending on role)

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

## Files Created

```
lib/models/
├── UserSettings.ts
└── SiteSettings.ts

app/settings/
├── layout.tsx (shared layout with tabs)
├── page.tsx (user settings)
├── organization/
│   └── page.tsx (organization settings)
├── sites/
│   └── page.tsx (sites list)
└── site/
    └── [siteId]/
        └── page.tsx (site-specific settings)

app/api/
├── user/settings/
│   └── route.ts
└── site-settings/
    └── [siteId]/
        └── route.ts
```

## Related Documentation

- `SESSION_SCHEMA_MIGRATION.md` - User session structure
- `CHANGELOG_FASE1A.md` - Organization and site setup
