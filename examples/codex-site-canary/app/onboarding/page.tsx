'use client';

import { GnolithOnboarding } from '@gnolith/waystone/site';
import { CanaryShell } from '../waystone';

export default function OnboardingPage() {
  return (
    <CanaryShell currentPath="/onboarding">
      <GnolithOnboarding
        onSubmit={(input) => {
          console.info('Canary onboarding complete', {
            subject: input.subject,
            language: input.language,
          });
        }}
      />
    </CanaryShell>
  );
}
