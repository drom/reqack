[![Travis Status](https://travis-ci.org/drom/reqack.svg?branch=master)](https://travis-ci.org/drom/reqack)
[![NPM version](https://img.shields.io/npm/v/reqack.svg)](https://www.npmjs.org/package/reqack)
[TUTORIAL](https://beta.observablehq.com/@drom/reqack)

# REQuest ⇄ ACKnowledge

JavaScript Tool set to construct, transform and analyze digital circuits based on elastic transactional [protocol](./docs/protocol.md) and Request-Acknowledge handshake.

User describes circuit JavaScript API, add standard components from the library, or create new componets.

Several standard [controllers](./docs/controller.md) provided.

User can transform constructed circuit by changing buffer capacity or performing other correct by construction transformations.

## Use

### Node.js

```sh
npm i reqack --save
```

```js
const reqack = require('reqack');
```

## API

## Testing

```sh
npm i
npm test
```

## License

MIT [LICENSE](LICENSE)
