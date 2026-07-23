'use client';

import type { ReactNode } from 'react';
import { EntityWorkspace, SparqlEditor } from './client-components.js';
import {
  AnnotationEditor,
  InstallationReadiness,
  MemoryWorkspace,
  PromptWorkspace,
  ResourceEditor,
  ResourcePayloadPreview,
  SearchAdministration,
  TaskWorkspace,
  UnifiedSearchScreen,
  type SearchAdministrationAction,
} from './knowledge-client-components.js';
import {
  AnnotationView,
  MemoryView,
  PromptView,
  ResourceView,
  TaskView,
} from './knowledge-components.js';
import {
  EmptyState,
  WaystoneShell,
  type WaystoneNavigationItem,
} from './components.js';
import type {
  AnnotationViewModel,
  EntityRevisionPage,
  MemoryViewModel,
  PromptViewModel,
  ResourcePreviewView,
  RevisionView,
  TaskPacketView,
  TaskViewModel,
  WikibaseEntity,
  WorkshopClient,
} from './model.js';

export interface WaystoneApplicationShellProps {
  title?: string;
  navigation?: readonly WaystoneNavigationItem[];
  children: ReactNode;
  commandArea?: ReactNode;
  footer?: ReactNode;
}

export function WaystoneApplicationShell({
  title = 'Gnolith',
  navigation = [],
  children,
  commandArea,
  footer,
}: WaystoneApplicationShellProps) {
  return (
    <WaystoneShell
      title={title}
      navigation={navigation}
      commandArea={commandArea}
      footer={footer}
    >
      {children}
    </WaystoneShell>
  );
}

export function ResultPresentation({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <section aria-labelledby="result-presentation-heading">
      <h1 id="result-presentation-heading">{title}</h1>
      {children ?? <EmptyState title="No result was provided" />}
    </section>
  );
}

export function EntityScreen({
  client,
  entity,
  revisions,
}: {
  client: WorkshopClient;
  entity: WikibaseEntity;
  revisions?: EntityRevisionPage;
}) {
  return (
    <EntityWorkspace
      client={client}
      entity={entity}
      {...(revisions ? { revisions } : {})}
    />
  );
}

export function SearchScreen({ client }: { client: WorkshopClient }) {
  return <UnifiedSearchScreen client={client} />;
}

export function ResourceScreen({
  client,
  resource,
}: {
  client: WorkshopClient;
  resource: ResourcePreviewView;
}) {
  return (
    <>
      <ResourceView resource={resource} />
      <ResourceEditor client={client} resource={resource} />
      <ResourcePayloadPreview client={client} resourceId={resource.id} />
    </>
  );
}

export function AnnotationScreen({
  client,
  annotation,
}: {
  client: WorkshopClient;
  annotation: AnnotationViewModel;
}) {
  return (
    <>
      <AnnotationView annotation={annotation} />
      <AnnotationEditor client={client} annotation={annotation} />
    </>
  );
}

export function PromptScreen({
  client,
  prompt,
}: {
  client: WorkshopClient;
  prompt: PromptViewModel;
}) {
  return (
    <>
      <PromptView prompt={prompt} />
      <PromptWorkspace client={client} promptId={prompt.id} />
    </>
  );
}

export function MemoryScreen({
  client,
  memory,
  history,
}: {
  client: WorkshopClient;
  memory: MemoryViewModel;
  history?: readonly RevisionView<MemoryViewModel>[];
}) {
  return (
    <>
      <MemoryView memory={memory} />
      <MemoryWorkspace
        client={client}
        memory={memory}
        {...(history ? { history } : {})}
      />
    </>
  );
}

export function TaskScreen({
  client,
  task,
  packet,
  history,
}: {
  client: WorkshopClient;
  task: TaskViewModel;
  packet?: TaskPacketView;
  history?: readonly RevisionView<TaskViewModel>[];
}) {
  return (
    <>
      <TaskView task={task} />
      <TaskWorkspace
        client={client}
        task={task}
        {...(packet ? { packet } : {})}
        {...(history ? { history } : {})}
      />
    </>
  );
}

export function SparqlScreen({ client }: { client: WorkshopClient }) {
  return <SparqlEditor client={client} />;
}

export function ReadinessScreen({ client }: { client: WorkshopClient }) {
  return <InstallationReadiness client={client} />;
}

export function SearchOperationsScreen({
  client,
  actions,
}: {
  client: WorkshopClient;
  actions?: readonly SearchAdministrationAction[];
}) {
  return (
    <SearchAdministration client={client} {...(actions ? { actions } : {})} />
  );
}
