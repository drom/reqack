[![Travis Status](https://travis-ci.org/drom/reqack.svg?branch=master)](https://travis-ci.org/drom/reqack)
[![NPM version](https://img.shields.io/npm/v/reqack.svg)](https://www.npmjs.org/package/reqack)
[TUTORIAL](https://beta.observablehq.com/@drom/reqack)

# REQuest ⇄ ACKnowledge

JavaScript Tool set to construct, transform and analyze digital circuits based on elastic transactional [protocol](./docs/protocol.md) and Request-Acknowledge handshake.

User describes circuit JavaScript API, add standard components from the library, or create new componets.

Several standard [controllers](./docs/controller.md) provided.

User can transform constructed circuit by changing buffer capacity or performing other correct by construction transformations.

## Usage

The package can be installed from `npm`:

```sh
npm i reqack
```

and imported into your JavaScript code:

```js
const reqack = require('reqack');
```

A **circuit** can be constructed this way:

```js
const g = reqack.circuit('circuit_name');
```

A **node** can be constructed by calling the circuit function. Optional `node_label` string will be used as standard or custom operation or as a root of a signal name.

```js
const node1 = g('node_label');
```

A **link** can be constructed by calling the node function. Optional argument is an `Object` with two major properties (width, capacity).

```js
const link1 = node1({width: 32, capacity: 1});
```

One node can be **connected** to another node by calling link with a destination node.

```js
link1(node2); // -> link1
```

Resulted Verilog RTL can be produced by calling

```js
const verilogString = reqack.verilog(g, {});
```

SVG image can be rendered by calling

```js
const svg = reqack.svg(g);
```

## Testing

```sh
npm i
npm test
```

## License

MIT [LICENSE](LICENSE)
