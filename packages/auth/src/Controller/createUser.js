import {resolver} from '@orion-js/app'
import hashPassword from '../helpers/hashPassword'

export default ({Session, Users}) => {
  return resolver({
    name: 'createUser',
    params: {
      email: {
        type: 'email',
        async custom(email) {
          email = email.toLowerCase()
          const count = await Users.find({'emails.address': email}).count()
          if (count) {
            return 'emailExists'
          }
        }
      },
      password: {
        type: String,
        async custom(password) {
          if (password.length < 6) {
            return 'passwordIsTooShort'
          }
        }
      }
    },
    returns: Session,
    mutation: true,
    resolve: async function({email, password}) {
      const newUser = {
        emails: [
          {
            address: email.toLowerCase(),
            verified: false
          }
        ],
        services: {
          password: {
            bcrypt: hashPassword(password)
          }
        },
        profile: {},
        createdAt: new Date()
      }
      console.log('a new user was created', newUser)
      await Users.insert(newUser)
      return {
        _id: email
      }
    }
  })
}
