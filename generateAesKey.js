import crypto from 'node:crypto'

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

export function generateAesKey(appletPrivateKey, userPublicKey, appletPrime, base) {
  const key = crypto.createDiffieHellman(Buffer.from(appletPrime), Buffer.from(base))

  key.setPrivateKey(Buffer.from(appletPrivateKey))

  const secretKey = key.computeSecret(Buffer.from(userPublicKey))

  return crypto.createHash('sha256').update(secretKey).digest()
}