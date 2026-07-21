import { fixtureProperty } from '@gnolith/waystone/fixtures';
import { LiveEntity } from '../../live-entity';

export default async function PropertyRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LiveEntity id={id} fallback={fixtureProperty} property />;
}
