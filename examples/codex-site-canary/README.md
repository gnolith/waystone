# Waystone Codex Sites canary

This multi-route vinext/Vite application is the package consumer, server-rendering fixture, and Cloudflare Worker deployment canary for `@gnolith/waystone`.

The release check packs Waystone, copies this canary into an isolated temporary directory, installs the exact archive there, builds the production Worker, and server-renders `/`, `/onboarding`, `/entities`, `/entities/Q1`, `/properties/P1`, and `/sparql`. The rendered tests prove both the generic fixture contract and the packed Workshop UI plugin through public exports only.

Fixtures keep ordinary package development deterministic. Production evidence comes from the generated-style Site APIs in `app/api`: Taproot owns canonical entity mutation and revision behavior over managed D1, while Diamond and Comunica provide the read-only SPARQL path. The deployed matrix covers live browsing, mutation, stale-revision conflict, history, search, validation, dry-run, and query behavior.

```sh
# From the repository root
npm run build
npm pack --ignore-scripts

# In this directory
npm install ../../gnolith-waystone-0.1.0.tgz --save-exact
npm test
```

The production Cloudflare configuration deliberately contains no Node compatibility flag. Current local vinext development middleware uses `nodejs_compat` only while `vite` is serving the preview; this does not enter the production build configuration.
