# Component Library

## Core Components

### Buttons

```tsx
<button className="btn btn-primary">Primary Button</button>
<button className="btn btn-secondary">Secondary Button</button>
<button className="btn btn-danger">Danger Button</button>
```

### Inputs

```tsx
<input type="text" className="input" placeholder="Enter text" />
<input type="number" className="input" placeholder="Enter number" />
<textarea className="textarea" placeholder="Enter text" />
```

### Forms

```tsx
<form className="form">
  <div className="form-group">
    <label>Field Name</label>
    <input type="text" className="input" />
  </div>
  <button type="submit" className="btn btn-primary">
    Submit
  </button>
</form>
```

### Tables

```tsx
<table className="table">
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </tbody>
</table>
```

### Cards

```tsx
<div className="card">
  <div className="card-header">
    <h3>Card Title</h3>
  </div>
  <div className="card-body">Card content</div>
</div>
```

## Recon Core Components

### DiffViewer

Visualizes reconciliation differences.

**Location:** `/packages/web/src/components/recon/DiffViewer.tsx`

**Usage:**

```tsx
<DiffViewer
  items={[
    {
      field: "amount",
      source: 100,
      target: 100,
      status: "matched",
      confidence: 1.0,
    },
  ]}
  onItemClick={(item) => console.log(item)}
/>
```

### SchemaInspector

Visualizes and inspects data schemas.

**Location:** `/packages/web/src/components/recon/SchemaInspector.tsx`

**Usage:**

```tsx
<SchemaInspector
  schema={{
    fields: [{ name: "id", type: "string", required: true }],
  }}
  onFieldSelect={(field) => console.log(field)}
/>
```

## Workflow Components

### WorkflowBuilder

Drag-and-drop workflow orchestration.

**Location:** `/packages/web/src/components/workflows/WorkflowBuilder.tsx`

**Usage:**

```tsx
<WorkflowBuilder initialSteps={[]} onSave={(steps) => console.log(steps)} />
```

## Page Templates

### Dashboard

**Location:** `/packages/web/src/pages/Dashboard.tsx`

Main dashboard with recent reconciliations and schema inspector.

### ReconJobViewer

**Location:** `/packages/web/src/pages/ReconJobViewer.tsx`

View and manage reconciliation jobs.

### WorkflowBuilderPage

**Location:** `/packages/web/src/pages/WorkflowBuilderPage.tsx`

Build and edit workflows.

---

**For design tokens, see:** `/design-system/tokens.json`
