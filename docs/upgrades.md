# Upgrade policy

Waystone follows Semantic Versioning. Before 1.0, minor versions may adjust TypeScript and component contracts; changelog entries and migration notes are required. Patch versions preserve the documented public API and CSS variable meanings.

After 1.0, removing or changing an export, protocol field, plugin contribution shape, stable CSS variable, supported peer range, or error kind requires a major version. New optional props, components, contribution types, and additive protocol fields are minor changes. Fixes that preserve behavior are patches.

Gnolith packages are versioned independently. A release declares its supported React, TypeScript, vinext, and Taproot ranges in the README and package metadata. Waystone 0.1 supports the public, browser-safe Taproot release-candidate range `>=0.1.0-rc.0 <0.2.0`; changes to that range require exact-package isolated-consumer verification.
