'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import {
  EmptyState,
  EntityPage,
  InstalledModuleSummary,
  KnowledgeSummary,
  RecentChanges,
  WaystoneShell,
  WaystoneNavigation,
  type WaystoneNavigationItem,
} from './components.js';
import { EntitySearch, SparqlEditor } from './client-components.js';
import {
  AnnotationEditor,
  HostOperationsPanel,
  PromptEditor,
  ResourceEditor,
  SearchAdministration,
  UnifiedSearchScreen,
} from './knowledge-client-components.js';
import {
  AnnotationView,
  ContentHistory,
  PromptView,
  ResourceView,
} from './knowledge-components.js';
import {
  WaystoneExtensionPoint,
  WaystonePluginProvider,
} from './plugin-components.js';
import type {
  EntityRevisionMetadata,
  TaprootAnnotation,
  ContentRevisionMetadata,
  HostOperation,
  WorkshopPrompt,
  TaprootResource,
  SearchHealth,
  WaystoneClient,
  WaystoneObservability,
  WaystoneSessionDisplay,
  WikibaseEntity,
} from './model.js';
import type { WaystoneRegistry } from './plugin-contracts.js';

const baseNavigation: WaystoneNavigationItem[] = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'search', label: 'Search', href: '/search' },
  { id: 'entities', label: 'Entities', href: '/entities' },
  { id: 'sparql', label: 'SPARQL', href: '/sparql' },
];

function ObservedNavigation({
  items,
  currentPath,
  observability,
}: {
  items: readonly WaystoneNavigationItem[];
  currentPath?: string;
  observability?: WaystoneObservability;
}) {
  return (
    <div
      onClick={(event) => {
        const target = event.target as Element;
        const anchor = target.closest<HTMLAnchorElement>(
          'a[data-waystone-navigation-id]',
        );
        if (anchor)
          observability?.onNavigation?.({
            href: anchor.getAttribute('href') ?? anchor.href,
            ...(anchor.dataset.waystoneNavigationId
              ? { contributionId: anchor.dataset.waystoneNavigationId }
              : {}),
          });
      }}
    >
      <WaystoneNavigation
        items={items}
        {...(currentPath ? { currentPath } : {})}
      />
    </div>
  );
}

export function GnolithShell({
  registry,
  client,
  title,
  subtitle,
  currentPath,
  session,
  observability,
  children,
}: {
  registry: WaystoneRegistry;
  client?: WaystoneClient;
  title: string;
  subtitle?: string;
  currentPath?: string;
  session?: WaystoneSessionDisplay;
  observability?: WaystoneObservability;
  children: ReactNode;
}) {
  const pluginNavigation = registry.navigation.map(
    ({ pluginId, contribution }) => ({
      id: `${pluginId}:${contribution.id}`,
      label: contribution.label,
      href: contribution.href,
    }),
  );
  const navigation = [...baseNavigation, ...pluginNavigation];
  return (
    <WaystonePluginProvider
      registry={registry}
      context={{
        ...(client ? { client } : {}),
        ...(session?.capabilities
          ? { capabilities: session.capabilities }
          : {}),
      }}
      {...(observability ? { observability } : {})}
    >
      <WaystoneShell
        title={title}
        {...(subtitle ? { subtitle } : {})}
        navigation={navigation}
        {...(currentPath ? { currentPath } : {})}
        {...(session ? { session } : {})}
        navigationSlot={
          <ObservedNavigation
            items={navigation}
            {...(currentPath ? { currentPath } : {})}
            {...(observability ? { observability } : {})}
          />
        }
      >
        {children}
      </WaystoneShell>
    </WaystonePluginProvider>
  );
}

export function GnolithEmptyState({
  onStart,
  extensions,
}: {
  onStart?: () => void;
  extensions?: ReactNode;
}) {
  return (
    <EmptyState
      title="Begin the knowledge base"
      action={
        onStart && (
          <button type="button" onClick={onStart}>
            Start onboarding
          </button>
        )
      }
    >
      <p>
        Describe the research scope, then add the first topics, people, places,
        objects, and sources.
      </p>
      {extensions}
    </EmptyState>
  );
}
export interface OnboardingInput {
  subject: string;
  scope: string;
  language: string;
  startingTopics: string[];
  terms: string[];
  people: string[];
  places: string[];
  objects: string[];
  sources: string[];
}
const list = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
export function GnolithOnboarding({
  onSubmit,
}: {
  onSubmit?: (input: OnboardingInput) => void | Promise<void>;
}) {
  const [subject, setSubject] = useState('');
  const [scope, setScope] = useState('');
  const [language, setLanguage] = useState('en');
  const [topics, setTopics] = useState('');
  const [terms, setTerms] = useState('');
  const [people, setPeople] = useState('');
  const [places, setPlaces] = useState('');
  const [objects, setObjects] = useState('');
  const [sources, setSources] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSubmit?.({
        subject,
        scope,
        language,
        startingTopics: list(topics),
        terms: list(terms),
        people: list(people),
        places: list(places),
        objects: list(objects),
        sources: list(sources),
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="ws-onboarding" onSubmit={(event) => void submit(event)}>
      <header>
        <p className="ws-eyebrow">Step {step + 1} of 3</p>
        <h1>Set up this research Site</h1>
        <progress value={step + 1} max={3}>
          Step {step + 1} of 3
        </progress>
      </header>
      {step === 0 && (
        <fieldset>
          <legend>Research scope</legend>
          <label>
            Research subject
            <input
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </label>
          <label>
            Scope clarification
            <textarea
              required
              value={scope}
              onChange={(event) => setScope(event.target.value)}
            />
          </label>
          <label>
            Default language
            <input
              required
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              pattern="[A-Za-z0-9-]+"
            />
          </label>
        </fieldset>
      )}
      {step === 1 && (
        <fieldset>
          <legend>Starting knowledge</legend>
          <label>
            Topics, one per line
            <textarea
              value={topics}
              onChange={(event) => setTopics(event.target.value)}
            />
          </label>
          <label>
            Terms, one per line
            <textarea
              value={terms}
              onChange={(event) => setTerms(event.target.value)}
            />
          </label>
          <label>
            People, one per line
            <textarea
              value={people}
              onChange={(event) => setPeople(event.target.value)}
            />
          </label>
          <label>
            Places, one per line
            <textarea
              value={places}
              onChange={(event) => setPlaces(event.target.value)}
            />
          </label>
          <label>
            Objects, one per line
            <textarea
              value={objects}
              onChange={(event) => setObjects(event.target.value)}
            />
          </label>
        </fieldset>
      )}
      {step === 2 && (
        <fieldset>
          <legend>Existing sources</legend>
          <label>
            Sources or research, one per line
            <textarea
              value={sources}
              onChange={(event) => setSources(event.target.value)}
            />
          </label>
          <WaystoneExtensionPoint
            name="onboardingSteps"
            empty={
              <p className="ws-muted">
                No module-specific steps are installed.
              </p>
            }
          />
        </fieldset>
      )}
      <div className="ws-actions">
        {step > 0 && (
          <button type="button" onClick={() => setStep((value) => value - 1)}>
            Back
          </button>
        )}
        {step < 2 ? (
          <button
            type="button"
            onClick={() => setStep((value) => value + 1)}
            disabled={
              step === 0 &&
              (!subject.trim() || !scope.trim() || !language.trim())
            }
          >
            Continue
          </button>
        ) : (
          <button type="submit" disabled={busy}>
            {busy ? 'Finishing…' : 'Finish setup'}
          </button>
        )}
      </div>
    </form>
  );
}

export function GnolithHome({
  client,
  empty = false,
  summary,
  revisions = [],
  modules = [],
}: {
  client: WaystoneClient;
  empty?: boolean;
  summary?: { items: number; properties: number; statements: number };
  revisions?: readonly EntityRevisionMetadata[];
  modules?: readonly { id: string; label: string; version?: string }[];
}) {
  if (empty)
    return (
      <GnolithEmptyState
        extensions={<WaystoneExtensionPoint name="dashboardPanels" />}
      />
    );
  return (
    <div className="ws-dashboard">
      <header>
        <p className="ws-eyebrow">Research knowledge</p>
        <h1>Knowledge at a glance</h1>
      </header>
      <EntitySearch client={client} />
      <div className="ws-dashboard__grid">
        {summary && <KnowledgeSummary {...summary} />}
        <RecentChanges revisions={revisions} />
        <InstalledModuleSummary modules={modules} />
      </div>
      <WaystoneExtensionPoint name="dashboardPanels" />
    </div>
  );
}
export function GnolithEntityPage({
  entity,
  actions,
}: {
  entity: WikibaseEntity;
  actions?: ReactNode;
}) {
  return (
    <EntityPage
      entity={entity}
      actions={actions}
      panels={<WaystoneExtensionPoint name="entityPanels" entity={entity} />}
    />
  );
}
export const GnolithPropertyPage = GnolithEntityPage;
export function SparqlPage({ client }: { client: WaystoneClient }) {
  return (
    <div>
      <header>
        <p className="ws-eyebrow">Query workspace</p>
        <h1>SPARQL</h1>
        <p>Validate and inspect the Site’s RDF projection.</p>
      </header>
      <SparqlEditor client={client} />
    </div>
  );
}

export function SearchPage({ client }: { client: WaystoneClient }) {
  return <UnifiedSearchScreen client={client} />;
}

export function ResourcePage({
  client,
  resource,
  revisions = [],
  editable = false,
}: {
  client: WaystoneClient;
  resource: TaprootResource;
  revisions?: readonly ContentRevisionMetadata[];
  editable?: boolean;
}) {
  return (
    <div>
      <ResourceView resource={resource} />
      {editable && <ResourceEditor client={client} resource={resource} />}
      <ContentHistory revisions={revisions} />
    </div>
  );
}

export function AnnotationPage({
  client,
  annotation,
  revisions = [],
  editable = false,
}: {
  client: WaystoneClient;
  annotation: TaprootAnnotation;
  revisions?: readonly ContentRevisionMetadata[];
  editable?: boolean;
}) {
  return (
    <div>
      <AnnotationView annotation={annotation} />
      {editable && <AnnotationEditor client={client} annotation={annotation} />}
      <ContentHistory revisions={revisions} />
    </div>
  );
}

export function PromptPage({
  client,
  prompt,
  revisions = [],
  editable = false,
}: {
  client: WaystoneClient;
  prompt: WorkshopPrompt;
  revisions?: readonly ContentRevisionMetadata[];
  editable?: boolean;
}) {
  return (
    <div>
      <PromptView prompt={prompt} />
      {editable && <PromptEditor client={client} prompt={prompt} />}
      <ContentHistory revisions={revisions} />
    </div>
  );
}

export function SearchOperationsPage({
  client,
  health,
}: {
  client: WaystoneClient;
  health: SearchHealth;
}) {
  return <SearchAdministration client={client} health={health} />;
}

export function SiteDataOperationsPage({
  client,
  operations = [],
}: {
  client: WaystoneClient;
  operations?: readonly HostOperation[];
}) {
  return <HostOperationsPanel client={client} initialOperations={operations} />;
}
