import { formatUrl } from '@aws-sdk/util-format-url'
import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner'
import { Sha256 } from '@aws-crypto/sha256-js'
import { HttpRequest } from '@smithy/protocol-http'

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

let cachedSigner: S3RequestPresigner | null = null
let cachedCredentialsKey: string | null = null

function encodeR2Key(key: string): string {
  return key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function getR2Signer(config: R2Config): S3RequestPresigner {
  const credentialsKey = `${config.accessKeyId}:${config.secretAccessKey}`
  if (cachedSigner && cachedCredentialsKey === credentialsKey) {
    return cachedSigner
  }

  cachedCredentialsKey = credentialsKey
  cachedSigner = new S3RequestPresigner({
    region: 'auto',
    sha256: Sha256,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })

  return cachedSigner
}

async function createPresignedObjectUrl(params: {
  config: R2Config
  method: 'PUT' | 'GET' | 'DELETE'
  key: string
  contentType?: string
  expiresIn: number
  query?: Record<string, string>
}): Promise<string> {
  const { config, method, key, contentType, expiresIn, query } = params
  const signer = getR2Signer(config)
  const hostname = `${config.accountId}.r2.cloudflarestorage.com`
  const path = `/${config.bucketName}/${encodeR2Key(key)}`

  const request = new HttpRequest({
    protocol: 'https:',
    hostname,
    method,
    path,
    query,
    headers: {
      host: hostname,
      ...(contentType ? { 'content-type': contentType } : {}),
    },
  })

  const signedRequest = await signer.presign(request, { expiresIn })
  return formatUrl(signedRequest)
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
    const uploadUrl = await createPresignedObjectUrl({
      config,
      method: 'PUT',
      key,
      contentType,
      expiresIn,
    })
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
    const url = await createPresignedObjectUrl({
      config,
      method: 'DELETE',
      key,
      expiresIn: 60,
    })
    const res = await fetch(url, { method: 'DELETE' })
    if (!res.ok && res.status !== 404) {
      const body = (await res.text()).slice(0, 400)
      throw new Error(`Failed to delete R2 object: ${res.status} ${res.statusText}${body ? ` - ${body}` : ''}`)
    }
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
    return createPresignedObjectUrl({
      config,
      method: 'GET',
      key,
      expiresIn,
      query: {
        'response-content-disposition': `attachment; filename="${fileName}"`,
      },
    })
  }
}
