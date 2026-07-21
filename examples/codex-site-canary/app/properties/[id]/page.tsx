'use client';

import { fixtureProperty } from '@gnolith/waystone/fixtures';
import { GnolithPropertyPage } from '@gnolith/waystone/site';
import { CanaryShell } from '../../waystone';

export default function PropertyRoute() {
  return (
    <CanaryShell currentPath="/entities">
      <GnolithPropertyPage entity={fixtureProperty} />
    </CanaryShell>
  );
}
