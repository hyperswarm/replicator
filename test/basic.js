const Hypercore = require('hypercore')
const ram = require('random-access-memory')
const { get, append, test } = require('./helpers')

test('basic', async function (t, replicator, clone) {
  const a = new Hypercore(ram)
  await replicator.add(a, { server: true, client: false })

  await append(a, 'test')

  const aClone = new Hypercore(ram, a.key)
  await clone.add(aClone, { client: true, server: false })

  t.same(await get(aClone, 0), Buffer.from('test'))
})

test('multi core swarm', async function (t, replicator, clone) {
  const a = new Hypercore(ram)
  const b = new Hypercore(ram)

  await replicator.add(a, { server: true, client: false })
  await replicator.add(b, { server: true, client: false })

  await append(a, 'a test')
  await append(b, 'b test')

  const aClone = new Hypercore(ram, a.key)
  const bClone = new Hypercore(ram, b.key)

  clone.add(bClone, { client: true, server: false })
  clone.add(aClone, { client: true, server: false })

  t.same(await get(aClone, 0), Buffer.from('a test'))
  t.same(await get(bClone, 0), Buffer.from('b test'))
})

test('multi core swarm higher latency', async function (t, replicator, clone) {
  const a = new Hypercore(ram)
  const b = new Hypercore(ram)

  await replicator.add(a, { server: true, client: false })

  await append(a, 'a test')
  await append(b, 'b test')

  const aClone = new Hypercore(ram, a.key)
  const bClone = new Hypercore(ram, b.key)

  await clone.add(bClone, { client: true, server: false })
  await clone.add(aClone, { client: true, server: false })

  replicator.on('discovery-key', () => {
    replicator.add(b, { server: true, client: false })
  })

  t.same(await get(aClone, 0), Buffer.from('a test'))
  t.same(await get(bClone, 0), Buffer.from('b test'))
})
