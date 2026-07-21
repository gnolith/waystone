import { api } from '../_taproot';
import { executeSparql } from '../_sparql';

export function POST(request: Request) {
  return api(request, () => executeSparql(request));
}
