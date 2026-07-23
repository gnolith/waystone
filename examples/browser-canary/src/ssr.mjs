import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { WaystoneShell } from '@gnolith/waystone';
import { WaystoneApplicationShell } from '@gnolith/waystone/site';
import { waystoneAssetManifest } from '@gnolith/waystone/assets';

const html = renderToString(
  createElement(
    WaystoneApplicationShell,
    null,
    createElement(
      WaystoneShell,
      { title: 'Waystone browser canary' },
      createElement('p', null, 'canary'),
    ),
  ),
);
if (!html.includes('canary')) throw new Error('Packed SSR render failed.');
if (waystoneAssetManifest.format !== 'waystone-assets-v1')
  throw new Error('Packed asset manifest failed.');
console.log('Packed browser bundle and server-safe render passed.');
