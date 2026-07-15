[![NPM version](https://img.shields.io/npm/v/reqack.svg)](https://www.npmjs.org/package/reqack)
[![Linux](https://github.com/drom/reqack/actions/workflows/linux.yml/badge.svg)](https://github.com/drom/reqack/actions/workflows/linux.yml)
[![MacOS](https://github.com/drom/reqack/actions/workflows/macos.yml/badge.svg)](https://github.com/drom/reqack/actions/workflows/macos.yml)
[![Windows](https://github.com/drom/reqack/actions/workflows/windows.yml/badge.svg)](https://github.com/drom/reqack/actions/workflows/windows.yml)
[TUTORIAL](https://beta.observablehq.com/@drom/reqack)

# REQuest ⇄ ACKnowledge

JavaScript tool set to construct, transform, and analyze digital circuits based on
an elastic (latency-insensitive) transactional [protocol](./docs/protocol.md) and a
Request-Acknowledge handshake.

You describe a circuit through a small JavaScript API, wire together standard components
from the library, or define your own. The resulting graph is then rendered to synthesizable
Verilog RTL and to diagrams (SVG / Graphviz dot).

- **Elastic by construction** — every channel carries `req`/`ack`/`dat`. Backpressure and
  flow control are generated for you.
- **Correct-by-construction transformations** — change a channel's buffer capacity, retime,
  or insert bubbles without altering functional behavior.
- **Pluggable components** — standard [controllers](./docs/controller.md) (fork, join, MIMO)
  plus custom node macros.

## Install

```sh
npm i reqack
```

```js
const reqack = require('reqack');
```

## Concepts

A circuit is a directed hypergraph:

- **Circuit** — the top-level graph. Becomes a Verilog module.
- **Node** — an operation, a custom component, or an I/O port. A node with no incoming
  edges is a **target** (module input); a node with no outgoing edges is an **initiator**
  (module output).
- **Edge (channel)** — a link between nodes carrying `{width, capacity}`. The `capacity`
  selects the elastic buffer inserted on that channel.

## Constructing a circuit

The core API in [lib/fhyper.js](lib/fhyper.js) is intentionally compact: circuits, nodes,
and edges are built by calling the value returned from the previous step.

A **circuit** is created by calling `reqack.circuit`. The optional label becomes the
Verilog module name.

```js
const g = reqack.circuit('circuit_name');
```

A **node** is created by calling the circuit. The optional label is used as a standard
operator (see [Operators](#operators)), a custom macro name, or the root of a signal name.

```js
const node1 = g('node_label');
```

An **edge** is created by calling a node. The optional argument is an object with two main
properties, `width` and `capacity`.

```js
const edge1 = node1({width: 32, capacity: 1});
```

An edge is **connected** to a destination node by calling it with that node. The call
returns the same edge, so connections chain (this is a fork — one source, many targets).

```js
edge1(node2)(node3); // fan edge1 out to node2 and node3
```

Nodes also accept upstream edges as extra arguments (a join — many sources, one node),
including arrays of edges:

```js
const add = g('+', g()(), g()());          // two inputs feeding an adder
const sum = g('+', [a, b, c].map(x => x())); // n inputs from an array
```

### Edge capacity

`capacity` selects the channel's elastic buffer:

| capacity      | buffer      | latency | notes                                   |
| ------------- | ----------- | ------- | --------------------------------------- |
| `0` / omitted | wire        | 0       | asynchronous, combinational backpressure |
| `1`           | EB1         | 1       | async backpressure                       |
| `1.5`         | EB1.5       | 1       | synchronous backpressure, stall cap 2    |
| `1.7`         | EB1.7       | 1       | synchronous backpressure                 |
| integer `>= 2`| FIFO        | 1       | N-entry queue                            |

See [docs/controller.md](docs/controller.md) for the controller logic behind each.

## Operators

A node whose label is a string is treated as a datapath operator. Multi-operator labels
are evaluated in **RPN** (space-separated), consuming the node's inputs in order — see
[lib/rpn.js](lib/rpn.js).

```js
g('+');       // add
g('-');       // subtract
g('*');       // signed multiply
g('~ & |');   // (in RPN) invert, AND, OR
```

Supported binary operators: `+ - * / % & | ^ << >> > >= < <= == != && ||`.
Unary: `! ~`. Numeric literals and `swap` are also recognized.

## Custom components (macros)

Pass a `macros` object to `reqack.verilog` to define nodes that emit their own datapath
and/or control logic. A macro may provide `data`, `ctrl`, `ctrl2data`, or `parameters`.

```js
const macros = {
  custom: {
    // p.t = target (input) sockets, p.i = initiator (output) sockets
    data: p => p.i.map(lhs =>
      `assign ${lhs.wire} = ${p.t.map(e => e.wire).join(' ^ ')};`)
  }
};

const g = reqack.circuit();
const fn = g('custom');
g()()(fn);
g()()(fn);
fn({capacity: 1})();

const rtl = reqack.verilog(g, macros);
```

The built-in `reqack.macros` (currently `deconcat`) and `reqack.ctrl.fork` provide ready
components. See [test/basic.js](test/basic.js) for many worked examples.

## Generating output

```js
const rtl      = reqack.verilog(g, macros); // synthesizable Verilog (datapath + _ctrl module)
const svg      = reqack.svg(g);             // SVG diagram (dagre layout)
const dot      = reqack.dot(g);             // Graphviz dot source
const manifest = reqack.manifest(g, name);  // project manifest (module.exports = {...})
```

`reqack.verilog` emits two modules: the datapath `<name>` and its handshake controller
`<name>_ctrl`.

## Worked example

A single 4-bit channel with a 1-entry elastic buffer:

```js
const g = reqack.circuit('eb1');
g()({width: 4, capacity: 1})(); // target -> EB1 edge -> initiator
const rtl = reqack.verilog(g, {});
```

produces the datapath module and its handshake controller:

```verilog
module eb1 (
    // per node (target / initiator)
    input              clk,
    input              reset_n,
    input        [3:0] t_0_dat,
    input              t_0_req,
    output             t_0_ack,
    output       [3:0] i_1_dat,
    output             i_1_req,
    input              i_1_ack
);
wire       [3:0] dat0, dat0_nxt;
// per node
assign dat0_nxt = t_0_dat; // node:0 is target port
assign i_1_dat = dat0; // node:1 is initiator port
// per edge
wire en0; // edge:0 EB1
reg [3:0] dat0_r;
always @(posedge clk) if (en0) dat0_r <= dat0_nxt;
assign dat0 = dat0_r;

eb1_ctrl uctrl (
    .clk(clk),
    .reset_n(reset_n),
    .t_0_req(t_0_req),
    .t_0_ack(t_0_ack),
    .i_1_req(i_1_req),
    .i_1_ack(i_1_ack),
    .en0(en0)
);
endmodule // eb1

module eb1_ctrl (
    // per node (target / initiator)
    input              clk,
    input              reset_n,
    input              t_0_req,
    output             t_0_ack,
    output             i_1_req,
    input              i_1_ack,
    output             en0
);
wire             req0, ack0, ack0_0, req0_0;
// node:t_0 target
assign req0 = t_0_req;
assign t_0_ack = ack0;
// edge:0 EB1
wire ack0m;
reg req0m;
assign en0 = req0 & ack0;
assign ack0 = ~req0m | ack0m;
always @(posedge clk or negedge reset_n) if (~reset_n) req0m <= 1'b0; else req0m <= ~ack0 | req0;

// edge:0 fork
assign req0_0 = req0m;
assign ack0m = ack0_0;
// node:1 initiator
assign i_1_req = req0_0;
assign ack0_0 = i_1_ack;
endmodule // eb1_ctrl
```

The data path (`eb1`) holds registers and multiplexing; the controller (`eb1_ctrl`)
holds the `req`/`ack` handshake FSM and drives each register's enable (`en0`).

## High-level synthesis (HLS)

`reqack.hls` turns a JavaScript arithmetic expression into a circuit, mapping operators to
elastic nodes — see [lib/hls.js](lib/hls.js).

```js
const hls = reqack.hls;
const resultEdge = hls((a, b, c) => (a + b) - c)('a', 'b', 'c');
```

## Also exported

- `reqack.dagre` — the bundled [dagre](https://github.com/dagrejs/dagre) layout engine.
- `reqack.firrtl` — FIRRTL backend (placeholder, not yet implemented).

## Documentation

- [Link protocol](docs/protocol.md) — the `req`/`ack`/`dat` signaling rules.
- [Controllers](docs/controller.md) — fork, join, MIMO, and edge buffers (EB0/1/1.5/…).
- [Transformations](docs/transformations.md) — retiming, bubble insertion, memory bypass.
- [Labeling](docs/labeling.md) — how graph/node/edge labels are interpreted.
- [References](docs/references.md) — background reading.
- [LLM-friendly API](docs/llm-api.md) — **roadmap / proposal**. Describes a future
  named-method API (`addNode`, `addEdge`, `connectTo`, validation, types). Not yet
  implemented — the current API is the one documented above.

## Testing

```sh
npm i
npm test
```

## License

MIT [LICENSE](LICENSE)
