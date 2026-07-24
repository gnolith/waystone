'use client';

import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import type { OperationName } from '@gnolith/workshop/client';
import {
  EmptyState,
  LoadingState,
  PermissionDenied,
  WaystoneErrorDisplay,
} from './components.js';
import {
  AnnotationView,
  MemoryView,
  PromptView,
  ReadinessStatus,
  ResourceView,
  RevisionHistory,
  SearchAdministrationStatus,
  TaskPacketViewComponent,
  TaskView,
  UnifiedSearchResults,
} from './knowledge-components.js';
import type {
  AnnotationViewModel,
  MemoryViewModel,
  PromptViewModel,
  ReadinessView,
  ResourcePreviewView,
  RevisionView,
  SearchAdministrationView,
  SearchKind,
  SearchPageView,
  SearchRequestView,
  SearchResultView,
  TaskPacketView,
  TaskViewModel,
  WorkshopClient,
} from './model.js';
import { SEARCH_KINDS } from './model.js';
import {
  callWorkshop,
  isWorkshopRequestError,
  useWorkshopOperation,
} from './workshop-client.js';

function OperationError({ error }: { error: unknown }) {
  if (isWorkshopRequestError(error) && error.code === 'forbidden')
    return <PermissionDenied />;
  if (isWorkshopRequestError(error) && error.code === 'conflict')
    return (
      <div role="alert" className="ws-alert ws-alert--warning">
        This record changed or its lease expired. Refresh before retrying.
      </div>
    );
  return <WaystoneErrorDisplay error={error} />;
}

export function UnifiedSearchScreen({
  client,
  initialQuery = '',
}: {
  client: WorkshopClient;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [kinds, setKinds] = useState<readonly SearchKind[]>(SEARCH_KINDS);
  const [page, setPage] = useState<SearchPageView>();
  const [hydrated, setHydrated] = useState<unknown>();
  const search = useWorkshopOperation<SearchRequestView, SearchPageView>(
    client,
    'search',
  );
  const hydrate = useWorkshopOperation<
    {
      kind: SearchKind;
      id: string;
      revision: number;
      entityType?: 'item' | 'property';
    },
    unknown
  >(client, 'search_hydrate');

  const selectedKinds = useMemo(() => new Set(kinds), [kinds]);
  async function submit(event?: FormEvent, cursor?: string) {
    event?.preventDefault();
    try {
      const next = await search.run({
        text: query,
        kinds,
        limit: 25,
        ...(cursor ? { cursor } : {}),
      });
      setPage(next);
    } catch {
      // The operation hook owns the public error state.
    }
  }

  function toggleKind(kind: SearchKind) {
    setKinds((current) =>
      current.includes(kind)
        ? current.filter((value) => value !== kind)
        : [...current, kind],
    );
  }

  async function open(result: SearchResultView) {
    try {
      setHydrated(
        await hydrate.run({
          kind: result.kind,
          id: result.sourceId,
          revision: Number(result.sourceRevision),
          ...(result.entityType ? { entityType: result.entityType } : {}),
        }),
      );
    } catch {
      // The operation hook owns the public error state.
    }
  }

  return (
    <section aria-labelledby="unified-search-heading">
      <h1 id="unified-search-heading">Unified search</h1>
      <form role="search" onSubmit={(event) => void submit(event)}>
        <label>
          Search
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <fieldset>
          <legend>Result kinds</legend>
          {SEARCH_KINDS.map((kind) => (
            <label key={kind}>
              <input
                type="checkbox"
                checked={selectedKinds.has(kind)}
                onChange={() => toggleKind(kind)}
              />
              {kind}
            </label>
          ))}
        </fieldset>
        <button type="submit" disabled={!query.trim() || !kinds.length}>
          Search
        </button>
      </form>
      {search.state.status === 'loading' ? (
        <LoadingState label="Searching" />
      ) : null}
      {search.state.status === 'error' ? (
        <OperationError error={search.state.error} />
      ) : null}
      {page ? (
        <UnifiedSearchResults
          page={page}
          onOpen={(result) => void open(result)}
          onNext={(cursor) => void submit(undefined, cursor)}
        />
      ) : null}
      {hydrate.state.status === 'loading' ? (
        <LoadingState label="Opening authorized result" />
      ) : null}
      {hydrate.state.status === 'error' ? (
        <OperationError error={hydrate.state.error} />
      ) : null}
      {hydrated ? (
        <p role="status">The authorized result was hydrated by Workshop.</p>
      ) : null}
    </section>
  );
}

export function ResourcePayloadPreview({
  client,
  resourceId,
  revision,
}: {
  client: WorkshopClient;
  resourceId: string;
  revision: number;
}) {
  const operation = useWorkshopOperation<
    { resourceId: string; revision: number },
    ResourcePreviewView
  >(client, 'hydrate_resource');
  const run = operation.run;
  useEffect(() => {
    void run({ resourceId, revision }).catch(() => undefined);
  }, [resourceId, revision, run]);
  if (operation.state.status === 'loading') return <LoadingState />;
  if (operation.state.status === 'error')
    return <OperationError error={operation.state.error} />;
  if (operation.state.status === 'success')
    return <ResourceView resource={operation.state.value} />;
  return null;
}

export function ResourceEditor({
  client,
  resource,
  onSaved,
}: {
  client: WorkshopClient;
  resource?: ResourcePreviewView;
  onSaved?: (value: ResourcePreviewView) => void;
}) {
  const [id, setId] = useState(resource?.id ?? '');
  const [itemId, setItemId] = useState(resource?.itemId ?? 'Q1');
  const [title, setTitle] = useState(resource?.title ?? '');
  const [mediaType, setMediaType] = useState(
    resource?.mediaType ?? 'text/plain',
  );
  const [text, setText] = useState(resource?.text ?? '');
  const [error, setError] = useState<unknown>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    try {
      const value = await callWorkshop<
        {
          resourceId?: string;
          expectedRevision?: number;
          idempotencyKey: string;
          data?: Readonly<Record<string, unknown>>;
          patch?: Readonly<Record<string, unknown>>;
        },
        ResourcePreviewView
      >(
        client,
        resource ? 'update_resource' : 'create_resource',
        resource
          ? {
              resourceId: resource.id,
              expectedRevision: resource.revision,
              idempotencyKey: `resource-${resource.id}-${resource.revision}`,
              patch: { itemId, title, mediaType, text },
            }
          : {
              idempotencyKey: `resource-${id}-${crypto.randomUUID()}`,
              data: { id, itemId, title, mediaType, text },
            },
      );
      onSaved?.(value);
    } catch (cause) {
      setError(cause);
    }
  }

  return (
    <form className="ws-editor" onSubmit={(event) => void submit(event)}>
      <h2>{resource ? 'Edit Resource' : 'Create Resource'}</h2>
      <label>
        Resource ID
        <input
          required
          value={id}
          onChange={(event) => setId(event.target.value)}
        />
      </label>
      <label>
        Linked Item
        <input
          required
          pattern="Q[0-9]+"
          value={itemId}
          onChange={(event) => setItemId(event.target.value as `Q${number}`)}
        />
      </label>
      <label>
        Title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label>
        Media type
        <input
          required
          value={mediaType}
          onChange={(event) => setMediaType(event.target.value)}
        />
      </label>
      <label>
        Text payload
        <textarea
          required
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      <button type="submit">Save Resource</button>
      {error ? <OperationError error={error} /> : null}
    </form>
  );
}

export function AnnotationEditor({
  client,
  annotation,
  onSaved,
}: {
  client: WorkshopClient;
  annotation?: AnnotationViewModel;
  onSaved?: (value: AnnotationViewModel) => void;
}) {
  const [id, setId] = useState(annotation?.id ?? '');
  const [bodyText, setBodyText] = useState(annotation?.bodyText ?? '');
  const [targetKind, setTargetKind] = useState<SearchKind>(
    annotation?.targetKind ?? 'resource',
  );
  const [targetId, setTargetId] = useState(annotation?.targetId ?? '');
  const [error, setError] = useState<unknown>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    try {
      onSaved?.(
        await callWorkshop(
          client,
          annotation ? 'update_annotation' : 'create_annotation',
          annotation
            ? {
                annotationId: id,
                expectedRevision: annotation.revision,
                idempotencyKey: `annotation-${id}-${annotation.revision}`,
                patch: { bodyText, targetKind, targetId },
              }
            : {
                idempotencyKey: `annotation-${id}-${crypto.randomUUID()}`,
                data: { id, bodyText, targetKind, targetId },
              },
        ),
      );
    } catch (cause) {
      setError(cause);
    }
  }

  return (
    <form className="ws-editor" onSubmit={(event) => void submit(event)}>
      <h2>{annotation ? 'Edit Annotation' : 'Create Annotation'}</h2>
      <label>
        Annotation ID
        <input
          required
          value={id}
          onChange={(event) => setId(event.target.value)}
        />
      </label>
      <label>
        Body
        <textarea
          required
          value={bodyText}
          onChange={(event) => setBodyText(event.target.value)}
        />
      </label>
      <label>
        Target kind
        <select
          value={targetKind}
          onChange={(event) => setTargetKind(event.target.value as SearchKind)}
        >
          {SEARCH_KINDS.map((kind) => (
            <option key={kind}>{kind}</option>
          ))}
        </select>
      </label>
      <label>
        Target ID
        <input
          required
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
        />
      </label>
      <button type="submit">Save Annotation</button>
      {error ? <OperationError error={error} /> : null}
    </form>
  );
}

export function PromptEditor({
  client,
  prompt,
  onSaved,
}: {
  client: WorkshopClient;
  prompt?: PromptViewModel;
  onSaved?: (value: PromptViewModel) => void;
}) {
  const [name, setName] = useState(prompt?.name ?? '');
  const [title, setTitle] = useState(prompt?.title ?? '');
  const [promptText, setPromptText] = useState(prompt?.promptText ?? '');
  const [variables, setVariables] = useState(
    JSON.stringify(prompt?.variables ?? {}, null, 2),
  );
  const [error, setError] = useState<unknown>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    try {
      const parsed = JSON.parse(variables) as Readonly<Record<string, unknown>>;
      onSaved?.(
        await callWorkshop(
          client,
          prompt ? 'update_prompt' : 'create_prompt',
          prompt
            ? {
                promptId: prompt.id,
                expectedRevision: prompt.revision,
                idempotencyKey: `prompt-${prompt.id}-${prompt.revision}`,
                patch: { name, title, promptText, variables: parsed },
              }
            : {
                idempotencyKey: `prompt-${name}-${crypto.randomUUID()}`,
                name,
                promptText,
                data: { title, variables: parsed },
              },
        ),
      );
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <form className="ws-editor" onSubmit={(event) => void submit(event)}>
      <h2>{prompt ? 'Edit Prompt' : 'Create Prompt'}</h2>
      <label>
        Name
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label>
        Title
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label>
        Prompt text
        <textarea
          required
          value={promptText}
          onChange={(event) => setPromptText(event.target.value)}
        />
      </label>
      <label>
        Variable schema
        <textarea
          value={variables}
          onChange={(event) => setVariables(event.target.value)}
        />
      </label>
      <button type="submit">Save Prompt</button>
      {error ? <OperationError error={error} /> : null}
    </form>
  );
}

export function PromptWorkspace({
  client,
  promptId,
}: {
  client: WorkshopClient;
  promptId: string;
}) {
  const [prompt, setPrompt] = useState<PromptViewModel>();
  const [history, setHistory] = useState<
    readonly RevisionView<PromptViewModel>[]
  >([]);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      callWorkshop<{ promptId: string }, PromptViewModel>(
        client,
        'get_prompt',
        { promptId },
        { signal: controller.signal },
      ),
      callWorkshop<
        { promptId: string; limit: number },
        readonly RevisionView<PromptViewModel>[]
      >(
        client,
        'prompt_history',
        { promptId, limit: 50 },
        { signal: controller.signal },
      ),
    ])
      .then(([value, revisions]) => {
        if (!controller.signal.aborted) {
          setPrompt(value);
          setHistory(revisions);
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause);
      });
    return () => controller.abort();
  }, [client, promptId]);
  if (error) return <OperationError error={error} />;
  if (deleted) return <EmptyState title="Prompt deleted" />;
  if (!prompt) return <LoadingState />;
  async function remove() {
    if (!prompt) return;
    try {
      await callWorkshop(client, 'delete_prompt', {
        promptId: prompt.id,
        expectedRevision: prompt.revision,
        idempotencyKey: `delete-prompt-${prompt.id}-${prompt.revision}`,
      });
      setDeleted(true);
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <>
      <PromptView prompt={prompt} />
      <PromptEditor client={client} prompt={prompt} onSaved={setPrompt} />
      <button type="button" onClick={() => void remove()}>
        Delete Prompt
      </button>
      <RevisionHistory
        revisions={history}
        render={(value) => <PromptView prompt={value} />}
      />
    </>
  );
}

export function MemoryEditor({
  client,
  memory,
  onSaved,
}: {
  client: WorkshopClient;
  memory?: MemoryViewModel;
  onSaved?: (value: MemoryViewModel) => void;
}) {
  const [slug, setSlug] = useState(memory?.slug ?? '');
  const [description, setDescription] = useState(memory?.description ?? '');
  const [content, setContent] = useState(memory?.content ?? '');
  const [error, setError] = useState<unknown>();
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    try {
      onSaved?.(
        await callWorkshop(client, 'upsert_memory', {
          slug,
          idempotencyKey: `memory-${slug}-${memory?.revision ?? crypto.randomUUID()}`,
          description,
          content,
          ...(memory ? { expectedRevision: memory.revision } : {}),
        }),
      );
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <form className="ws-editor" onSubmit={(event) => void submit(event)}>
      <h2>{memory ? 'Edit Memory' : 'Create Memory'}</h2>
      <label>
        Slug
        <input
          required
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
        />
      </label>
      <label>
        Description
        <textarea
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <label>
        Content
        <textarea
          required
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </label>
      <button type="submit">Save Memory</button>
      {error ? <OperationError error={error} /> : null}
    </form>
  );
}

export function MemoryWorkspace({
  client,
  memory,
  history = [],
}: {
  client: WorkshopClient;
  memory: MemoryViewModel;
  history?: readonly RevisionView<MemoryViewModel>[];
}) {
  const [current, setCurrent] = useState(memory);
  const [error, setError] = useState<unknown>();
  const [deleted, setDeleted] = useState(false);
  async function remove() {
    try {
      await callWorkshop(client, 'delete_memory', {
        slug: current.slug,
        expectedRevision: current.revision,
        idempotencyKey: `delete-memory-${current.slug}-${current.revision}`,
      });
      setDeleted(true);
    } catch (cause) {
      setError(cause);
    }
  }
  if (deleted) return <EmptyState title="Memory deleted" />;
  return (
    <>
      <MemoryView memory={current} />
      <MemoryEditor client={client} memory={current} onSaved={setCurrent} />
      <button type="button" onClick={() => void remove()}>
        Delete Memory
      </button>
      {error ? <OperationError error={error} /> : null}
      <RevisionHistory
        revisions={history}
        render={(value) => <MemoryView memory={value} />}
      />
    </>
  );
}

export function TaskEditor({
  client,
  task,
  onSaved,
}: {
  client: WorkshopClient;
  task?: TaskViewModel;
  onSaved?: (value: TaskViewModel) => void;
}) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [prompt, setPrompt] = useState(task?.prompt ?? '');
  const [error, setError] = useState<unknown>();
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    try {
      onSaved?.(
        await callWorkshop<Readonly<Record<string, unknown>>, TaskViewModel>(
          client,
          task ? 'update_task' : 'create_task',
          task
            ? {
                taskId: task.id,
                expectedRevision: task.revision,
                ...(task.lease?.leaseToken
                  ? { leaseToken: task.lease.leaseToken }
                  : {}),
                patch: { title, description, prompt },
              }
            : {
                idempotencyKey: `task-${crypto.randomUUID()}`,
                description,
                prompt,
                data: { title },
              },
        ),
      );
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <form className="ws-editor" onSubmit={(event) => void submit(event)}>
      <h2>{task ? 'Edit Task' : 'Create Task'}</h2>
      <label>
        Title
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label>
        Description
        <textarea
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <label>
        Prompt
        <textarea
          required
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </label>
      <button type="submit">Save Task</button>
      {error ? <OperationError error={error} /> : null}
    </form>
  );
}

export function TaskWorkspace({
  client,
  task,
  packet,
  history = [],
}: {
  client: WorkshopClient;
  task: TaskViewModel;
  packet?: TaskPacketView;
  history?: readonly RevisionView<TaskViewModel>[];
}) {
  const [current, setCurrent] = useState(task);
  const [error, setError] = useState<unknown>();
  const resultId = useId();
  const [result, setResult] = useState('');

  async function act(
    operation: 'claim_task' | 'release_task' | 'archive_task' | 'complete_task',
    input: Readonly<Record<string, unknown>>,
  ) {
    setError(undefined);
    try {
      setCurrent(
        await callWorkshop<Readonly<Record<string, unknown>>, TaskViewModel>(
          client,
          operation,
          input,
        ),
      );
    } catch (cause) {
      setError(cause);
    }
  }

  return (
    <section aria-labelledby="task-workspace-heading">
      <h1 id="task-workspace-heading">Task workspace</h1>
      <TaskView task={current} />
      <TaskEditor client={client} task={current} onSaved={setCurrent} />
      <div className="ws-actions">
        <button
          type="button"
          onClick={() => void act('claim_task', { taskId: current.id })}
        >
          Claim Task
        </button>
        <button
          type="button"
          onClick={() =>
            void act('release_task', {
              taskId: current.id,
              leaseToken: current.lease?.leaseToken ?? '',
              expectedRevision: current.revision,
              idempotencyKey: `release-task-${current.id}-${current.revision}`,
            })
          }
        >
          Release my claim
        </button>
        <button
          type="button"
          onClick={() =>
            void act('archive_task', {
              taskId: current.id,
              expectedRevision: current.revision,
              ...(current.lease?.leaseToken
                ? { leaseToken: current.lease.leaseToken }
                : {}),
            })
          }
        >
          Archive Task
        </button>
      </div>
      <label htmlFor={resultId}>Completion result</label>
      <textarea
        id={resultId}
        value={result}
        onChange={(event) => setResult(event.target.value)}
      />
      <button
        type="button"
        disabled={!result.trim()}
        onClick={() =>
          void act('complete_task', {
            taskId: current.id,
            leaseToken: current.lease?.leaseToken ?? '',
            expectedRevision: current.revision,
            idempotencyKey: `complete-task-${current.id}-${current.revision}`,
            result,
          })
        }
      >
        Complete Task
      </button>
      {error ? <OperationError error={error} /> : null}
      {packet ? <TaskPacketViewComponent packet={packet} /> : null}
      <RevisionHistory
        revisions={history}
        render={(value) => <TaskView task={value} />}
      />
    </section>
  );
}

export function TaskList({
  tasks,
  onOpen,
}: {
  tasks: readonly TaskViewModel[];
  onOpen?: (task: TaskViewModel) => void;
}) {
  if (!tasks.length) return <EmptyState title="No tasks" />;
  return (
    <ul className="ws-result-list">
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskView task={task} />
          {onOpen ? (
            <button type="button" onClick={() => onOpen(task)}>
              Open Task
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function useOperationList<T>(
  client: WorkshopClient,
  operationName: 'list_tasks' | 'list_memories' | 'list_prompts',
) {
  const operation = useWorkshopOperation<
    Readonly<Record<string, never>>,
    { items: readonly T[]; cursor: string | null }
  >(client, operationName);
  const run = operation.run;
  useEffect(() => {
    void run({}).catch(() => undefined);
  }, [run]);
  return {
    ...operation,
    values:
      operation.state.status === 'success' ? operation.state.value.items : [],
  };
}

export function ResourceBrowser({ client }: { client: WorkshopClient }) {
  const [resourceId, setResourceId] = useState('');
  const [resource, setResource] = useState<ResourcePreviewView>();
  const [history, setHistory] = useState<
    readonly RevisionView<ResourcePreviewView>[]
  >([]);
  const [error, setError] = useState<unknown>();

  async function open(id: string) {
    setError(undefined);
    try {
      const [value, revisions] = await Promise.all([
        callWorkshop<{ resourceId: string }, ResourcePreviewView>(
          client,
          'get_resource',
          { resourceId: id },
        ),
        callWorkshop<
          { resourceId: string },
          readonly RevisionView<ResourcePreviewView>[]
        >(client, 'resource_history', { resourceId: id }),
      ]);
      setResource(value);
      setHistory(revisions);
    } catch (cause) {
      setError(cause);
    }
  }

  async function remove() {
    if (!resource) return;
    setError(undefined);
    try {
      await callWorkshop(client, 'delete_resource', {
        resourceId: resource.id,
        expectedRevision: resource.revision,
        idempotencyKey: `delete-resource-${resource.id}-${resource.revision}`,
      });
      setResource(undefined);
    } catch (cause) {
      setError(cause);
    }
  }

  return (
    <section aria-labelledby="resource-browser-heading">
      <h1 id="resource-browser-heading">Resources</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void open(resourceId);
        }}
      >
        <label>
          Resource ID
          <input
            required
            value={resourceId}
            onChange={(event) => setResourceId(event.target.value)}
          />
        </label>
        <button type="submit">Open Resource</button>
      </form>
      {!resource ? <ResourceEditor client={client} /> : null}
      {resource ? (
        <>
          <ResourcePayloadPreview
            client={client}
            resourceId={resource.id}
            revision={resource.revision}
          />
          <ResourceEditor
            client={client}
            resource={resource}
            onSaved={setResource}
          />
          <button type="button" onClick={() => void remove()}>
            Delete Resource
          </button>
          <RevisionHistory
            revisions={history}
            render={(value) => <ResourceView resource={value} />}
          />
        </>
      ) : null}
      {error ? <OperationError error={error} /> : null}
    </section>
  );
}

export function AnnotationBrowser({ client }: { client: WorkshopClient }) {
  const [annotationId, setAnnotationId] = useState('');
  const [annotation, setAnnotation] = useState<AnnotationViewModel>();
  const [history, setHistory] = useState<
    readonly RevisionView<AnnotationViewModel>[]
  >([]);
  const [error, setError] = useState<unknown>();

  async function open(id: string) {
    setError(undefined);
    try {
      const [value, revisions] = await Promise.all([
        callWorkshop<{ annotationId: string }, AnnotationViewModel>(
          client,
          'get_annotation',
          { annotationId: id },
        ),
        callWorkshop<
          { annotationId: string },
          readonly RevisionView<AnnotationViewModel>[]
        >(client, 'annotation_history', { annotationId: id }),
      ]);
      setAnnotation(value);
      setHistory(revisions);
    } catch (cause) {
      setError(cause);
    }
  }

  async function remove() {
    if (!annotation) return;
    setError(undefined);
    try {
      await callWorkshop(client, 'delete_annotation', {
        annotationId: annotation.id,
        expectedRevision: annotation.revision,
        idempotencyKey: `delete-annotation-${annotation.id}-${annotation.revision}`,
      });
      setAnnotation(undefined);
    } catch (cause) {
      setError(cause);
    }
  }

  return (
    <section aria-labelledby="annotation-browser-heading">
      <h1 id="annotation-browser-heading">Annotations</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void open(annotationId);
        }}
      >
        <label>
          Annotation ID
          <input
            required
            value={annotationId}
            onChange={(event) => setAnnotationId(event.target.value)}
          />
        </label>
        <button type="submit">Open Annotation</button>
      </form>
      {!annotation ? <AnnotationEditor client={client} /> : null}
      {annotation ? (
        <>
          <AnnotationEditor
            client={client}
            annotation={annotation}
            onSaved={setAnnotation}
          />
          <button type="button" onClick={() => void remove()}>
            Delete Annotation
          </button>
          <RevisionHistory
            revisions={history}
            render={(value) => <AnnotationView annotation={value} />}
          />
        </>
      ) : null}
      {error ? <OperationError error={error} /> : null}
    </section>
  );
}

export function PromptBrowser({ client }: { client: WorkshopClient }) {
  const prompts = useOperationList<PromptViewModel>(client, 'list_prompts');
  const [selectedId, setSelectedId] = useState<string>();
  if (prompts.state.status === 'loading') return <LoadingState />;
  if (prompts.state.status === 'error')
    return <OperationError error={prompts.state.error} />;
  const values = prompts.values;
  return (
    <section aria-labelledby="prompt-browser-heading">
      <h1 id="prompt-browser-heading">Prompts</h1>
      {!values.length ? (
        <EmptyState title="No prompts" />
      ) : (
        <ul className="ws-result-list">
          {values.map((value) => (
            <li key={value.id}>
              <PromptView prompt={value} />
              <button type="button" onClick={() => setSelectedId(value.id)}>
                Open Prompt
              </button>
            </li>
          ))}
        </ul>
      )}
      {selectedId ? (
        <PromptWorkspace client={client} promptId={selectedId} />
      ) : null}
    </section>
  );
}

export function MemoryBrowser({ client }: { client: WorkshopClient }) {
  const memories = useOperationList<MemoryViewModel>(client, 'list_memories');
  const [memory, setMemory] = useState<MemoryViewModel>();
  const [history, setHistory] = useState<
    readonly RevisionView<MemoryViewModel>[]
  >([]);
  const [error, setError] = useState<unknown>();

  async function open(slug: string) {
    setError(undefined);
    try {
      const [value, revisions] = await Promise.all([
        callWorkshop<{ slug: string }, MemoryViewModel>(client, 'get_memory', {
          slug,
        }),
        callWorkshop<
          { slug: string; limit: number },
          readonly RevisionView<MemoryViewModel>[]
        >(client, 'memory_history', { slug, limit: 50 }),
      ]);
      setMemory(value);
      setHistory(revisions);
    } catch (cause) {
      setError(cause);
    }
  }

  if (memories.state.status === 'loading') return <LoadingState />;
  if (memories.state.status === 'error')
    return <OperationError error={memories.state.error} />;
  const values = memories.values;
  return (
    <section aria-labelledby="memory-browser-heading">
      <h1 id="memory-browser-heading">Memories</h1>
      {!values.length ? (
        <EmptyState title="No memories" />
      ) : (
        <ul className="ws-result-list">
          {values.map((value) => (
            <li key={value.slug}>
              <MemoryView memory={value} />
              <button type="button" onClick={() => void open(value.slug)}>
                Open Memory
              </button>
            </li>
          ))}
        </ul>
      )}
      {memory ? (
        <MemoryWorkspace client={client} memory={memory} history={history} />
      ) : null}
      {error ? <OperationError error={error} /> : null}
    </section>
  );
}

export function TaskBrowser({ client }: { client: WorkshopClient }) {
  const tasks = useOperationList<TaskViewModel>(client, 'list_tasks');
  const [task, setTask] = useState<TaskViewModel>();
  const [packet, setPacket] = useState<TaskPacketView>();
  const [history, setHistory] = useState<
    readonly RevisionView<TaskViewModel>[]
  >([]);
  const [error, setError] = useState<unknown>();

  async function open(id: string) {
    setError(undefined);
    try {
      const [value, nextPacket, revisions] = await Promise.all([
        callWorkshop<{ taskId: string }, TaskViewModel>(client, 'get_task', {
          taskId: id,
        }),
        callWorkshop<{ taskId: string }, TaskPacketView>(
          client,
          'get_task_packet',
          { taskId: id },
        ),
        callWorkshop<
          { taskId: string; limit: number },
          readonly RevisionView<TaskViewModel>[]
        >(client, 'task_history', { taskId: id, limit: 50 }),
      ]);
      setTask(value);
      setPacket(nextPacket);
      setHistory(revisions);
    } catch (cause) {
      setError(cause);
    }
  }

  if (tasks.state.status === 'loading') return <LoadingState />;
  if (tasks.state.status === 'error')
    return <OperationError error={tasks.state.error} />;
  const values = tasks.values;
  return (
    <section aria-labelledby="task-browser-heading">
      <h1 id="task-browser-heading">Tasks</h1>
      <TaskList tasks={values} onOpen={(value) => void open(value.id)} />
      {task ? (
        <TaskWorkspace
          client={client}
          task={task}
          {...(packet ? { packet } : {})}
          history={history}
        />
      ) : null}
      {error ? <OperationError error={error} /> : null}
    </section>
  );
}

export function InstallationReadiness({ client }: { client: WorkshopClient }) {
  const readiness = useWorkshopOperation<
    Readonly<Record<string, never>>,
    ReadinessView
  >(client, 'gnolith_status');
  const run = readiness.run;
  useEffect(() => {
    void run({}).catch(() => undefined);
  }, [run]);
  if (readiness.state.status === 'loading') return <LoadingState />;
  if (readiness.state.status === 'error')
    return <OperationError error={readiness.state.error} />;
  if (readiness.state.status === 'success')
    return <ReadinessStatus readiness={readiness.state.value} />;
  return null;
}

export interface SearchAdministrationAction {
  operation: string;
  label: string;
  input: Readonly<Record<string, unknown>>;
  destructive?: boolean;
}

export function SearchAdministration({
  client,
  actions = [],
}: {
  client: WorkshopClient;
  actions?: readonly SearchAdministrationAction[];
}) {
  const inspect = useWorkshopOperation<
    { action: string },
    SearchAdministrationView
  >(client, 'search_admin');
  const runInspect = inspect.run;
  const [current, setCurrent] = useState<SearchAdministrationView>();
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    void runInspect({ action: 'health' })
      .then(setCurrent)
      .catch(() => undefined);
  }, [runInspect]);
  if (inspect.state.status === 'loading' || !current) return <LoadingState />;
  if (inspect.state.status === 'error')
    return <OperationError error={inspect.state.error} />;
  if (!current.authorized)
    return <SearchAdministrationStatus status={current} />;
  async function execute(action: SearchAdministrationAction) {
    if (
      action.destructive &&
      !window.confirm(`Run search administration action “${action.label}”?`)
    )
      return;
    setError(undefined);
    try {
      setCurrent(
        await callWorkshop(client, 'search_admin', {
          action: action.operation,
          options: action.input,
        }),
      );
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <section>
      <SearchAdministrationStatus status={current} />
      <div className="ws-actions">
        {actions.map((action) => (
          <button
            type="button"
            key={action.operation}
            className={action.destructive ? 'ws-button--danger' : undefined}
            onClick={() => void execute(action)}
          >
            {action.label}
          </button>
        ))}
      </div>
      {error ? <OperationError error={error} /> : null}
    </section>
  );
}

export function DeleteRecordButton({
  client,
  operation,
  input,
  label,
}: {
  client: WorkshopClient;
  operation: OperationName;
  input: Readonly<Record<string, unknown>>;
  label: string;
}) {
  const [error, setError] = useState<unknown>();
  async function remove() {
    try {
      await callWorkshop(client, operation, input);
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <>
      <button
        type="button"
        className="ws-button--danger"
        onClick={() => {
          if (window.confirm(`${label}?`)) void remove();
        }}
      >
        {label}
      </button>
      {error ? <OperationError error={error} /> : null}
    </>
  );
}
