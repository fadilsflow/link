import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

type R2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrl: string | null
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`[StorageService] Missing required environment variable: ${name}`)
  }
  return value
}

function getR2Config(): R2Config {
  return {
    accountId: getRequiredEnv('R2_ACCOUNT_ID'),
    accessKeyId: getRequiredEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: getRequiredEnv('R2_SECRET_ACCESS_KEY'),
    bucketName: getRequiredEnv('R2_BUCKET_NAME'),
    publicUrl: process.env.R2_PUBLIC_URL?.replace(/\/$/, '') || null,
  }
}

let cachedS3Client: S3Client | null = null
let cachedEndpoint: string | null = null

function getS3Client(config: R2Config): S3Client {
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`
  if (cachedS3Client && cachedEndpoint === endpoint) {
    return cachedS3Client
  }

  cachedEndpoint = endpoint
  cachedS3Client = new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true, // R2 account-level endpoint requires path style
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // Reduce signature mismatch risk when generating presigned URLs
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })

  return cachedS3Client
}

export class StorageService {
  /**
   * Generates a presigned URL for uploading a file to R2.
   * @param key The key (path) where the file will be stored.
   * @param contentType The MIME type of the file.
   * @param expiresIn Expiration time in seconds (default: 3600).
   */
  static async getUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 300, // 5 minutes by default for upload start
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const config = getR2Config()
    const s3Client = getS3Client(config)
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn })
    const publicUrl = config.publicUrl
      ? `${config.publicUrl}/${key}`
      : `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${key}`

    return { uploadUrl, key, publicUrl }
  }

  /**
   * Deletes a file from R2.
   * @param key The key of the file to delete.
   */
  static async deleteFile(key: string): Promise<void> {
    const config = getR2Config()
    const s3Client = getS3Client(config)
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    })
    await s3Client.send(command)
  }

  static getKeyFromUrl(url: string): string | null {
    try {
      const { bucketName, publicUrl } = getR2Config()
      const urlObj = new URL(url)
      // If using custom domain
      if (publicUrl && url.startsWith(publicUrl)) {
        return url.slice(publicUrl.length).replace(/^\//, '')
      }
      // If using R2 domain
      if (url.includes('r2.cloudflarestorage.com')) {
        const pathParts = urlObj.pathname.split('/').filter(Boolean)
        // format: /bucketName/key
        // pathParts[0] is bucketName
        if (pathParts[0] === bucketName) {
          return pathParts.slice(1).join('/')
        }
      }
      // Fallback: assume path is key (minus leading slash)
      return urlObj.pathname.replace(/^\//, '')
    } catch {
      return null
    }
  }

  /**
   * Generates a presigned URL for downloading a file from R2.
   * Forces the browser to download the file instead of opening it.
   * @param key The key (path) of the file.
   * @param fileName The name of the file when downloaded.
   * @param expiresIn Expiration time in seconds (default: 3600).
   */
  static async getDownloadUrl(
    key: string,
    fileName: string,
    expiresIn = 3600,
  ): Promise<string> {
    const config = getR2Config()
    const s3Client = getS3Client(config)
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    })

    return getSignedUrl(s3Client, command, { expiresIn })
  }
}
