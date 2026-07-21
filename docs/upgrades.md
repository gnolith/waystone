# Upgrade policy

Waystone follows Semantic Versioning. Before 1.0, minor versions may adjust TypeScript and component contracts; changelog entries and migration notes are required. Patch versions preserve the documented public API and CSS variable meanings.

After 1.0, removing or changing an export, protocol field, plugin contribution shape, stable CSS variable, supported peer range, or error kind requires a major version. New optional props, components, contribution types, and additive protocol fields are minor changes. Fixes that preserve behavior are patches.

Gnolith packages are versioned independently. A release declares its supported React, TypeScript, vinext, and Taproot ranges in the README and package metadata. The first Taproot range will be added only after its browser-safe protocol package is public and consumer-tested.
