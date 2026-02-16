import { trpcClient } from '@/integrations/tanstack-query/root-provider'

/**
 * Uploads a file to R2 via a presigned URL.
 * @param file The file to upload.
 * @param folder The folder to upload to (default: 'uploads').
 * @returns The public URL of the uploaded file.
 */
export async function uploadFile(
  file: File,
  folder = 'uploads',
): Promise<string> {
  const contentType = file.type || 'application/octet-stream'

  // 1. Get presigned URL
  const { uploadUrl, publicUrl } = await trpcClient.storage.getUploadUrl.mutate(
    {
      // Sanitize filename to avoid weird URL encoding issues with spaces/parens
      key: `${folder}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`,
      contentType,
    },
  )

  // 2. Upload file to R2
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': contentType,
    },
  })

  if (!res.ok) {
    const responseBody = (await res.text()).slice(0, 400)
    console.error('Upload failed with status:', res.status, responseBody)
    throw new Error(
      `Upload failed: ${res.status} ${res.statusText}${responseBody ? ` - ${responseBody}` : ''}`,
    )
  }

  return publicUrl
}
