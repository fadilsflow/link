import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Ensure these are set in your environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL // Optional: Custom domain for public access

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true, // R2 requires path style for the account-level endpoint
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
  // Disable automatic checksum generation which causes signature mismatches in presigned URLs
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

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
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn })
    const publicUrl = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
      : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`

    return { uploadUrl, key, publicUrl }
  }

  /**
   * Deletes a file from R2.
   * @param key The key of the file to delete.
   */
  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
    await s3Client.send(command)
  }

  static getKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url)
      // If using custom domain
      if (R2_PUBLIC_URL && url.startsWith(R2_PUBLIC_URL)) {
        return url.slice(R2_PUBLIC_URL.length).replace(/^\//, '')
      }
      // If using R2 domain
      if (url.includes('r2.cloudflarestorage.com')) {
        const pathParts = urlObj.pathname.split('/').filter(Boolean)
        // format: /bucketName/key
        // pathParts[0] is bucketName
        if (pathParts[0] === R2_BUCKET_NAME) {
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
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    })

    return getSignedUrl(s3Client, command, { expiresIn })
  }
}
