# Adding a New Tool to Rybbit Docs

This guide explains how to add a new tool page to the Rybbit documentation site.

## Overview

All tools use the `ToolPageLayout` component which enforces a consistent 6-section structure:

1. Header (badge, title, description)
2. The actual tool (interactive component)
3. Educational content
4. FAQ section
5. Related tools
6. CTA (call-to-action)

## Quick Start

### Step 1: Create Tool Directory

Create a new directory for your tool in `/docs/src/app/(home)/tools/`:

```bash
mkdir /docs/src/app/(home)/tools/your-tool-name
```

### Step 2: Create the Tool Form Component

Create `YourToolForm.tsx` in your tool directory:

```tsx
"use client";

import { useState } from "react";

export function YourToolForm() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleCalculate = () => {
    // Your tool logic here
    const calculatedResult = `Result for ${input}`;
    setResult(calculatedResult);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Input Label</label>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-neutral-800"
            placeholder="Enter value..."
          />
        </div>

        <button
          onClick={handleCalculate}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Calculate
        </button>

        {result && (
          <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <p className="text-neutral-900 dark:text-white font-semibold">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 3: Create the Page Component

Create `page.tsx` in your tool directory:

```tsx
import { ToolPageLayout } from "../components/ToolPageLayout";
import { YourToolForm } from "./YourToolForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Your Tool Name | Description for SEO",
  description: "Your tool description that will appear in search results and social media previews.",
  openGraph: {
    title: "Free Your Tool Name | Short Description",
    description: "Social media description for your tool.",
    type: "website",
    url: "https://rybbit.com/tools/your-tool-name",
    siteName: "Rybbit Documentation",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Your Tool Name",
    description: "Twitter card description.",
  },
  alternates: {
    canonical: "https://rybbit.com/tools/your-tool-name",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "Your Tool Name",
      description: "Tool description for schema.org",
      url: "https://rybbit.com/tools/your-tool-name",
      applicationCategory: "Utility",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: {
        "@type": "Organization",
        name: "Rybbit",
        url: "https://rybbit.com",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is this tool?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Answer to the question.",
          },
        },
        // Add more FAQ items here
      ],
    },
  ],
};

const educationalContent = (
  <>
    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">What is Your Tool?</h2>
    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
      Explain what your tool does and why it's useful. This section should provide context and help users understand the
      value of the tool.
    </p>

    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4 mt-8">How to Use This Tool</h2>
    <ol className="space-y-2 text-neutral-700 dark:text-neutral-300 mb-6">
      <li>
        <strong>Step 1:</strong> Description of first step
      </li>
      <li>
        <strong>Step 2:</strong> Description of second step
      </li>
      <li>
        <strong>Step 3:</strong> Description of third step
      </li>
    </ol>

    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4 mt-8">Best Practices</h2>
    <ul className="space-y-2 text-neutral-700 dark:text-neutral-300 mb-6">
      <li>
        <strong>Best practice 1:</strong> Explanation
      </li>
      <li>
        <strong>Best practice 2:</strong> Explanation
      </li>
    </ul>
  </>
);

const faqs = [
  {
    question: "What is this tool for?",
    answer: "This tool helps you calculate/generate/analyze X by doing Y. It's useful for Z.",
  },
  {
    question: "How does it work?",
    answer:
      "The tool works by taking your input and processing it using [methodology]. The result shows you [what the result means].",
  },
  {
    question: "Can I use this with Rybbit?",
    answer: (
      <>
        Yes! Use{" "}
        <Link href="https://app.rybbit.io" className="text-emerald-600 dark:text-emerald-400 hover:underline">
          Rybbit Analytics
        </Link>{" "}
        to track [relevant metric] and see how your results compare over time.
      </>
    ),
  },
  // Add more FAQs - aim for 4-6 total
];

export default function YourToolPage() {
  return (
    <ToolPageLayout
      toolSlug="your-tool-name"
      title="Your Tool Name"
      description="Brief description of what your tool does and why it's useful for users."
      badge="Free Tool" // or "AI-Powered Tool"
      toolComponent={<YourToolForm />}
      educationalContent={educationalContent}
      faqs={faqs}
      relatedToolsCategory="analytics" // or "seo" or "privacy"
      ctaTitle="Track your [metric] with Rybbit"
      ctaDescription="Monitor [specific metrics] in real-time with privacy-first analytics."
      ctaEventLocation="your_tool_name_cta"
      structuredData={structuredData}
    />
  );
}
```

## Component Props Reference

### Required Props

| Prop                   | Type                                | Description                                     | Example                           |
| ---------------------- | ----------------------------------- | ----------------------------------------------- | --------------------------------- |
| `toolSlug`             | `string`                            | URL-friendly identifier matching directory name | `"bounce-rate-calculator"`        |
| `title`                | `string`                            | Page title shown in header                      | `"Bounce Rate Calculator"`        |
| `description`          | `string`                            | Brief description below title                   | `"Calculate your bounce rate..."` |
| `toolComponent`        | `ReactNode`                         | Your interactive tool form                      | `<YourToolForm />`                |
| `educationalContent`   | `ReactNode`                         | Educational sections as JSX                     | See example above                 |
| `faqs`                 | `FAQItem[]`                         | Array of FAQ objects                            | See example above                 |
| `relatedToolsCategory` | `"seo" \| "analytics" \| "privacy"` | Category for related tools                      | `"analytics"`                     |
| `ctaTitle`             | `string`                            | CTA section title                               | `"Track with Rybbit"`             |
| `ctaDescription`       | `string`                            | CTA section description                         | `"Monitor metrics..."`            |
| `ctaEventLocation`     | `string`                            | Event tracking identifier                       | `"your_tool_cta"`                 |

### Optional Props

| Prop             | Type     | Default                     | Description            |
| ---------------- | -------- | --------------------------- | ---------------------- |
| `badge`          | `string` | `"Free Tool"`               | Badge text above title |
| `ctaButtonText`  | `string` | `"Start tracking for free"` | CTA button text        |
| `structuredData` | `object` | `undefined`                 | JSON-LD for SEO        |

## Choosing the Right Category

Your tool should be categorized based on its primary purpose:

- **`analytics`** - Tools for measuring, calculating, or analyzing metrics

  - Examples: bounce-rate-calculator, ctr-calculator, funnel-visualizer

- **`seo`** - Tools for search engine optimization

  - Examples: seo-title-generator, meta-description-generator, og-tag-generator

- **`privacy`** - Tools related to privacy, compliance, or data protection
  - Examples: analytics-detector, privacy-policy-builder

## Choosing the Right Badge

- **`"Free Tool"`** - For calculators, analyzers, and standard tools
- **`"AI-Powered Tool"`** - For tools that use AI/LLM features to generate content

## Educational Content Guidelines

The `educationalContent` section should be comprehensive and helpful:

1. **Start with "What is X?"** - Define the concept or metric
2. **Explain "Why it Matters"** - Business value and use cases
3. **Provide "How to Use"** - Step-by-step instructions
4. **Include "Best Practices"** - Tips and recommendations
5. **Add "Common Mistakes"** - What to avoid

### Content Structure Tips

- Use h2 for main sections, h3 for subsections
- Include code examples in `<code>` tags where relevant
- Use lists (ul/ol) for easy scanning
- Keep paragraphs concise and scannable
- Add examples to illustrate concepts

## FAQ Guidelines

Aim for 4-6 FAQs that cover:

1. What the tool does
2. How it works
3. Why the metric/concept matters
4. Common questions or misconceptions
5. How to integrate with Rybbit (when relevant)

FAQs can include JSX for links:

```tsx
{
  question: "How do I track this with Rybbit?",
  answer: (
    <>
      Use{" "}
      <Link href="https://app.rybbit.io" className="text-emerald-600 dark:text-emerald-400 hover:underline">
        Rybbit Analytics
      </Link>{" "}
      to track your metrics automatically.
    </>
  ),
}
```

## Metadata Best Practices

### Title Tag

- Format: `"Free [Tool Name] | [Benefit/Description]"`
- Keep under 60 characters
- Include primary keyword

### Description

- 150-160 characters
- Include value proposition
- Use action words

### Keywords

- 8-12 relevant keywords
- Include variations and long-tail terms
- Don't keyword stuff

## Styling Guidelines

### Colors

- Primary action: `bg-emerald-600 hover:bg-emerald-500`
- Success states: `bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800`
- Backgrounds: `bg-white dark:bg-neutral-900`
- Borders: `border-neutral-200 dark:border-neutral-800`
- Text: `text-neutral-900 dark:text-white` (headings), `text-neutral-700 dark:text-neutral-300` (body)

### Spacing

- Section spacing: `mb-16` or `mt-8 mb-6`
- Element spacing: `mb-4`, `mb-6`
- List items: `space-y-2` or `space-y-4`

## Testing Your Tool

Before submitting, verify:

- [ ] Tool renders correctly in light and dark mode
- [ ] All interactive elements work as expected
- [ ] Educational content is comprehensive and helpful
- [ ] FAQs answer common questions
- [ ] No TypeScript errors
- [ ] Metadata is complete and accurate
- [ ] Links work correctly (especially Rybbit links)
- [ ] Tool slug matches directory name
- [ ] Related tools show correct category
- [ ] CTA section appears and works

## Example Tools for Reference

Good examples to reference:

- **Simple calculator**: `utm-builder` or `bounce-rate-calculator`
- **AI-powered tool**: `seo-title-generator` or `meta-description-generator`
- **Complex tool**: `funnel-visualizer` or `sample-size-calculator`

## Common Patterns

### Loading States

```tsx
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    // Your logic
  } finally {
    setIsLoading(false);
  }
};

<button disabled={isLoading}>{isLoading ? "Processing..." : "Calculate"}</button>;
```

### Error Handling

```tsx
const [error, setError] = useState<string | null>(null);

{
  error && (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p className="text-red-900 dark:text-red-200">{error}</p>
    </div>
  );
}
```

### Copy to Clipboard

```tsx
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};
```

## API Integration (if needed)

If your tool needs a backend API:

1. Create API route in `/docs/src/app/api/tools/your-tool-name/route.ts`
2. Use POST method for tool calculations
3. Validate input with Zod
4. Handle errors gracefully
5. Return structured JSON responses

Example API route:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  input: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input } = schema.parse(body);

    // Your tool logic here
    const result = processInput(input);

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
}
```

## Need Help?

- Check existing tools in `/docs/src/app/(home)/tools/` for examples
- Read the migration guide at `MIGRATION_GUIDE.md`
- Review the `ToolPageLayout` component at `components/ToolPageLayout.tsx`
- Ask questions in the team channel
