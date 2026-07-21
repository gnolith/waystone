# Waystone Codex Sites canary

This multi-route vinext/Vite application is the package consumer, server-rendering fixture, and Cloudflare Worker deployment canary for `@gnolith/waystone`.

The release check packs Waystone, installs that exact archive here, builds the production Worker, and server-renders `/`, `/onboarding`, `/entities`, `/entities/Q1`, `/properties/P1`, and `/sparql`. The dummy module proves plugin registration through public exports only.

Fixtures keep ordinary package development deterministic. They are not accepted as evidence for live Taproot browsing, mutation, conflict, revision, or SPARQL gates; those remain `NO-GO` until generated Site APIs exist.

```sh
# From the repository root
npm run build
npm pack --ignore-scripts

# In this directory
npm install ../../gnolith-waystone-0.1.0.tgz --save-exact
npm test
```

The production Cloudflare configuration deliberately contains no Node compatibility flag. Current local vinext development middleware uses `nodejs_compat` only while `vite` is serving the preview; this does not enter the production build configuration.
