import express  from 'express'
import bodyParser from 'body-parser'

import { generateAesKey } from './generateAesKey.js'
import { formatResponses } from './formatResponses.js'

const app = express()
const port = 3001

app.use(bodyParser({ json: true }))

app.post('/generate-aes-key', (req, res) => {
  console.info(req.body)

  if(!req.body?.appletPrivateKey) {
    return res.status(400).send('appletPrivateKey is required')
  }

  if(!req.body?.userPublicKey) {
    return res.status(400).send('userPublicKey is required')
  }

  if(!req.body?.appletPrime) {
    return res.status(400).send('appletPrime is required')
  }

  if(!req.body?.base) {
    return res.status(400).send('base is required')
  }

  const aesKey = generateAesKey(
    JSON.parse(req.body.appletPrivateKey), 
    JSON.parse(req.body.userPublicKey), 
    JSON.parse(req.body.appletPrime), 
    JSON.parse(req.body.base)
  )

  const aesKeyJSON = aesKey.toJSON()

  console.info("AES Key: ", aesKeyJSON)

  return res.send(aesKeyJSON)
})

app.post('/format-responses', (req, res) => {
  console.info(req.body)

  if(!req.body?.payload) {
    return res.status(400).send('payload is required')
  }

  if(!Array.isArray(req.body.payload)) {
    return res.status(400).send('payload should be an array')
  }

  const formattedResponses = req.body.payload.map(item => {
    if(!item.type) {
      throw new Error(`type is required for item: ${JSON.stringify(item)}`)
    }

    if(!item.responseValues) {
      throw new Error(`responseValues is required for item: ${JSON.stringify(item)}`)
    }

    const formattedResponse = formatResponses(item.type, item.responseValues)

    return formattedResponse
  })

  console.info("Formatted Responses: ", formattedResponses)

  res.json({
    result: formattedResponses
  })
})

app.listen(port, () => {
  console.log(`Mini app for MindLogger listening on port ${port}`)
})