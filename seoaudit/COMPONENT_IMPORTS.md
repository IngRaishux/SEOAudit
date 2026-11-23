# Component Imports - Migration Guide

## Shared UI Components Location

Components moved to `@seo-optimizer/ui` package.

### Updated Imports

**Before (from apps/web/components):**
```typescript
import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { Dialog, DialogContent, DialogTrigger } from "@/components/Dialog"
import { BackButton } from "@/components/BackButton"
import { SessionProvider } from "@/components/SessionProvider"
```

**After (from @seo-optimizer/ui):**
```typescript
import { 
  Button, 
  Input, 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  BackButton, 
  SessionProvider 
} from "@seo-optimizer/ui"
```

### Import Patterns

**All Dialog subcomponents:**
```typescript
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@seo-optimizer/ui"
```

**Button variants:**
```typescript
import { Button, type ButtonProps } from "@seo-optimizer/ui"

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
```

**Input types:**
```typescript
import { Input, type InputProps } from "@seo-optimizer/ui"

<Input type="text" placeholder="Text" />
<Input type="password" placeholder="Password" />
<Input type="search" placeholder="Search" />
```

### Utils from @seo-optimizer/ui

Style utilities also available from the shared package:

```typescript
import { cx, focusRing, focusInput, hasErrorInput } from "@seo-optimizer/ui"
```

Previously from `@/lib/utils`, now centralized in UI package.

## Files Changed

This document tracks all files that had imports updated.

### apps/web/app/**
- [ ] api/auth/[...nextauth]/route.ts
- [ ] api/register/route.ts
- [ ] api/organizations/[orgId]/route.ts
- [ ] dashboard/page.tsx
- [ ] layout.tsx
- [ ] login/page.tsx
- [ ] page.tsx
- [ ] register/page.tsx

### apps/web/components/**
- [ ] CreateOrganizationForm.tsx
- [ ] DashboardContent.tsx
- [ ] DeleteOrganizationDialog.tsx
- [ ] DeleteSiteDialog.tsx
- [ ] DialogSugestion.tsx
- [ ] Header.tsx
- [ ] HydrateCrawl.tsx
- [ ] LoginForm.tsx
- [ ] OrganizationSelector.tsx
- [ ] OrganizationSettings.tsx
- [ ] RegisterForm.tsx
- [ ] SERPPreview.tsx
- [ ] SignOutButton.tsx
- [ ] SiteDetailsTabs.tsx
- [ ] SwitchOrgButton.tsx

### apps/web/lib/**
- [ ] auth/*.ts (if importing components)
- [ ] utils/* (if re-exporting components)

## Verification Checklist

- [ ] All Button imports use `@seo-optimizer/ui`
- [ ] All Input imports use `@seo-optimizer/ui`
- [ ] All Dialog imports use `@seo-optimizer/ui` (including Dialog subcomponents)
- [ ] BackButton imports from `@seo-optimizer/ui`
- [ ] SessionProvider imports from `@seo-optimizer/ui`
- [ ] No imports from `@/components/{Button,Input,Dialog,BackButton,SessionProvider}`
- [ ] Build succeeds: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] Dev server starts: `npm run dev`

## Notes

- Old component files in `apps/web/components/{Button,Input,Dialog,BackButton,SessionProvider}.tsx` can be deleted after migration
- Update `CLAUDE.md` and `AGENTS.md` to reflect new import paths
- Document this change in git commit message

## Related Files

- `packages/ui/README.md` - Usage examples
- `packages/ui/src/index.ts` - Exports list
- `apps/web/package.json` - Dependencies include `@seo-optimizer/ui`
