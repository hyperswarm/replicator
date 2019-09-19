const hyperswarm = require('hyperswarm')
const pump = require('pump')

module.exports = replicator

function replicator (r, opts) {
  if (!opts) opts = {}

  const swarm = hyperswarm()

  swarm.on('connection', function (connection, info) {
    pump(
      connection,
      r.replicate({
        initiator: info.client,
        live: opts.live,
        upload: opts.upload,
        download: opts.download,
        encrypt: opts.encrypt
      }),
      connection
    )
  })

  if (typeof r.ready === 'function') r.ready(onready)
  else onready(null)

  return swarm

  function onready (err) {
    if (swarm.destroyed) return
    if (err) return swarm.destroy(err)

    swarm.join(opts.discoveryKey || r.discoveryKey, {
      announce: opts.announce !== false,
      lookup: opts.lookup !== false
    })
  }
}
