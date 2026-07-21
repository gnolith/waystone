import {
  fixtureDeleted,
  fixtureItem,
  fixtureMissingLabel,
  fixtureRedirect,
} from '@gnolith/waystone/fixtures';
import { LiveEntity } from '../../live-entity';

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
  return <LiveEntity id={id} fallback={entity} />;
}
