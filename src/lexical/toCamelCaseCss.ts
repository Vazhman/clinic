// Payload's TextStateFeature (defaultColors/fontSizeStates) stores its `css`
// records with kebab-case CSS property names (e.g. `background-color`,
// `font-size`). React's `style` prop requires camelCase — passing kebab-case
// keys through `Object.assign` silently drops anything but `color` (kebab ===
// camel by coincidence there).
export function toCamelCaseCss(css: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(css).map(([key, value]) => [key.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), value]),
  )
}
