# LLM-Friendly API for ReqAck

ReqAck is a JS library to express elastic (latency-insensitive) circuits and
generate synthesizable Verilog RTL, diagrams (SVG / Graphviz dot), and manifests.

This document proposes an alternative surface API aimed at LLM agents. **None of
the proposed API below is implemented yet** — it is a design target. The current
API is documented first, as the baseline the proposal builds on.

A good API for LLMs is:

- **Explicit** rather than magical
- **Discoverable** through clear naming and autocomplete
- **Consistent** in patterns and conventions
- **Self-documenting**, with types and examples
- **Validating**, with helpful error messages

---

## Current API (baseline)

The core in [../lib/fhyper.js](../lib/fhyper.js) is intentionally compact:
circuits, nodes, and edges are built by *calling the value returned from the
previous step*.

```js
const reqack = require('reqack');

const g    = reqack.circuit('name');          // circuit (label -> module name)
const node = g('label');                       // node    (call the circuit)
const edge = node({width: 32, capacity: 1});   // edge    (call the node)
edge(target);                                  // connect (call the edge; chains = fork)

g('+', a(), b());                              // join: extra args feed one node
```

Outputs are free functions:

```js
reqack.verilog(g, macros);   // datapath module <name> + handshake <name>_ctrl
reqack.svg(g);               // SVG (dagre layout)
reqack.dot(g);               // Graphviz dot source
reqack.manifest(g, name);    // project manifest
reqack.hls(fn)('a','b','c'); // HLS: expression -> circuit
```

**Edge capacity** selects the elastic buffer on a channel:

| capacity      | buffer | latency | notes                                     |
| ------------- | ------ | ------- | ----------------------------------------- |
| `0` / omitted | wire   | 0       | asynchronous, combinational backpressure  |
| `1`           | EB1    | 1       | async backpressure                        |
| `1.5`         | EB1.5  | 1       | synchronous backpressure, stall cap 2     |
| `1.7`         | EB1.7  | 1       | synchronous backpressure                  |
| integer `>= 2`| FIFO   | 1       | N-entry queue                             |

**Operators** — a string node label is a datapath operator, evaluated in RPN
(space-separated), consuming inputs in order (see [../lib/rpn.js](../lib/rpn.js)
and [../lib/operators.js](../lib/operators.js)):

- Binary: `+ - * / % & | ^ << >> > >= < <= == != && ||`
- Unary: `! ~`
- Also: numeric literals, `swap`, named forms (`add`, `sub`, `mul`, `and`, `or`,
  `xor`, `concat`, …)

**Why this is hard for LLMs:** the same call `g()`, `node()`, `edge()` means
different things by context; operators are magic strings; the empty `{}` in
`verilog(g, {})` hides its options; capacity accepts a small fixed set with no
validation.

---

## Proposal

Prioritized. Each item gives one canonical form (a second only where it genuinely
adds value). All additions are **non-breaking** — see [Strategy](#strategy).

### Priority 1 — high impact

#### P1.1 Named methods instead of overloaded calls

```js
const g    = reqack.circuit('name');
const node = g.addNode('label');
const edge = node.addEdge({width: 32, capacity: 1});
edge.connectTo(target);

// chained
g.addNode('label').addEdge({width: 32}).connectTo(target);
```

Clear intent per step; autocomplete-discoverable; self-documenting.

#### P1.2 Explicit edge config with validation

```js
const edge = node.addEdge({
  width: 32,     // data width in bits (required)
  capacity: 1    // 0=wire, 1=EB1, 1.5=EB1.5, 1.7=EB1.7, int >=2=FIFO
});
```

Named properties enable inline docs and validation (see P1.4).

#### P1.3 Type definitions (TypeScript `.d.ts` or JSDoc)

```typescript
interface EdgeConfig {
  /** Data width in bits (required) */
  width: number;
  /** Buffer: 0=wire, 1=EB1, 1.5=EB1.5, 1.7=EB1.7, int >=2=FIFO */
  capacity?: 0 | 1 | 1.5 | 1.7 | number;
}

interface Circuit {
  addNode(label?: string): Node;
  addInput(label: string, config?: EdgeConfig): Node;
  addOutput(label: string): Node;
  toVerilog(options?: VerilogOptions): string;
}
```

LLMs consume types directly; better IDE support; clear contracts.

#### P1.4 Helpful error messages

Replace silent failures / cryptic throws with actionable text.

```js
node.addEdge({width: 32, capacity: 0.5});
// Error: Invalid capacity 0.5. Valid: 0 (wire), 1 (EB1), 1.5 (EB1.5),
//        1.7 (EB1.7), or integer >= 2 (FIFO).

edge.connectTo(undefined);
// Error: Cannot connect edge to undefined. Create the target node first.

g.validate();
// { valid: false, errors: [
//   "Node 'add2' has no inputs connected",
//   "Edge from node3 has no target"
// ]}
```

LLMs self-correct from error text; faster debugging.

### Priority 2 — medium impact

#### P2.1 Explicit component library

Replace magic operator strings with discoverable methods.

```js
const add = g.addOperator('add');   // discoverable, validated name
const mux = g.ops.mux();            // namespace shorthand

const custom = g.addCustomNode('custom', customMacros);
```

Type-safe operator names; clear built-in vs. custom split.

#### P2.2 Fluent builder for datapaths

```js
const g = reqack.circuit('adder')
  .setDefaultWidth(8)
  .setDefaultCapacity(0);

g.addInput('i0').connectTo(add2);
g.addInput('i1').connectTo(add2);
add2.connectToOutput('result');
```

Readable data flow; defaults cut repetition; explicit I/O.

#### P2.3 Explicit output generation

```js
const verilog = g.toVerilog({ macros, moduleName: 'my_module', indent: '  ' });
const svg     = g.toSVG({ layout: 'dagre', direction: 'LR' });
const dot     = g.toDot({ rankdir: 'TB' });
const manifest= g.toManifest('project_name');
```

Named options are self-describing; enables option validation and better errors.

#### P2.4 Rich examples library

```js
const wire     = reqack.examples.wire({width: 8});
const buffer   = reqack.examples.buffer({width: 32, capacity: 1});
const pipeline = reqack.examples.pipeline({stages: 3, width: 32, capacity: 1});
const crossbar = reqack.examples.crossbar({inputs: 3, outputs: 5});
```

Each returns a circuit. LLMs learn and adapt patterns; faster prototyping.
(Today the equivalents live only in [../test/basic.js](../test/basic.js).)

### Priority 3 — nice to have

#### P3.1 Chainable query API

```js
g.getNodes();                    // all
g.getNodes({type: 'input'});     // filtered
g.getNode('add2');               // by label
g.getEdges({minWidth: 32});
g.updateAllEdges({width: 8});    // bulk (vs. today's g.edges.forEach)
```

Discoverable, consistent, safer than raw `g.nodes` / `g.edges` access.

#### P3.2 Explicit controller API

```js
const fork = g.addController('fork');   // or g.addFork()
const join = g.addJoin();
const fork3 = g.addFork({inputs: 1, outputs: 3});
```

Replaces the opaque `reqack.ctrl.fork` namespace with clear methods.

#### P3.3 HLS separation of concerns

Today `reqack.hls(fn)('a','b','c')` mixes expression compilation with circuit
construction.

```js
const circuit = reqack.hls.fromExpression(
  (a, b, c) => (a + b) - c,
  { inputs: {a: 8, b: 8, c: 8}, output: 'result' }
);
```

Explicit input widths and output naming; predictable behavior.

---

## Strategy

- **Additive** — layer the new API over the existing calls; do not break the
  compact form in [../lib/fhyper.js](../lib/fhyper.js).
- **Deprecate gently** — warn on old patterns, don't remove them.
- **Migration guide** — map each old form to its new equivalent.
- **Ship P1 first** — named methods, validated edge config, types, and error
  messages give the largest LLM-usability gain per unit of work.
