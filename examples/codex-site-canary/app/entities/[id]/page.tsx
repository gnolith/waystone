import {
  fixtureDeleted,
  fixtureItem,
  fixtureMissingLabel,
  fixtureRedirect,
} from '@gnolith/waystone/fixtures';
import { FixtureEntity } from '../../fixture-entity';

export default async function EntityRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entity =
    id === 'Q2'
      ? fixtureMissingLabel
      : id === 'Q3'
        ? fixtureDeleted
        : id === 'Q4'
          ? fixtureRedirect
          : fixtureItem;
  return <FixtureEntity entity={entity} />;
}
