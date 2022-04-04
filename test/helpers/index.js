const HyperDHT = require('@hyperswarm/dht')
const tape = require('tape')
const Replicator = require('../../')

async function test (msg, fn) {
  tape(msg, async t => {
    const [bootstrap, destroyBootstrap] = await createBootstrap()
    const replicators = fill(2).map(() =>
      new Replicator({ bootstrap })
    )
    await fn(t, ...replicators)
    await destroy(replicators)
    await destroyBootstrap()
  })
}

module.exports = { get, append, ready, test }

function get (core, seq) {
  return new Promise((resolve, reject) => {
    core.get(seq, (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

function append (core, data) {
  return new Promise((resolve, reject) => {
    core.append(data, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

function ready (core) {
  return new Promise((resolve, reject) => {
    core.ready((err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

async function createBootstrap () {
  const bootstrappers = fill(2).map(() =>
    new HyperDHT({
      ephemeral: true,
      bootstrap: []
    })
  )
  await init(bootstrappers)
  const bootstrap = bootstrappers.map(node => ({
    host: '127.0.0.1',
    port: node.address().port
  }))
  const nodes = fill(2).map(() =>
    new HyperDHT({
      ephemeral: false,
      bootstrap
    })
  )
  await init(nodes)
  return [bootstrap, () => destroy(bootstrappers, nodes)]
}

async function init (...nodes) {
  return await Promise.all(nodes.map(async node => {
    if (Array.isArray(node)) {
      await init(...node)
    } else {
      await node.ready()
    }
  }))
}

async function destroy (...nodes) {
  return await Promise.all(nodes.map(async node => {
    if (Array.isArray(node)) {
      await destroy(...node)
    } else {
      await node.destroy()
    }
  }))
}

function fill (n) {
  return Array(n).fill(null)
}
