# BPMN Icons

This directory holds BPMN-notation SVG icons used by the EMSIST icon system.

## How to Add Icons

1. Download SVG icons from https://iconbuddy.com/bpmn
2. Name each file using the `bpmn` prefix convention:
   - `bpmnTask.svg`
   - `bpmnGateway.svg`
   - `bpmnEvent.svg`
   - `bpmnPool.svg`
   - `bpmnDataObject.svg`
   - `bpmnMessage.svg`
3. Ensure each SVG has `fill="currentColor"` for theme compatibility.
4. The icons are loaded at runtime via `provideNgIconLoader` in `provide-icons.ts`.

## Naming Convention

All BPMN icons MUST use the `bpmn` prefix in camelCase:
- `bpmnStartEvent` (not `start-event.svg`)
- `bpmnExclusiveGateway` (not `exclusive-gateway.svg`)

The filename (without `.svg`) must match the icon name used in templates:
```html
<ng-icon name="bpmnTask" />
```

## Registration

BPMN icons are automatically loaded by the custom `provideNgIconLoader` configured
in `frontend/src/app/core/icons/provide-icons.ts`. No additional registration is needed.
