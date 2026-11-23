<!-- BEGIN:nextjs-agent-rules -->
# Agent Instructions for SEOAudit Development

## Project Overview

**SEOAudit** is a Next.js 16 SaaS application for web scraping and SEO analysis, with a self-hosted Crawl4AI integration. It's a **monorepo** managed by Turbo with separate packages for UI, types, crawler logic, and the main web application.

See `CLAUDE.md` for complete architecture documentation.

## Key Guidelines

### Code Structure

1. **Monorepo Architecture:**
   - `apps/web/` - Next.js SaaS application (Vercel)
   - `apps/crawler/` - Node.js crawler service (@seo-optimizer/crawler)
   - `packages/ui/` - Shared UI components (@seo-optimizer/ui)
   - `packages/types/` - Shared TypeScript types (@seo-optimizer/types)
   - `packages/config/` - Shared configuration

2. **Component Organization (Fully Refactored):**

   **Shared UI Components** → `packages/ui/` → `@seo-optimizer/ui`
   - Button, Input, Dialog (with variants), BackButton, SessionProvider
   - Reusable across projects, no business logic
   
   **App-Specific Components** → `apps/web/components/` (12 files)
   - Domain logic, models, services integration
   - Auth (LoginForm, RegisterForm), Orgs, Sites, etc.
   
   **✅ All 12 files already import from `@seo-optimizer/ui`:**
   ```typescript
   // This pattern is now standard throughout apps/web
   import { Button, Input, Dialog, DialogContent } from "@seo-optimizer/ui"
   import { DashboardContent } from "@/components/DashboardContent"
   ```
   
   See "Component Organization" section in CLAUDE.md for:
   - Full component inventory
   - When to move a component to shared UI
   - Import patterns and examples

### Next.js Version

This project uses **Next.js 16.2.5** with **App Router** (not Pages Router).

- Use `app/` directory structure, not `pages/`
- Server Components by default; add `'use client'` only when needed
- Route handlers in `app/api/route.ts` files
- Middleware in `middleware.ts` (root level)

### Database

**MongoDB** with **Mongoose 8**

- Schemas defined in `apps/web/lib/models/`
- Repositories pattern in `apps/web/lib/repositories/`
- NextAuth users managed by `@auth/mongodb-adapter`

### Authentication

**NextAuth v4.24.0**

- Credentials (email/password) + Google OAuth
- Sessions stored in MongoDB
- Middleware-based route protection (`apps/web/middleware.ts`)

### Crawler Integration

**Crawl4AI** self-hosted (Docker container on port 11235)

- HTTP client: `apps/crawler/src/crawler/crawl4ai-client.ts`
- Data extraction: `apps/crawler/src/crawler/extract.ts`
- HTML parsing: `apps/crawler/src/crawler/parse.ts`
- Environment variables: `CRAWL4AI_URL`, `CRAWL4AI_API_TOKEN`

### Multi-Tenancy

All data queries filter by `organizationId`:
- User creates organization on registration (automatic)
- Sites/Pages belong to organization
- Middleware validates ownership before serving data
- Always verify `organizationId` in Server Components

### Testing

- Run type checking: `npm run build`
- Run linter: `npm run lint`
- Test locally: `npm run dev` (starts web + crawler)
- MongoDB: `docker-compose up -d` (for local dev)

## Files You'll Touch Often

| File | Purpose |
|------|---------|
| `apps/web/app/api/**/route.ts` | API endpoints |
| `apps/web/lib/models/*.ts` | Database schemas |
| `apps/web/components/*.tsx` | App-specific UI (domain logic) |
| `packages/ui/src/components/*.tsx` | Shared UI components (generic, reusable) |
| `apps/crawler/src/crawler/*.ts` | Crawling logic |
| `apps/web/middleware.ts` | Route protection |
| `next.config.ts` | Next.js config (transpilePackages, etc.) |
| `CLAUDE.md` | Full architecture reference |
| `AGENTS.md` | These agent instructions |

## Monorepo Structure You Should Know

```
seoaudit (root)
├── apps/
│   ├── web/                # Next.js app (Vercel)
│   └── crawler/            # Node.js crawler service
├── packages/
│   ├── ui/                 # @seo-optimizer/ui (shared components)
│   ├── types/              # @seo-optimizer/types (shared types)
│   └── config/             # Shared config
├── package.json            # Workspaces config
├── turbo.json              # Turbo build orchestration
├── CLAUDE.md               # Architecture guide (THIS is the main reference)
└── AGENTS.md               # These instructions (you are here)
```

**Key Files:**
- `package.json` → `workspaces: ["apps/*", "packages/*"]` - npm workspaces setup
- `next.config.ts` → `transpilePackages: ["@seo-optimizer/ui", "@seo-optimizer/crawler"]`
- `CLAUDE.md` → "Monorepo Configuration" section for import troubleshooting

## Importing from Packages

**Always use the package name, not relative paths:**

```typescript
// ✅ CORRECT - uses npm workspace resolution
import { Button } from "@seo-optimizer/ui"
import { PageSeo } from "@seo-optimizer/types"

// ❌ WRONG - relative imports from other workspaces
import { Button } from "../../packages/ui/src/components/Button"
```

**Why?** Npm workspaces resolve `@seo-optimizer/*` → correct package,  allowing:
- Easier refactoring (can move packages without updating imports)
- Works in both dev and built environments
- IDE can find types correctly

## Commit Standards

- Write descriptive commit messages (explain WHY, not WHAT)
- Use conventional commits: `fix:`, `feat:`, `refactor:`, `docs:`
- Example: `feat: add canonical field fallback to full html extraction`

## When in Doubt

1. Check `CLAUDE.md` for architecture questions
2. Read `apps/web/docs/PROJECT.md` for detailed database/API docs
3. Read `apps/web/docs/CRAWLER_INTEGRATION.md` for crawler specifics
4. Check git log for similar changes
<!-- END:nextjs-agent-rules -->
