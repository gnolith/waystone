# Styling and theming

Import `@gnolith/waystone/styles.css` once. The stylesheet is compiled and does not require Tailwind source scanning. It scopes structural rules beneath `.ws-shell` and does not install a global reset.

Stable host-customizable tokens are:

- `--ws-color-bg`, `--ws-color-surface`, `--ws-color-surface-raised`
- `--ws-color-text`, `--ws-color-muted`, `--ws-color-border`
- `--ws-color-accent`, `--ws-color-accent-strong`, `--ws-color-accent-soft`
- `--ws-color-danger`, `--ws-color-warning`, `--ws-color-success`, `--ws-color-focus`
- `--ws-font-sans`, `--ws-font-mono`
- `--ws-radius-sm`, `--ws-radius-md`, `--ws-shadow`, `--ws-content-width`
- `--ws-space-1`, `--ws-space-2`, `--ws-space-3`, `--ws-space-4`, `--ws-space-6`, `--ws-space-8`

System light/dark appearance works automatically. Set `data-waystone-theme="light"` or `"dark"` on an ancestor for an explicit choice. Focus, reduced-motion, forced-colors, narrow tables, and long identifiers are handled by the package CSS. Semantic status is always expressed in text as well as color.
