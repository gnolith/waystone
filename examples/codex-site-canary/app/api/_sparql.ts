import { createSparqlHandler } from '@gnolith/diamond/endpoint';
import type { SparqlQueryResult } from '@gnolith/waystone';
import { Buffer } from 'buffer';
import { EventEmitter } from 'events';
import { database, taproot } from './_taproot';

let handler: ReturnType<typeof createSparqlHandler> | undefined;

class WorkerStringDecoder {
  readonly #decoder: TextDecoder;

  constructor(encoding = 'utf-8') {
    this.#decoder = new TextDecoder(encoding);
  }

  write(value: ArrayBuffer | ArrayBufferView) {
    const bytes = ArrayBuffer.isView(value)
      ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
      : new Uint8Array(value);
    return this.#decoder.decode(bytes, { stream: true });
  }

  end(value?: ArrayBuffer | ArrayBufferView) {
    return value
      ? this.write(value) + this.#decoder.decode()
      : this.#decoder.decode();
  }
}

type RdfTerm = {
  termType: string;
  value: string;
  language?: string;
  datatype?: { value: string };
};

function sparqlJsonTerm(term: RdfTerm) {
  if (term.termType === 'NamedNode') return { type: 'uri', value: term.value };
  if (term.termType === 'BlankNode')
    return { type: 'bnode', value: term.value };
  if (term.termType === 'Literal')
    return {
      type: 'literal',
      value: term.value,
      ...(term.language ? { 'xml:lang': term.language } : {}),
      ...(!term.language && term.datatype?.value
        ? { datatype: term.datatype.value }
        : {}),
    };
  return { type: 'literal', value: term.value };
}

function nQuadTerm(term: RdfTerm) {
  if (term.termType === 'NamedNode') return `<${term.value}>`;
  if (term.termType === 'BlankNode') return `_:${term.value}`;
  const value = JSON.stringify(term.value);
  if (term.language) return `${value}@${term.language}`;
  if (term.datatype?.value) return `${value}^^<${term.datatype.value}>`;
  return value;
}

async function* serializeResult(result: {
  resultType: string;
  execute: () => Promise<unknown>;
  metadata?: () => Promise<{ variables?: RdfTerm[] }>;
}) {
  if (result.resultType === 'boolean') {
    yield JSON.stringify({ head: {}, boolean: await result.execute() });
    return;
  }
  if (result.resultType === 'bindings') {
    const metadata = await result.metadata?.();
    const variables =
      metadata?.variables?.map((variable) => variable.value) ?? [];
    const stream = (await result.execute()) as AsyncIterable<
      Iterable<[RdfTerm, RdfTerm]>
    >;
    yield `{"head":{"vars":${JSON.stringify(variables)}},"results":{"bindings":[`;
    let first = true;
    for await (const bindings of stream) {
      const row = Object.fromEntries(
        [...bindings].map(([variable, term]) => [
          variable.value,
          sparqlJsonTerm(term),
        ]),
      );
      yield `${first ? '' : ','}${JSON.stringify(row)}`;
      first = false;
    }
    yield ']}}';
    return;
  }
  const stream = (await result.execute()) as AsyncIterable<{
    subject: RdfTerm;
    predicate: RdfTerm;
    object: RdfTerm;
    graph: RdfTerm;
  }>;
  for await (const quad of stream) {
    const graph =
      quad.graph.termType === 'DefaultGraph' ? '' : ` ${nQuadTerm(quad.graph)}`;
    yield `${nQuadTerm(quad.subject)} ${nQuadTerm(quad.predicate)} ${nQuadTerm(quad.object)}${graph} .\n`;
  }
}

async function createEngine() {
  const workerGlobal = globalThis as unknown as {
    Buffer?: typeof Buffer;
    process?: {
      env: Record<string, string | undefined>;
      nextTick: (operation: () => void) => void;
    };
    require?: (specifier: string) => unknown;
  };
  workerGlobal.process ??= {
    env: {},
    nextTick: (operation) => queueMicrotask(operation),
  };
  workerGlobal.Buffer ??= Buffer;
  const workerEvents = EventEmitter as typeof EventEmitter & {
    EventEmitter?: typeof EventEmitter;
  };
  workerEvents.EventEmitter ??= EventEmitter;
  workerGlobal.require = (specifier) => {
    if (specifier.startsWith('process')) return workerGlobal.process;
    if (specifier === 'events' || specifier === 'node:events')
      return workerEvents;
    if (specifier === 'buffer' || specifier === 'node:buffer')
      return { Buffer };
    if (specifier.startsWith('string_decoder'))
      return { StringDecoder: WorkerStringDecoder };
    throw new TypeError(`Unsupported Worker module request: ${specifier}`);
  };
  const taskConsole = console as Console & {
    createTask?: (name: string) => { run<T>(operation: () => T): T };
  };
  taskConsole.createTask ??= () => ({ run: (operation) => operation() });
  try {
    const { QueryEngine } = await import('@comunica/query-sparql-rdfjs-lite');
    const engine = new QueryEngine();
    const compatible = engine as unknown as {
      getResultMediaTypes: () => Promise<Record<string, number>>;
      resultToString: (
        result: Parameters<typeof serializeResult>[0],
      ) => Promise<{ data: AsyncIterable<string> }>;
    };
    compatible.getResultMediaTypes = async () => ({
      'application/sparql-results+json': 1,
      'application/n-quads': 1,
    });
    compatible.resultToString = async (result) => ({
      data: serializeResult(result),
    });
    return engine;
  } catch (error) {
    console.error('SPARQL engine initialization failed', error);
    throw error;
  }
}

async function queryText(request: Request): Promise<string> {
  const value = (await request.json()) as { query?: unknown };
  if (typeof value.query !== 'string' || !value.query.trim())
    throw new TypeError('A non-empty SPARQL query is required.');
  return value.query;
}

export async function executeSparql(
  request: Request,
): Promise<SparqlQueryResult> {
  await taproot(request);
  handler ??= createSparqlHandler({
    db: await database(),
    engine: createEngine(),
    readOnly: true,
    exposeErrors: true,
    timeoutMs: 5_000,
    maxResultBytes: 512 * 1024,
  });
  const query = await queryText(request);
  const started = performance.now();
  const response = await handler(
    new Request(request.url, {
      method: 'POST',
      headers: {
        accept: 'application/sparql-results+json, application/n-quads;q=0.9',
        'content-type': 'application/sparql-query',
      },
      body: query,
      signal: request.signal,
    }),
  );
  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new TypeError(body.error ?? 'SPARQL query failed.');
  }
  const elapsedMs = Math.max(0, Math.round(performance.now() - started));
  const mediaType = response.headers.get('content-type') ?? '';
  if (!mediaType.includes('application/sparql-results+json'))
    return {
      kind: 'rdf',
      mediaType: mediaType.split(';', 1)[0] ?? 'text/plain',
      data: await response.text(),
      elapsedMs,
    };
  const body = (await response.json()) as {
    head?: { vars?: string[] };
    results?: {
      bindings?: Record<
        string,
        import('@gnolith/waystone').SparqlBindingValue
      >[];
    };
    boolean?: boolean;
  };
  if (typeof body.boolean === 'boolean')
    return { kind: 'boolean', value: body.boolean, elapsedMs };
  return {
    kind: 'bindings',
    variables: body.head?.vars ?? [],
    bindings: body.results?.bindings ?? [],
    elapsedMs,
  };
}

export async function readQuery(request: Request): Promise<string> {
  return queryText(request);
}
