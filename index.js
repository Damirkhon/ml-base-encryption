import crypto from 'node:crypto'
import express  from 'express'
import bodyParser from 'body-parser'
import { createHash, createDiffieHellman } from 'crypto-browserify';

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

/**
 * @module index
 * @description Function to generate appletPrivateKey
 * @requires crypto
 * @param {string} appletPassword
 * @param {string} accountId
 * @param {number[]} prime
 * @param {number[]} base
 * @returns {Buffer} The applet private key
 */

function getAppletEncryptionInfo({
  appletPassword,
  accountId,
  prime,
  base,
}) {
  const key = createDiffieHellman(Buffer.from(prime), Buffer.from(base));


  const buffer = Buffer.from(getPrivateKey({
    appletPassword,
    accountId,
  }))
  key.setPrivateKey(buffer);
  key.generateKeys();

  return Array.from(key.getPrivateKey())
};

/**
 * @module index
 * @description Function to generate appletPrivateKey
 * @requires crypto
 * @param {string} appletPassword
 * @param {string} accountId
 * @returns {Buffer} The private key
 */

function getPrivateKey({ appletPassword, accountId }) {
  const key1 = createHash('sha512').update(appletPassword).digest();
  const key2 = createHash('sha512').update(accountId).digest();

  const key = `${key1}${key2}`

  const decoder = new TextDecoder()
  const decodedKey1 = decoder.decode(key1)
  const decodedKey2 = decoder.decode(key2)

  const result = decodedKey1 + decodedKey2

  console.log(result)

  return key;
};

app.post('/generate-aes-key', (req, res) => {

  console.info(req.body)

  if(!req.body?.userPublicKey) {
    return res.status(400).send('userPublicKey is required')
  }

  if(!req.body?.appletPrime) {
    return res.status(400).send('appletPrime is required')
  }

  if(!req.body?.base) {
    return res.status(400).send('base is required')
  }

  if(!req.body?.appletPassword) {
    return res.status(400).send('appletPassword is required')
  }

  if(!req.body?.accountId) {
    return res.status(400).send('accountId is required')
  }

  const appletPrivateKey = getAppletEncryptionInfo({
    appletPassword: req.body.appletPassword,
    accountId: req.body.accountId,
    prime: req.body.appletPrime,
    base: req.body.base,
  })

  console.info(appletPrivateKey)

  const aesKey = generateAesKey(
    appletPrivateKey, 
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

// "[203,137,239,191,189,239,191,189,91,239,191,189,239,191,189,48,89,12,239,191,189,101,71,239,191,189,239,191,189,239,191,189,239,191,189,1,211,152,239,191,189,239,191,189,12,24,239,191,189,62,239,191,189,35,239,191,189,239,191,189,6,239,191,189,1,221,133,65,37,91,239,191,189,63,205,145,3,239,191,189,239,191,189,47,239,191,189,239,191,189,112,61,239,191,189,58,239,191,189,239,191,189,2,239,191,189,239,191,189,199,174,114,239,191,189,239,191,189,124,239,191,189,239,191,189,239,191,189,42,2,20,108,86,62,90,239,191,189,49,44,12,73,239,191,189,94,68,32,239,191,189,33,4,118,73,239,191,189,239,191,189,44,22,42,239,191,189,72,24,239,191,189,31,239,191,189,239,191,189,9,239,191,189,239,191,189,69,114,9,36,239,191,189,239,191,189,63,69,239,191,189,239,191,189,80,11,239,191,189,93,0,239,191,189,116,47,239,191,189,239,191,189,239,191,189,119,14,127,239,191,189,239,191,189]"