# Waystone isolated consumer

This multi-route vinext/Vite application verifies the exact packed `@gnolith/waystone` artifact in a fresh local consumer. It is a package build and server-rendering fixture, not a complete Gnolith Site or a deployment canary.

The release check packs Waystone, copies this fixture into an isolated temporary directory, installs the exact archive there, builds the consumer, and server-renders `/`, `/onboarding`, `/entities`, `/entities/Q1`, `/properties/P1`, and `/sparql`. The rendered tests exercise Waystone public exports, CSS, representative components, the mock client, and the package-owned plugin fixture.

The fixture deliberately has no Diamond, Taproot, Workshop, managed database, hosting project, authentication, or deployment dependency. The Codex agent creating a complete Site owns package assembly, generated APIs, provisioning, runtime configuration, deployment, and live acceptance.

```sh
# From the repository root
npm run build
npm pack --ignore-scripts

# In this directory
npm install ../../gnolith-waystone-0.1.1.tgz --save-exact
npm test
```

These commands establish only local consumer build and SSR behavior attributable to the Waystone package. They do not qualify a deployed host.
