const hyperswarm = require('hyperswarm')
const pump = require('pump')

class Event {
  constructor () {
    this.triggered = false
    this.fns = new Set()
  }

  on (fn) {
    if (this.triggered) return fn()
    this.fns.add(fn)
  }

  emit () {
    this.triggered = true
    for (const fn of this.fns) fn()
  }
}

module.exports = replicator

function replicator (r, opts, cb) {
  if (typeof opts === 'function') return replicator(r, null, opts)
  if (!opts) opts = {}

  const swarm = hyperswarm({
    announceLocalAddress: !!opts.announceLocalAddress,
    preferredPort: 49737,
    bootstrap: opts.bootstrap
  })

  const oneConnection = new Event()
  const allConnections = new Event()

  swarm.on('connection', function (connection, info) {
    const stream = r.replicate({
      initiator: info.client,
      live: opts.live,
      upload: opts.upload,
      download: opts.download,
      encrypt: opts.encrypt,
      keyPair: opts.keyPair,
      onauthenticate: opts.onauthenticate
    })

    pump(connection, stream, connection)
    if (opts.onstream) opts.onstream(stream, info)
    oneConnection.emit()
  })

  if (r.timeouts) {
    const { update, get } = r.timeouts
    if (update) r.timeouts.update = (cb) => oneConnection.on(() => update(cb))
    if (get) r.timeouts.get = (cb) => allConnections.on(() => get(cb))
  }

  if (r.opened === true) onready(null)
  else if (typeof r.ready === 'function') r.ready(onready)
  else onready(null)

  return swarm

  function onready (err) {
    if (swarm.destroyed) return
    if (err) return swarm.destroy(err)

    swarm.join(opts.discoveryKey || r.discoveryKey, {
      announce: opts.announce !== false,
      lookup: opts.lookup !== false
    }, cb)

    swarm.flush(() => {
      allConnections.emit()
      oneConnection.emit()
    })
  }
}
