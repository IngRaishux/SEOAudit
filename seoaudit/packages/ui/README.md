# @seo-optimizer/ui

Shared UI component library for SEO Optimizer applications.

## Components

### Button
Versatile button component with multiple variants and loading states.

```tsx
import { Button } from "@seo-optimizer/ui"

<Button variant="primary">Click me</Button>
<Button variant="secondary" isLoading>Loading...</Button>
<Button variant="destructive">Delete</Button>
```

**Variants:** `primary`, `secondary`, `light`, `ghost`, `destructive`

### Input
Text input component with password toggle and search icon support.

```tsx
import { Input } from "@seo-optimizer/ui"

<Input type="text" placeholder="Enter text" />
<Input type="password" />
<Input type="search" />
```

### Dialog
Modal dialog component built on Radix UI primitives.

```tsx
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@seo-optimizer/ui"

<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <DialogTitle>Title</DialogTitle>
    <DialogDescription>Description</DialogDescription>
    <DialogFooter>
      <DialogClose>Cancel</DialogClose>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### BackButton
Navigation button for going back to previous page.

```tsx
import { BackButton } from "@seo-optimizer/ui"

<BackButton />
```

### SessionProvider
NextAuth SessionProvider wrapper for authentication.

```tsx
import { SessionProvider } from "@seo-optimizer/ui"

export default function RootLayout({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}
```

## Installation

```bash
npm install @seo-optimizer/ui
```

## Usage

Import components from the main package:

```tsx
import { Button, Input, Dialog, BackButton, SessionProvider } from "@seo-optimizer/ui"
```

Or import specific components:

```tsx
import { Button } from "@seo-optimizer/ui/button"
import { Input } from "@seo-optimizer/ui/input"
import { Dialog } from "@seo-optimizer/ui/dialog"
```

## Dependencies

- React 19+
- Next.js 16+
- NextAuth 4+
- Radix UI
- Tailwind CSS
- Tailwind Variants
- Remixicon

## Theming

All components support light/dark mode via Tailwind CSS `dark:` prefix and respect the system preference via `prefers-color-scheme`.
