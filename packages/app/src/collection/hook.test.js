import hook from './hook'
import Collection from './index'
import generateId from '../helpers/generateId'

const Views = new Collection({
  name: generateId(),
  passUpdateAndRemove: false
})

beforeAll(() => Views.await())

it('run insert hooks in correct order and work correctly', async () => {
  const result = []
  const aHook1 = hook('before.insert', doc => {
    expect(doc).toEqual({_id: doc._id, hello: 'world'})
    doc.hello = 'country'
    result.push(1)
  })
  const aHook2 = hook('after.insert', doc => {
    expect(doc).toEqual({_id: doc._id, hello: 'country'})
    result.push(3)
  })
  const aHook3 = hook('before.insert', (doc, options, arg1, arg2) => {
    result.push(2)
    expect(arg1).toBe('arg1')
    expect(arg2).toBe('arg2')
  })

  Views.hooks = [aHook1, aHook2, aHook3]
  expect.assertions(6)
  const docId = await Views.insert({hello: 'world'}, {}, 'arg1', 'arg2')

  const doc = await Views.findOne()

  expect(result).toEqual([1, 2, 3])
  expect(doc).toEqual({_id: docId, hello: 'country'})
})

it('run update hooks in correct order and work correctly', async () => {
  const doc = await Views.findOne()
  expect(doc.hello).toBe('country')

  Views.hooks = [
    hook('before.update', (selector, modifier, options, arg1) => {
      modifier.$set.hello = 'house'
      expect(selector).toEqual({_id: doc._id})
      expect(arg1).toBe('arg1')
    }),
    hook('after.update', (selector, modifier, options, arg1) => {
      expect(modifier.$set.hello).toBe('house')
    })
  ]

  await Views.update(doc._id, {$set: {hello: 'city'}}, {}, 'arg1')
  const finalDoc = await Views.findOne()
  expect(finalDoc.hello).toBe('house')
})

it('run remove hooks in correct order and work correctly', async () => {
  const doc = await Views.findOne()
  expect(doc.hello).toBe('house')

  let callsBefore = 0
  let callsAfter = 0

  Views.hooks = [
    hook('before.remove', (selector, options, arg1) => {
      callsBefore++
      expect(selector).toEqual({_id: doc._id})
      expect(arg1).toBe('arg1')
    }),
    hook('after.remove', async (selector, options, arg1) => {
      callsAfter++
      const finalDoc = await Views.findOne()
      expect(finalDoc).toBeNull()
    })
  ]

  await Views.remove(doc._id, {}, 'arg1')

  const finalDoc = await Views.findOne()
  expect(finalDoc).toBeNull()
  expect(callsBefore).toBe(1)
  expect(callsAfter).toBe(1)
})

it('accept hooks as functions', async () => {
  let calls = 0

  Views.hooks = () => {
    calls++
    return [
      hook('before.insert', (doc, options, arg1) => {
        expect(doc.hello).toEqual('universe')
      })
    ]
  }

  expect.assertions(3)

  await Views.insert({hello: 'universe'})
  await Views.insert({hello: 'universe'})

  expect(calls).toBe(1)
})

it('pass information in this', async () => {
  Views.hooks = () => {
    return [
      hook('after.insert', function(doc, options, arg1) {
        expect(this.collection).toBe(Views)
        expect(this.action).toBe('after.insert')
      })
    ]
  }

  expect.assertions(2)

  await Views.insert({hello: 'universe'})
})
