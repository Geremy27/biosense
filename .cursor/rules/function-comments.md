---
description: New functions created by the agent must have a one-line purpose comment above them
alwaysApply: true
---

# Function comments

When creating or substantially rewriting a function, add a one-line `//` comment directly above it explaining **what it does** (not how).

```typescript
// Adds a user to a database.
export async function addUser(...) { ... }
```

- One line, purpose-focused — do not restate the function name.
- Applies to exported functions, helpers, mutations, and non-trivial private functions.
- Skip only for trivial one-liners where the name already fully describes behavior (e.g. `const handleClick = () => mutate(input)`).
