import {ApolloClient} from 'apollo-client'
import defaultCache from './defaultCache'
import createLink from './createLink'
import {setOptions} from '../options'

const defaultOptions = {
  endpointURL: 'http://localhost:3000',
  subscriptionsPath: '/subscriptions',
  useSubscriptions: true,
  saveSession: () => {
    throw new Error('You must pass a function to save the session')
  },
  getSession: () => {
    throw new Error('You must pass a function to get the saved session')
  },
  cache: defaultCache,
  batchInterval: 20,
  batch: true,
  canRetry: true,
  promptTwoFactorCode: () => global.prompt('Please write your two factor code to continue'),
  onError: () => {},
  getHeaders: () => {}
}

export default function(passedOptions) {
  const options = {...defaultOptions, ...passedOptions}
  setOptions(options)

  const link = createLink(options)

  const client = new ApolloClient({link, cache: options.cache})

  global.apolloClient = client

  options.apolloClient = client
  setOptions(options)
  return client
}
