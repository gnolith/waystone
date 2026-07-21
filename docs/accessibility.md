# Accessibility

Waystone targets WCAG 2.2 AA behavior for package-owned UI. It uses named landmarks, a skip link, native controls, visible focus, keyboard search results, status announcements, described error states, captions and table headers, textual rank and snak labels, forced-colors support, and reduced motion.

Automated axe checks cover the shell, entity/statement data, search, forms, editors, SPARQL tables, and plugin contributions. Component interaction tests cover keyboard and asynchronous behavior. Before release, manually verify the canary with keyboard-only navigation, browser zoom/reflow, high contrast, reduced motion, and a screen reader’s landmark, heading, form-error, table, rank, and mutation announcements.

Plugin authors are responsible for the semantics of their own contribution body. Waystone provides a heading and error boundary around each contribution.
