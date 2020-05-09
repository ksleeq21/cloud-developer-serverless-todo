import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { generateSignedUploadUrl } from '../../businessLogic/todos'

export const handler: APIGatewayProxyHandler = async (
event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {

    const todoId = event.pathParameters.todoId
    const signedUploadUrl = generateSignedUploadUrl(todoId)
    console.log('signedUploadUrl:', signedUploadUrl)

    return {
        statusCode: 201,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            uploadUrl: signedUploadUrl
        })
    }
}
