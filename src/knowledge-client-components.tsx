'use client';

import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
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
  const [language, setLanguage] = useState('');
  const [kinds, setKinds] = useState<readonly SearchKind[]>(SEARCH_KINDS);
  const [page, setPage] = useState<SearchPageView>();
  const [hydrated, setHydrated] = useState<unknown>();
  const search = useWorkshopOperation<SearchRequestView, SearchPageView>(
    client,
    'search.query',
  );
  const hydrate = useWorkshopOperation<SearchResultView, unknown>(
    client,
    'search.hydrate',
  );

  const selectedKinds = useMemo(() => new Set(kinds), [kinds]);
  async function submit(event?: FormEvent, cursor?: string) {
    event?.preventDefault();
    try {
      const next = await search.run({
        text: query,
        kinds,
        filters: language ? { languages: [language] } : {},
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
      setHydrated(await hydrate.run(result));
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
        <label>
          Language
          <input
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
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
  maxBytes = 64 * 1024,
}: {
  client: WorkshopClient;
  resourceId: string;
  maxBytes?: number;
}) {
  const operation = useWorkshopOperation<
    { id: string; maxBytes: number },
    ResourcePreviewView
  >(client, 'resource.payload.get');
  const run = operation.run;
  useEffect(() => {
    void run({ id: resourceId, maxBytes }).catch(() => undefined);
  }, [maxBytes, resourceId, run]);
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
          id: string;
          itemId: string;
          title?: string;
          mediaType: string;
          text: string;
          expectedRevision?: number;
        },
        ResourcePreviewView
      >(client, resource ? 'resource.update' : 'resource.create', {
        id,
        itemId,
        ...(title ? { title } : {}),
        mediaType,
        text,
        ...(resource ? { expectedRevision: resource.revision } : {}),
      });
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
          annotation ? 'annotation.update' : 'annotation.create',
          {
            id,
            bodyText,
            targetKind,
            targetId,
            ...(annotation ? { expectedRevision: annotation.revision } : {}),
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
        await callWorkshop(client, prompt ? 'prompt.update' : 'prompt.create', {
          ...(prompt
            ? { id: prompt.id, expectedRevision: prompt.revision }
            : {}),
          name,
          title,
          promptText,
          variables: parsed,
        }),
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
      callWorkshop<{ id: string }, PromptViewModel>(
        client,
        'prompt.get',
        { id: promptId },
        { signal: controller.signal },
      ),
      callWorkshop<
        { id: string; limit: number },
        readonly RevisionView<PromptViewModel>[]
      >(
        client,
        'prompt.history',
        { id: promptId, limit: 50 },
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
      await callWorkshop(client, 'prompt.delete', {
        id: prompt.id,
        expectedRevision: prompt.revision,
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
        await callWorkshop(client, 'memory.update', {
          slug,
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
      await callWorkshop(client, 'memory.delete', {
        slug: current.slug,
        expectedRevision: current.revision,
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
        await callWorkshop(client, task ? 'task.update' : 'task.create', {
          ...(task ? { id: task.id, expectedRevision: task.revision } : {}),
          title,
          description,
          prompt,
        }),
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
    operation: string,
    input: Readonly<Record<string, unknown>>,
  ) {
    setError(undefined);
    try {
      setCurrent(
        await callWorkshop(client, operation, {
          id: current.id,
          expectedRevision: current.revision,
          ...input,
        }),
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
        <button type="button" onClick={() => void act('task.claim', {})}>
          Claim Task
        </button>
        <button
          type="button"
          onClick={() =>
            void act('task.release', {
              ownerPrincipalId: current.lease?.ownerPrincipalId,
              idempotent: true,
            })
          }
        >
          Release my claim
        </button>
        <button type="button" onClick={() => void act('task.archive', {})}>
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
        onClick={() => void act('task.complete', { result })}
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

function useOperationList<T>(client: WorkshopClient, operationName: string) {
  const operation = useWorkshopOperation<
    Readonly<Record<string, never>>,
    readonly T[]
  >(client, operationName);
  const run = operation.run;
  useEffect(() => {
    void run({}).catch(() => undefined);
  }, [run]);
  return operation;
}

export function ResourceBrowser({ client }: { client: WorkshopClient }) {
  const resources = useOperationList<ResourcePreviewView>(
    client,
    'resource.list',
  );
  const [resource, setResource] = useState<ResourcePreviewView>();
  const [history, setHistory] = useState<
    readonly RevisionView<ResourcePreviewView>[]
  >([]);
  const [error, setError] = useState<unknown>();

  async function open(id: string) {
    setError(undefined);
    try {
      const [value, revisions] = await Promise.all([
        callWorkshop<{ id: string }, ResourcePreviewView>(
          client,
          'resource.get',
          { id },
        ),
        callWorkshop<
          { id: string; limit: number },
          readonly RevisionView<ResourcePreviewView>[]
        >(client, 'resource.history', { id, limit: 50 }),
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
      await callWorkshop(client, 'resource.delete', {
        id: resource.id,
        expectedRevision: resource.revision,
      });
      setResource(undefined);
    } catch (cause) {
      setError(cause);
    }
  }

  if (resources.state.status === 'loading') return <LoadingState />;
  if (resources.state.status === 'error')
    return <OperationError error={resources.state.error} />;
  const values =
    resources.state.status === 'success' ? resources.state.value : [];
  return (
    <section aria-labelledby="resource-browser-heading">
      <h1 id="resource-browser-heading">Resources</h1>
      {!values.length ? (
        <EmptyState title="No resources" />
      ) : (
        <ul className="ws-result-list">
          {values.map((value) => (
            <li key={value.id}>
              <ResourceView resource={value} />
              <button type="button" onClick={() => void open(value.id)}>
                Open Resource
              </button>
            </li>
          ))}
        </ul>
      )}
      {resource ? (
        <>
          <ResourcePayloadPreview client={client} resourceId={resource.id} />
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
  const annotations = useOperationList<AnnotationViewModel>(
    client,
    'annotation.list',
  );
  const [annotation, setAnnotation] = useState<AnnotationViewModel>();
  const [history, setHistory] = useState<
    readonly RevisionView<AnnotationViewModel>[]
  >([]);
  const [error, setError] = useState<unknown>();

  async function open(id: string) {
    setError(undefined);
    try {
      const [value, revisions] = await Promise.all([
        callWorkshop<{ id: string }, AnnotationViewModel>(
          client,
          'annotation.get',
          { id },
        ),
        callWorkshop<
          { id: string; limit: number },
          readonly RevisionView<AnnotationViewModel>[]
        >(client, 'annotation.history', { id, limit: 50 }),
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
      await callWorkshop(client, 'annotation.delete', {
        id: annotation.id,
        expectedRevision: annotation.revision,
      });
      setAnnotation(undefined);
    } catch (cause) {
      setError(cause);
    }
  }

  if (annotations.state.status === 'loading') return <LoadingState />;
  if (annotations.state.status === 'error')
    return <OperationError error={annotations.state.error} />;
  const values =
    annotations.state.status === 'success' ? annotations.state.value : [];
  return (
    <section aria-labelledby="annotation-browser-heading">
      <h1 id="annotation-browser-heading">Annotations</h1>
      {!values.length ? (
        <EmptyState title="No annotations" />
      ) : (
        <ul className="ws-result-list">
          {values.map((value) => (
            <li key={value.id}>
              <AnnotationView annotation={value} />
              <button type="button" onClick={() => void open(value.id)}>
                Open Annotation
              </button>
            </li>
          ))}
        </ul>
      )}
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
  const prompts = useOperationList<PromptViewModel>(client, 'prompt.list');
  const [selectedId, setSelectedId] = useState<string>();
  if (prompts.state.status === 'loading') return <LoadingState />;
  if (prompts.state.status === 'error')
    return <OperationError error={prompts.state.error} />;
  const values = prompts.state.status === 'success' ? prompts.state.value : [];
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
  const memories = useOperationList<MemoryViewModel>(client, 'memory.list');
  const [memory, setMemory] = useState<MemoryViewModel>();
  const [history, setHistory] = useState<
    readonly RevisionView<MemoryViewModel>[]
  >([]);
  const [error, setError] = useState<unknown>();

  async function open(slug: string) {
    setError(undefined);
    try {
      const [value, revisions] = await Promise.all([
        callWorkshop<{ slug: string }, MemoryViewModel>(client, 'memory.get', {
          slug,
        }),
        callWorkshop<
          { slug: string; limit: number },
          readonly RevisionView<MemoryViewModel>[]
        >(client, 'memory.history', { slug, limit: 50 }),
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
  const values =
    memories.state.status === 'success' ? memories.state.value : [];
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
  const tasks = useOperationList<TaskViewModel>(client, 'task.list');
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
        callWorkshop<{ id: string }, TaskViewModel>(client, 'task.get', {
          id,
        }),
        callWorkshop<{ id: string }, TaskPacketView>(
          client,
          'task.packet.get',
          { id },
        ),
        callWorkshop<
          { id: string; limit: number },
          readonly RevisionView<TaskViewModel>[]
        >(client, 'task.history', { id, limit: 50 }),
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
  const values = tasks.state.status === 'success' ? tasks.state.value : [];
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
  const readiness = useWorkshopOperation<undefined, ReadinessView>(
    client,
    'installation.readiness',
  );
  const run = readiness.run;
  useEffect(() => {
    void run(undefined).catch(() => undefined);
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
    Readonly<Record<string, never>>,
    SearchAdministrationView
  >(client, 'search.admin.inspect');
  const runInspect = inspect.run;
  const [current, setCurrent] = useState<SearchAdministrationView>();
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    void runInspect({})
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
        await callWorkshop(client, 'search.admin.execute', {
          action: action.operation,
          input: action.input,
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
  operation: string;
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
