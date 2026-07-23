import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  InstallationReadiness,
  TaskWorkspace,
} from '../../src/knowledge-client-components.js';
import {
  fixtureReadiness,
  fixtureTask,
  fixtureTaskPacket,
} from '../../src/fixtures.js';
import { createFakeWorkshopClient } from '../fixtures/fake-workshop-client.js';

describe('task leases and explicit operation states', () => {
  it('claims, idempotently releases the owner, completes, and archives by operation name', async () => {
    const { client, calls } = createFakeWorkshopClient({
      'task.claim': fixtureTask,
      'task.release': { ...fixtureTask, state: 'unclaimed', lease: undefined },
      'task.complete': { ...fixtureTask, state: 'completed', result: 'Done' },
      'task.archive': { ...fixtureTask, state: 'archived' },
    });
    render(
      <TaskWorkspace
        client={client}
        task={fixtureTask}
        packet={fixtureTaskPacket}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Claim Task' }));
    fireEvent.click(screen.getByRole('button', { name: 'Release my claim' }));
    fireEvent.change(screen.getByLabelText('Completion result'), {
      target: { value: 'Done' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Complete Task' }));
    fireEvent.click(screen.getByRole('button', { name: 'Archive Task' }));
    await waitFor(() => expect(calls).toHaveLength(4));
    expect(calls.map((call) => call.name)).toEqual([
      'task.claim',
      'task.release',
      'task.complete',
      'task.archive',
    ]);
    expect(calls[1]?.input).toMatchObject({
      ownerPrincipalId: 'researcher-1',
      idempotent: true,
    });
  });

  it('presents expired lease conflicts as refresh-required state', async () => {
    const { client } = createFakeWorkshopClient({
      'task.claim': () =>
        Promise.reject(
          Object.assign(new Error('hidden lease internals'), {
            code: 'conflict',
            issues: [{ secret: 'not rendered' }],
          }),
        ),
    });
    render(
      <TaskWorkspace
        client={client}
        task={{
          ...fixtureTask,
          lease: { ...fixtureTask.lease, expired: true },
        }}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/lease expired/i);
    fireEvent.click(screen.getByRole('button', { name: 'Claim Task' }));
    expect(
      await screen.findByText(/Refresh before retrying/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/hidden lease internals/),
    ).not.toBeInTheDocument();
  });

  it('loads authorization/readiness as server state', async () => {
    const { client } = createFakeWorkshopClient({
      'installation.readiness': fixtureReadiness,
    });
    render(<InstallationReadiness client={client} />);
    expect(
      await screen.findByText(/Lexical search is available/i),
    ).toBeInTheDocument();
  });

  it('renders forbidden auth revocation without leaking details', async () => {
    const { client } = createFakeWorkshopClient({
      'installation.readiness': () =>
        Promise.reject(
          Object.assign(new Error('Bearer abc.secret'), {
            code: 'forbidden',
          }),
        ),
    });
    render(<InstallationReadiness client={client} />);
    expect(await screen.findByText(/Permission denied/i)).toBeInTheDocument();
    expect(screen.queryByText(/abc.secret/)).not.toBeInTheDocument();
  });
});
