import { MikroORM } from '@mikro-orm/core'
import { __prod__ } from './constants'
import microConfig from './mikro-orm.config'
import {ApolloServer} from 'apollo-server-express'
import {buildSchema} from 'type-graphql'
import express from 'express'
import { HelloResolver } from './resolvers/hello'

const main = async () => {
  const orm = await MikroORM.init(microConfig)
  await orm.getMigrator().up()
  
  const app = express()
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver],
      validate: false
    })
  })
  
  apolloServer.applyMiddleware({ app })
  app.listen(4000, () => {
    console.log('Server started on localhost:4000')
  })
}

main().catch(err => {
  console.log(err)
})