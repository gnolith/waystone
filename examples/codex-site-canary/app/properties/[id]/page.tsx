import { fixtureProperty } from '@gnolith/waystone/fixtures';
import { FixtureEntity } from '../../fixture-entity';

export default async function PropertyRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  void id;
  return <FixtureEntity entity={fixtureProperty} property />;
}
