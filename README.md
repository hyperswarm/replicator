# @hyperswarm/replicator

Replicate data structures easily using hyperswarm

## Install

```js
npm install @hyperswarm/replicator
```

## Usage

You data structure has to support a .replicate() stream, then you can replicate
them using the hyperswarm replicator.

```js
const replicate = require('@hyperswarm/replicator')

const swarm = replicate(aHypercore, {
  live: true // passed to .replicate
})

// swarm is a hyperswarm instance that replicates the passed in instance
```

## API

#### `swarm = replicate(dataStructure, [options])`

Options include

```js
{
  live: false, // passed to .replicate
  upload: false, // passed to .replicate
  download: false, // passed to .replicate
  discoveryKey: <buf>, // optionally set your own discovery key
  announce: true, // should the swarm announce you?
  lookup: true // should the swarm do lookups for you?
}
```

## License

MIT
