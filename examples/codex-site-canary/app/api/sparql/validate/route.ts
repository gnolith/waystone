import { translate } from 'sparqlalgebrajs';
import { readQuery } from '../../_sparql';
import { api } from '../../_taproot';

export function POST(request: Request) {
  return api(request, async () => {
    const query = await readQuery(request);
    try {
      translate(query, { quads: true });
      return { valid: true, issues: [] };
    } catch (cause) {
      return {
        valid: false,
        issues: [
          {
            message:
              cause instanceof Error ? cause.message : 'SPARQL is invalid.',
            code: 'SPARQL_PARSE_ERROR',
          },
        ],
      };
    }
  });
}
