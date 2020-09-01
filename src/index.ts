import { MikroORM } from '@mikro-orm/core'
import { __prod__ } from './constants'
import microConfig from './mikro-orm.config'
import {ApolloServer} from 'apollo-server-express'
import {buildSchema} from 'type-graphql'
import express from 'express'
import redis from 'redis'
import session from 'express-session'
import connectRedis from 'connect-redis'
import { HelloResolver } from './resolvers/hello'
import { PostResolver } from './resolvers/posts'
import { UserResolver } from './resolvers/user'
import { MyContext } from './types'
import 'reflect-metadata'

const main = async () => {
  const orm = await MikroORM.init(microConfig)
  await orm.getMigrator().up()
  
  const app = express()

  const RedisStore = connectRedis(session)
  const redisClient = redis.createClient()

  app.use(
    session({
      name: 'rid',
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
        disableTTL: true
      }),
      cookie: ({
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        sameSite: 'lax', //csrf
        secure: __prod__ //only https
      }),
      saveUninitialized: false,
      secret: "abigbigsecret",
      resave: false
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: ({req, res}):MyContext => ({ em: orm.em, req, res })
  })
  
  apolloServer.applyMiddleware({ app })
  app.listen(4000, () => {
    console.log('Server started on localhost:4000')
  })
}

main().catch(err => {
  console.log(err)
})