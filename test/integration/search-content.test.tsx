import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  AnnotationView,
  ExternalDestination,
  ReadinessStatus,
  ResourceView,
  UnifiedSearchResults,
} from '../../src/knowledge-components.js';
import {
  fixtureAnnotation,
  fixtureReadiness,
  fixtureResource,
  fixtureSearchPage,
} from '../../src/fixtures.js';

describe('search and content presentation', () => {
  it('exposes exactly seven kinds and represents Property inside item', () => {
    render(<UnifiedSearchResults page={fixtureSearchPage} />);
    expect(screen.getByText('Property')).toBeInTheDocument();
    expect(screen.getAllByText('item').length).toBeGreaterThan(0);
    expect(screen.queryByText('property', { selector: '.ws-kind' })).toBeNull();
    expect(screen.getByText(/ordering signal 0.820/i)).toBeInTheDocument();
    expect(screen.queryByText(/82%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Derived chunk that/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/derived chunk match was omitted/i),
    ).toBeInTheDocument();
  });

  it('renders malicious strings as text and blocks active or oversized previews', () => {
    const { rerender } = render(
      <ResourceView
        resource={{
          ...fixtureResource,
          title: '<img src=x onerror=alert(1)>',
          text: '<script>steal()</script>',
        }}
      />,
    );
    expect(screen.getByText('<script>steal()</script>')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
    rerender(
      <ResourceView
        resource={{
          ...fixtureResource,
          activeContent: true,
          mediaType: 'text/html',
        }}
      />,
    );
    expect(screen.getByText(/Preview unavailable/i)).toBeInTheDocument();
  });

  it('limits external protocols and protects opener access', () => {
    const { rerender } = render(
      <ExternalDestination href="javascript:alert(1)">Bad</ExternalDestination>,
    );
    expect(screen.getByText(/blocked/i)).toBeInTheDocument();
    rerender(
      <ExternalDestination href="https://example.test/source">
        Source
      </ExternalDestination>,
    );
    expect(screen.getByRole('link', { name: /Source/ })).toHaveAttribute(
      'rel',
      expect.stringContaining('noopener'),
    );
  });

  it('does not describe semantic degradation as total outage', () => {
    render(<ReadinessStatus readiness={fixtureReadiness} />);
    expect(
      screen.getByText(/Lexical search is available/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Semantic ranking is degraded/i),
    ).toBeInTheDocument();
  });

  it('keeps annotation targets and bodies visibly distinct', () => {
    render(<AnnotationView annotation={fixtureAnnotation} />);
    expect(screen.getByText(/Targets resource/)).toBeInTheDocument();
    expect(
      screen.getByText(/Important supporting passage/),
    ).toBeInTheDocument();
  });
});
