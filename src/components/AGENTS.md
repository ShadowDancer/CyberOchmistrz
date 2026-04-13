## Component patterns

- All components use `'use client'` except `StarRating.tsx`
- Pattern: `export default function ComponentName(props)` — function declarations, not arrow functions, not `React.FC`
- Props: `interface ComponentNameProps { ... }` defined above the component, destructured in params
- Styling: Tailwind utilities + project utility classes (`btn-primary`, `container-centered`, `heading-primary`, `badge-vegan`, `input-simple`). No CSS modules
- Inline `style` only for dnd-kit transform/transition (in `DraggableRecipeItem`)
- Local helper components (e.g. `DietBadge`, `DietaryBadge`) are NOT exported — keep them file-private
- Types imported from `@/types` or `../types`
