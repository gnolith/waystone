import { act, render } from '@testing-library/react';
import axe from 'axe-core';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  AnnotationView,
  MemoryView,
  PromptView,
  ReadinessStatus,
  ResourceView,
  TaskView,
  UnifiedSearchResults,
} from '../../src/index.js';
import {
  fixtureAnnotation,
  fixtureMemory,
  fixturePrompt,
  fixtureReadiness,
  fixtureResource,
  fixtureSearchPage,
  fixtureTask,
} from '../../src/fixtures.js';

function RepresentativeUi() {
  return (
    <main>
      <ReadinessStatus readiness={fixtureReadiness} />
      <UnifiedSearchResults page={fixtureSearchPage} />
      <TaskView task={fixtureTask} />
      <MemoryView memory={fixtureMemory} />
      <PromptView prompt={fixturePrompt} />
      <ResourceView resource={fixtureResource} />
      <AnnotationView annotation={fixtureAnnotation} />
    </main>
  );
}

describe('accessibility, SSR, and hydration', () => {
  it('has no automated accessibility violations', async () => {
    const { container } = render(<RepresentativeUi />);
    const result = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });

  it('server-renders without browser globals and hydrates the same markup', async () => {
    const markup = renderToString(<RepresentativeUi />);
    expect(markup).toContain('Lexical search is available');
    const container = document.createElement('div');
    container.innerHTML = markup;
    await act(async () => {
      hydrateRoot(container, <RepresentativeUi />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });
});
