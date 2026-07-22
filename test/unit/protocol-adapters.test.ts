import { describe, expect, it } from 'vitest';
import {
  decodeAnnotation,
  decodePrompt,
  decodePromptHistory,
  decodeResource,
  decodeSearchPage,
  encodeAnnotationInput,
  encodePromptInput,
  encodeResourceInput,
  encodeSearchRequest,
  searchReference,
} from '../../src/protocol-adapters.js';
import type {
  TaprootAnnotation,
  TaprootResource,
  WorkshopPrompt,
} from '../../src/model.js';

const visibility = {
  version: 1 as const,
  clauses: [[{ kind: 'workspace' as const, workspaceId: 'w1' }]],
};
const attribution = { id: 'actor-1', kind: 'human' as const, name: 'A' };
const authorization = {
  installationId: 'i1',
  workspaceId: 'w1',
  ownerPrincipalId: 'actor-1',
  policyRevision: 7,
  visibility,
};

describe('released protocol adapters', () => {
  it('preserves Taproot nested search filters, source revisions, generic matches, and cursor losslessly', () => {
    const request = {
      text: 'orchid',
      kinds: ['resource'] as const,
      filters: {
        languages: ['fr'],
        sourceRevisions: ['rev-string'],
        byKind: { resource: { mediaTypes: ['text/plain'] } },
        extension: { exact: true },
      },
      limit: 17,
      cursor: 'opaque+/=',
    };
    expect(encodeSearchRequest(request)).toBe(request);
    const page = {
      results: [
        {
          kind: 'resource' as const,
          sourceId: 'R1',
          sourceRevision: 'rev-string',
          score: 0.75,
          title: 'Source',
          snippet: 'chunk',
          language: 'fr',
          match: {
            derivedDocumentId: 'D1',
            selector: { type: 'FragmentSelector', value: 'p=1' },
            contributingStatementIds: ['S1'],
            extension: ['kept'],
          },
        },
      ],
      cursor: 'next',
    };
    expect(decodeSearchPage(page)).toBe(page);
    expect(searchReference(page.results[0]!)).toEqual({
      kind: 'resource',
      sourceId: 'R1',
    });
  });

  it('preserves every required Taproot Resource and Annotation field', () => {
    const resourceInput = {
      id: 'R1',
      itemId: 'Q1' as const,
      title: 'Source',
      payload: {
        kind: 'location' as const,
        location: 'https://example.test/source',
        storage: 'url' as const,
        byteLength: 9,
      },
      mediaType: 'text/plain',
      language: 'en',
      integrity: { algorithm: 'sha256' as const, digest: 'abc', byteLength: 9 },
    };
    expect(encodeResourceInput(resourceInput)).toBe(resourceInput);
    const resource: TaprootResource = {
      version: 1,
      ...resourceInput,
      revision: 4,
      attribution,
      authorization,
      createdAt: '2026-01-01T00:00:00Z',
      modifiedAt: '2026-01-02T00:00:00Z',
      deletedAt: null,
    };
    expect(decodeResource(resource)).toBe(resource);
    const annotationInput = {
      id: 'A1',
      body: { kind: 'resource' as const, resourceId: 'R1' },
      target: {
        kind: 'statement' as const,
        sourceId: 'S1',
        selector: { type: 'TextQuoteSelector', exact: 'quote' },
      },
      targetVisibility: visibility,
      motivation: 'commenting',
      creator: attribution,
      language: 'en',
    };
    expect(encodeAnnotationInput(annotationInput)).toBe(annotationInput);
    const annotation: TaprootAnnotation = {
      version: 1,
      id: 'A1',
      revision: 3,
      body: annotationInput.body,
      target: annotationInput.target,
      motivation: 'commenting',
      creator: attribution,
      language: 'en',
      attribution,
      authorization,
      createdAt: '2026-01-01T00:00:00Z',
      modifiedAt: '2026-01-02T00:00:00Z',
      deletedAt: null,
    };
    expect(decodeAnnotation(annotation)).toBe(annotation);
  });

  it('preserves Workshop prompt schema, ordering, policy, authorization, and history metadata', () => {
    const input = {
      name: 'summarize',
      title: 'Summarize',
      promptText: 'Use {{source}}',
      scope: 'project',
      role: 'researcher',
      variables: { type: 'object', required: ['source'] },
      active: true,
      priority: 9,
      order: 2,
      language: 'en',
      attribution: { source: 'fixture', actor: 'human-1', note: 'exact' },
      visibility,
    };
    expect(encodePromptInput(input)).toBe(input);
    const prompt: WorkshopPrompt = {
      id: 'P1',
      ...input,
      title: input.title,
      variables: input.variables,
      active: true,
      priority: 9,
      order: 2,
      language: 'en',
      attribution: input.attribution,
      revision: 5,
      policyRevision: 4,
      installationId: 'i1',
      ownerPrincipalId: 'human-1',
      workspaceId: 'w1',
      visibility,
      authorizationRevision: 8,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    };
    expect(decodePrompt(prompt)).toBe(prompt);
    const history = [
      {
        promptId: 'P1',
        revision: 5,
        prompt,
        actorPrincipalId: 'human-1',
        eventId: 'E1',
        createdAt: '2026-01-02T00:00:00Z',
      },
    ];
    expect(decodePromptHistory(history)).toBe(history);
  });
});
