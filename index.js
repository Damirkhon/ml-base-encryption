import crypto from 'node:crypto'
import express  from 'express'
import bodyParser from 'body-parser'

const app = express()
const port = 3001

app.use(bodyParser({ json: true }))

/**
 * @module index
 * @description Function to generate Aes key
 * @requires crypto
 * @param {number[]} appletPrivateKey
 * @param {number[]} userPublicKey
 * @param {number[]} appletPrime
 * @param {number[]} base
 * @returns {Buffer} The AES key
 */

function generateAesKey(appletPrivateKey, userPublicKey, appletPrime, base) {
  const key = crypto.createDiffieHellman(Buffer.from(appletPrime), Buffer.from(base))

  key.setPrivateKey(Buffer.from(appletPrivateKey))

  const secretKey = key.computeSecret(Buffer.from(userPublicKey))

  return crypto.createHash('sha256').update(secretKey).digest()
}

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

app.listen(port, () => {
  console.log(`Mini app for MindLogger listening on port ${port}`)
})