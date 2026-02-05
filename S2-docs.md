## Cloudflare R2 docs

description: Use R2 with S3-compatible SDKs like boto3 and the AWS SDK.
lastUpdated: 2026-01-26T20:24:24.000Z
chatbotDeprioritize: false
source_url:
html: https://developers.cloudflare.com/r2/get-started/s3/
md: https://developers.cloudflare.com/r2/get-started/s3/index.md

R2 provides support for a [S3-compatible API](https://developers.cloudflare.com/r2/api/s3/api/), which means you can use any S3 SDK, library, or tool to interact with your buckets. If you have existing code that works with S3, you can use it with R2 by changing the endpoint URL.

## 1. Create a bucket

A bucket stores your objects in R2. To create a new R2 bucket:

- Wrangler CLI
  1. Log in to your Cloudflare account:

     ```bash
     npx wrangler login

     ```

  2. Create a bucket named `my-bucket`:

     ```bash
     npx wrangler r2 bucket create my-bucket

     ```

     If prompted, select the account you want to create the bucket in.

  3. Verify the bucket was created:

     ```bash
     npx wrangler r2 bucket list

     ```
- Dashboard
  1. In the Cloudflare Dashboard, go to **R2 object storage**.

     [Go to **Overview**](https://dash.cloudflare.com/?to=/:account/r2/overview)

  2. Select **Create bucket**.
  3. Enter a name for your bucket.
  4. Select a [location](https://developers.cloudflare.com/r2/reference/data-location) for your bucket and a [default storage class](https://developers.cloudflare.com/r2/buckets/storage-classes/).
  5. Select **Create bucket**.

## 2. Generate API credentials

To use the S3 API, you need to generate [credentials](https://developers.cloudflare.com/r2/api/tokens/) and get an Access Key ID and Secret Access Key:

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Select **Storage & databases > R2 > Overview**.
3. Select **Manage** in API Tokens.
4. Select **Create Account API token** or **Create User API token**
5. Choose **Object Read & Write** permission and **Apply to specific buckets only** to select the buckets you want to access.
6. Select **Create API Token**.
7. Copy the **Access Key ID** and **Secret Access Key**. Store these securely as you cannot view the secret again.

You also need your S3 API endpoint URL which you can find at the bottom of the Create API Token confirmation page once you have created your token, or on the R2 Overview page:

```
https://<ACCOUNT_ID>.r2.cloudflarestorage.com

```

## 3. Use an AWS SDK

The following examples show how to use Python and JavaScript SDKs. For other languages, refer to [S3-compatible SDK examples](https://developers.cloudflare.com/r2/examples/aws/) for

- JavaScript
  1. Install the [@aws-sdk/client-s3](https://www.npmjs.com/package/@aws-sdk/client-s3) package:

     ```bash
     bun add @aws-sdk/client-s3

     ```

  2. Use your credentials to create an S3 client and interact with your bucket:

     ```jsx
     import {
       S3Client,
       PutObjectCommand,
       GetObjectCommand,
       ListObjectsV2Command,
     } from '@aws-sdk/client-s3'

     const s3 = new S3Client({
       region: 'auto', // Required by AWS SDK, not used by R2
       // Provide your R2 endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
       endpoint: 'https://<ACCOUNT_ID>.r2.cloudflarestorage.com',
       credentials: {
         // Provide your R2 Access Key ID and Secret Access Key
         accessKeyId: '<ACCESS_KEY_ID>',
         secretAccessKey: '<SECRET_ACCESS_KEY>',
       },
     })

     // Upload a file
     await s3.send(
       new PutObjectCommand({
         Bucket: 'my-bucket',
         Key: 'myfile.txt',
         Body: 'Hello, R2!',
       }),
     )
     console.log('Uploaded myfile.txt')

     // Download a file
     const response = await s3.send(
       new GetObjectCommand({
         Bucket: 'my-bucket',
         Key: 'myfile.txt',
       }),
     )
     const content = await response.Body.transformToString()
     console.log('Downloaded:', content)

     // List objects
     const list = await s3.send(
       new ListObjectsV2Command({
         Bucket: 'my-bucket',
       }),
     )
     console.log(
       'Objects:',
       list.Contents.map((obj) => obj.Key),
     )
     ```

  3. Save this as `example.mjs` and run it:

     ```bash
     node example.mjs

     ```

     ```bash
     Uploaded myfile.txt
     Downloaded: Hello, R2!
     Objects: [ 'myfile.txt' ]

     ```
  Refer to [AWS SDK for JavaScript examples](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/) for more operations.
