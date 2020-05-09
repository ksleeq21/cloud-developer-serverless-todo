import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

const jwksUrl = 'https://relaypic.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

function getToken(authHeader: string): string {
  if (!authHeader) {
    throw new Error('No authentication header')
  }
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    throw new Error('Invalid authentication header')
  }
  const split = authHeader.split(' ')
  const token = split[1]
  return token
}

// Auth0 returns a JWT token
// JSON contains information about a user
// No need to send a request to Auth0 to verify JWT
// JWT token is signed by Auth0 -> Just verify the signature
async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  
  try {
    const response = await Axios.get(jwksUrl) // JSON Web Key Set
    const data = response['data']['keys'][0]['x5c'][0]
    const certificate = `-----BEGIN CERTIFICATE-----\n${data}\n-----END CERTIFICATE-----`
  
    return verify(token, certificate, { algorithms: ['RS256'] }) as JwtPayload

  } catch (e) {
    logger.error('Get JSON Web Key Set failed', { error: e.message })
    throw new Error('Get JWKS failed')
  }
}
