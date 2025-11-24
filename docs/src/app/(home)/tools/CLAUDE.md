# Adding Tools to Rybbit Docs (AI Agent Guide)

## Structure

All tools use `ToolPageLayout` with 6 sections: Header, Tool, Educational Content, FAQ, Related Tools, CTA.

## File Structure

```
/docs/src/app/(home)/tools/your-tool-name/
  YourToolForm.tsx  # Client component with tool logic
  page.tsx          # Page using ToolPageLayout
```

## Required ToolPageLayout Props

- `toolSlug`: URL identifier matching directory name
- `title`: Page title
- `description`: Brief description
- `toolComponent`: `<YourToolForm />`
- `educationalContent`: JSX with h2 sections (What is X?, How to Use, Best Practices)
- `faqs`: Array of `{question, answer}` (4-6 items, answer can be JSX)
- `relatedToolsCategory`: `"analytics" | "seo" | "privacy" | "social-media"`
- `ctaTitle`, `ctaDescription`, `ctaEventLocation`: CTA section

## Optional Props

- `badge`: `"Free Tool"` (default) or `"AI-Powered Tool"`
- `ctaButtonText`: Default `"Start tracking for free"`
- `structuredData`: JSON-LD object

## Styling

- Primary: `bg-emerald-600 hover:bg-emerald-500`
- Success: `bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800`
- Error: `bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800`
- Backgrounds: `bg-white dark:bg-neutral-900`
- Borders: `border-neutral-200 dark:border-neutral-800`
- Text: `text-neutral-900 dark:text-white` (headings), `text-neutral-700 dark:text-neutral-300` (body)

## CRITICAL Rules

1. **NO manual bullets** (`•`) in lists - component auto-styles them
2. Tool slug MUST match directory name
3. Educational content: h2 for sections, no h1
4. Keep metadata title <60 chars, description 150-160 chars
5. Include Rybbit integration in FAQs when relevant

## Common Patterns

```tsx
// Loading
const [isLoading, setIsLoading] = useState(false);
<button disabled={isLoading}>{isLoading ? "Processing..." : "Calculate"}</button>;

// Error
const [error, setError] = useState<string | null>(null);
{
  error && <div className="p-4 bg-red-50...">{error}</div>;
}

// Copy
await navigator.clipboard.writeText(result);
```

## API Routes (if needed)

Path: `/docs/src/app/api/tools/your-tool-name/route.ts`

- Use POST, validate with Zod, return JSON

---

# Multi-Platform Tools (Same Tool, Multiple Platforms)

For tools that are identical across platforms but with different branding (e.g., font generators for LinkedIn, Discord, X, etc.), use this pattern to avoid duplication.

## Structure

```
/docs/src/app/(home)/tools/
  components/
    YourToolComponent.tsx      # Shared tool logic
    platform-configs.ts        # Platform metadata
  (your-tool-group)/           # Route group (parentheses = hidden from URL)
    platform1-tool-name/
      page.tsx
    platform2-tool-name/
      page.tsx
```

**Example:** Font generators

```
/tools/
  components/
    FontGeneratorTool.tsx      # Shared font transformation logic
    platform-configs.ts        # All platform metadata
  (font-generators)/           # Route group (organized but not in URL)
    linkedin-font-generator/page.tsx
    discord-font-generator/page.tsx
    x-font-generator/page.tsx
```

## Step-by-Step

### 1. Create Shared Tool Component

```tsx
// components/YourToolComponent.tsx
"use client";

interface YourToolProps {
  platformName?: string;
  platformSpecificOption?: string;
}

export function YourTool({ platformName, platformSpecificOption }: YourToolProps) {
  // Your tool logic here
  return <div>Tool UI for {platformName}</div>;
}
```

### 2. Create Platform Config

```tsx
// components/platform-configs.ts
export interface PlatformConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  educationalContent: string;
  // Add platform-specific fields
}

export const platformConfigs: Record<string, PlatformConfig> = {
  platform1: {
    id: "platform1",
    name: "Platform One",
    displayName: "Platform One Tool Name",
    description: "Tool description for Platform One",
    educationalContent: "How this tool works on Platform One...",
  },
  platform2: {
    id: "platform2",
    name: "Platform Two",
    displayName: "Platform Two Tool Name",
    description: "Tool description for Platform Two",
    educationalContent: "How this tool works on Platform Two...",
  },
};

export const platformList = Object.values(platformConfigs);
```

### 3. Create Template Page

Create **one** page as a template in the route group:

```tsx
// (your-tool-group)/platform1-tool-name/page.tsx
import { ToolPageLayout } from "../../components/ToolPageLayout";
import { YourTool } from "../../components/YourToolComponent";
import { platformConfigs } from "../../components/platform-configs";
import type { Metadata } from "next";

const platform = platformConfigs.platform1;

export const metadata: Metadata = {
  title: `Free ${platform.displayName} | Description`,
  description: platform.description,
  // ... rest of metadata
};

const educationalContent = (
  <>
    <h2>About {platform.name}</h2>
    <p>{platform.educationalContent}</p>
  </>
);

export default function PlatformToolPage() {
  return (
    <ToolPageLayout
      toolSlug={`${platform.id}-tool-name`}
      title={platform.displayName}
      description={platform.description}
      toolComponent={<YourTool platformName={platform.name} />}
      educationalContent={educationalContent}
      faqs={[]}
      relatedToolsCategory="your-category"
      ctaTitle="CTA for this tool category"
      ctaDescription="CTA description"
      ctaEventLocation={`${platform.id}_tool_cta`}
    />
  );
}
```

### 4. Duplicate for All Platforms

Use bash to create copies for other platforms:

```bash
cd /docs/src/app/(home)/tools/(your-tool-group)

# Create directories and copy template
for platform in platform2 platform3 platform4; do
  mkdir -p "${platform}-tool-name"
  cp platform1-tool-name/page.tsx "${platform}-tool-name/page.tsx"

  # Replace platform ID in the file
  sed -i '' "s/platformConfigs.platform1/platformConfigs.${platform}/g" \
    "${platform}-tool-name/page.tsx"
done
```

### 5. Register Tools

**Main tools page:**

```tsx
// page.tsx
import { platformList } from "./components/platform-configs";

const yourTools = platformList.map(platform => ({
  href: `/tools/${platform.id}-tool-name`,
  icon: YourIcon,
  title: platform.displayName,
  description: `${platform.description}`,
}));
```

**Related tools:**

```tsx
// src/components/RelatedTools.tsx
const allTools: Tool[] = [
  // ... existing tools
  {
    name: "Platform1 Tool",
    description: "Description",
    href: "/tools/platform1-tool-name",
    category: "your-category",
  },
  // Add all other platforms...
];
```

## Benefits

- **1 shared component** instead of N duplicate components
- **Platform-specific data** centralized in one config file
- **Easy to add platforms:** Just add to config, create page, run duplication script
- **Route group keeps `/tools/` clean** - all platform pages organized in `(your-tool-group)/`
- **URLs unchanged:** Still `/tools/platform-tool-name` (route group doesn't appear in URL)

## When to Use This Pattern

✅ **Use for:**

- Same tool logic, different platform branding (font generators, link builders, etc.)
- Tools with 5+ platform variants
- Tools where platforms only differ in metadata/content

❌ **Don't use for:**

- Tools with platform-specific logic
- One-off tools
- Tools with <3 platform variants (just duplicate the page)
