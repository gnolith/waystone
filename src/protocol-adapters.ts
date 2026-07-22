import type {
  TaprootCreateAnnotationInput,
  TaprootAnnotation,
  WorkshopCreatePromptInput,
  WorkshopPrompt,
  WorkshopPromptRevision,
  TaprootCreateResourceInput,
  TaprootResource,
  SearchPage,
  SearchReference,
  SearchRequest,
  SearchResult,
} from './model.js';

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError(`${label} must be an object.`);
  return value as Record<string, unknown>;
}
function string(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string')
    throw new TypeError(`${label} must be a string.`);
}
function number(value: unknown, label: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new TypeError(`${label} must be a finite number.`);
}

/** Lossless browser boundary for Taproot 0.4 SearchRequest. */
export function encodeSearchRequest(value: SearchRequest): SearchRequest {
  const input = object(value, 'Search request');
  string(input.text, 'Search request text');
  if (input.kinds !== undefined && !Array.isArray(input.kinds))
    throw new TypeError('Search request kinds must be an array.');
  if (input.filters !== undefined)
    object(input.filters, 'Search request filters');
  if (input.limit !== undefined) number(input.limit, 'Search request limit');
  if (input.cursor !== undefined) string(input.cursor, 'Search request cursor');
  return value;
}

export function searchReference(result: SearchResult): SearchReference {
  return { kind: result.kind, sourceId: result.sourceId };
}

/** Validate Taproot 0.4 SearchPage without projecting generic match data. */
export function decodeSearchPage(value: unknown): SearchPage {
  const page = object(value, 'Search page');
  if (!Array.isArray(page.results))
    throw new TypeError('Search page results must be an array.');
  for (const entry of page.results) {
    const result = object(entry, 'Search result');
    string(result.kind, 'Search result kind');
    string(result.sourceId, 'Search result sourceId');
    string(result.sourceRevision, 'Search result sourceRevision');
    number(result.score, 'Search result score');
    string(result.snippet, 'Search result snippet');
    if (result.match !== undefined) object(result.match, 'Search result match');
  }
  if (page.cursor !== undefined) string(page.cursor, 'Search page cursor');
  return value as SearchPage;
}

export function encodeResourceInput(
  value: TaprootCreateResourceInput,
): TaprootCreateResourceInput {
  const input = object(value, 'Resource input');
  string(input.id, 'Resource id');
  string(input.itemId, 'Resource itemId');
  object(input.payload, 'Resource payload');
  string(input.mediaType, 'Resource mediaType');
  object(input.integrity, 'Resource integrity');
  return value;
}
export function decodeResource(value: unknown): TaprootResource {
  const resource = object(value, 'Resource');
  if (resource.version !== 1)
    throw new TypeError('Resource version must be 1.');
  string(resource.id, 'Resource id');
  string(resource.itemId, 'Resource itemId');
  number(resource.revision, 'Resource revision');
  object(resource.payload, 'Resource payload');
  string(resource.mediaType, 'Resource mediaType');
  object(resource.integrity, 'Resource integrity');
  object(resource.attribution, 'Resource attribution');
  object(resource.authorization, 'Resource authorization');
  string(resource.createdAt, 'Resource createdAt');
  string(resource.modifiedAt, 'Resource modifiedAt');
  if (resource.deletedAt !== null)
    string(resource.deletedAt, 'Resource deletedAt');
  return value as TaprootResource;
}
export function encodeAnnotationInput(
  value: TaprootCreateAnnotationInput,
): TaprootCreateAnnotationInput {
  const input = object(value, 'Annotation input');
  string(input.id, 'Annotation id');
  object(input.body, 'Annotation body');
  object(input.target, 'Annotation target');
  object(input.targetVisibility, 'Annotation targetVisibility');
  return value;
}
export function decodeAnnotation(value: unknown): TaprootAnnotation {
  const annotation = object(value, 'Annotation');
  if (annotation.version !== 1)
    throw new TypeError('Annotation version must be 1.');
  string(annotation.id, 'Annotation id');
  number(annotation.revision, 'Annotation revision');
  object(annotation.body, 'Annotation body');
  object(annotation.target, 'Annotation target');
  object(annotation.attribution, 'Annotation attribution');
  object(annotation.authorization, 'Annotation authorization');
  string(annotation.createdAt, 'Annotation createdAt');
  string(annotation.modifiedAt, 'Annotation modifiedAt');
  if (annotation.deletedAt !== null)
    string(annotation.deletedAt, 'Annotation deletedAt');
  return value as TaprootAnnotation;
}
export function encodePromptInput(
  value: WorkshopCreatePromptInput,
): WorkshopCreatePromptInput {
  const input = object(value, 'Prompt input');
  string(input.name, 'Prompt name');
  string(input.promptText, 'Prompt promptText');
  if (input.variables !== undefined)
    object(input.variables, 'Prompt variables');
  return value;
}
export function decodePrompt(value: unknown): WorkshopPrompt {
  const prompt = object(value, 'Prompt');
  for (const field of [
    'id',
    'name',
    'title',
    'promptText',
    'language',
    'installationId',
    'ownerPrincipalId',
    'workspaceId',
    'createdAt',
    'updatedAt',
  ])
    string(prompt[field], `Prompt ${field}`);
  for (const field of [
    'priority',
    'order',
    'revision',
    'policyRevision',
    'authorizationRevision',
  ])
    number(prompt[field], `Prompt ${field}`);
  if (typeof prompt.active !== 'boolean')
    throw new TypeError('Prompt active must be boolean.');
  object(prompt.variables, 'Prompt variables');
  object(prompt.attribution, 'Prompt attribution');
  object(prompt.visibility, 'Prompt visibility');
  return value as WorkshopPrompt;
}
export function decodePromptHistory(value: unknown): WorkshopPromptRevision[] {
  if (!Array.isArray(value))
    throw new TypeError('Prompt history must be an array.');
  for (const entry of value) {
    const revision = object(entry, 'Prompt revision');
    string(revision.promptId, 'Prompt revision promptId');
    number(revision.revision, 'Prompt revision number');
    decodePrompt(revision.prompt);
    string(revision.actorPrincipalId, 'Prompt revision actorPrincipalId');
    string(revision.eventId, 'Prompt revision eventId');
    string(revision.createdAt, 'Prompt revision createdAt');
  }
  return value as WorkshopPromptRevision[];
}
