import { executeSparql } from '../../_sparql';
import { api } from '../../_taproot';

export function POST(request: Request) {
  return api(request, () => executeSparql(request));
}
