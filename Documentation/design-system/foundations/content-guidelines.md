# Content Guidelines Foundation

**Status:** [DOCUMENTED]
**Version:** 1.0.0

## Purpose

This foundation standardizes UI copy so actions, states, errors, and empty
states read consistently across EMSIST.

## Voice And Tone

- Direct, neutral, and task-oriented.
- Specific over clever.
- Calm under error conditions.
- Action-led for buttons and menus.

## Writing Rules

| Area | Rule |
|---|---|
| Page titles | Use noun-based titles that match the user task: `Tenant Management`, `Master Definitions`, `Reset Password`. |
| Button labels | Start with a verb or concrete action: `Create`, `Save`, `Retry`, `Import License`. |
| Empty states | Explain why the area is empty, then tell the user what to do next. |
| Validation | State the problem and the field: `Email address is required.` |
| Error copy | Explain impact and recovery path. Avoid blame and internal jargon. |
| Success copy | Confirm the action in plain language and keep it short. |
| Status labels | Use short standardized terms: `Active`, `Pending`, `Suspended`, `Expired`, `Protected`. |
| Dates | Use the documented `dd MMM y, HH:mm` format in product UI. |

## Labels And Actions

- Labels use sentence case.
- Menu items and button labels avoid punctuation unless the product term requires it.
- Destructive actions use explicit verbs: `Delete`, `Remove`, `Revoke`, `Sign out`.
- Avoid vague labels like `Submit`, `Proceed`, or `Manage` when the action can be named more precisely.

## Validation And Error Wording

Use these patterns:

- Required: `{Field} is required.`
- Length minimum: `{Field} must be at least {n} characters.`
- Length maximum: `{Field} must not exceed {n} characters.`
- Invalid format: `{Field} format is invalid.`
- Network failure: `Unable to connect. Please try again.`
- Permission failure: `You do not have permission to perform this action.`

Avoid:

- blameful phrasing such as `You entered invalid data`
- internal backend terms such as exception names or HTTP jargon
- duplicate stacked messages that say the same thing in toast and inline copy

## Empty-State Structure

Every empty state should answer three questions:

1. What is missing?
2. Why might it be missing?
3. What can the user do next?

Template:

```text
Heading: No tenants found
Description: No tenants match the current filters.
Action: Clear filters
```

## Tooltip And Helper Copy

- Use tooltips only for short clarification, not essential instructions.
- Helper text should sit below or near the field it describes.
- If a control needs more than one short sentence to explain, it probably needs inline copy instead of a tooltip.

## Do / Don't

### Do

- Use consistent product terms for the same object everywhere.
- Prefer shorter sentences and familiar verbs.
- Include the object name in destructive confirmations.
- Keep success messages brief and specific.

### Don't

- Do not mix synonyms for the same action across neighboring controls.
- Do not use exclamation marks for routine system feedback.
- Do not expose internal identifiers unless they help the user complete a task.
- Do not use tooltip text as the only description of a control.
