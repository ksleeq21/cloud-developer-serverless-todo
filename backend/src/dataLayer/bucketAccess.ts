import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { CreateSignedUploadUrlRequest } from '../requests/CreateSignedUploadUrlRequest'
import { DeleteTodoImageRequest } from '../requests/DeleteTodoImageRequest'

const XAWS = AWSXRay.captureAWS(AWS)

export class BucketAccess {
    constructor(
        private readonly bucketName = process.env.IMAGES_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
        private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' })
    ) {}

    getSignedUploadUrl(createSignedUploadUrlRequest: CreateSignedUploadUrlRequest): string {
        return this.s3.getSignedUrl('putObject', createSignedUploadUrlRequest)
    }

    getBucketName(): string {
        return this.bucketName
    }

    getUrlExpiration(): string {
        return this.urlExpiration
    }

    async deleteTodoImage(deleteTodoImageRequest: DeleteTodoImageRequest) {
        await this.s3.deleteObject(deleteTodoImageRequest).promise()
    }
}