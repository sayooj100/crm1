import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

// Create S3 client configured for Cloudflare R2
// If R2 credentials are not set, we bypass initialization or use placeholders to avoid crashes during startup
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId || 'placeholder'}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || 'placeholder',
    secretAccessKey: secretAccessKey || 'placeholder',
  },
});

/**
 * Check if R2 is fully configured
 */
export function isR2Configured(): boolean {
  return !!(
    accountId &&
    accountId !== 'your_cloudflare_account_id' &&
    accessKeyId &&
    accessKeyId !== 'your_r2_access_key_id' &&
    secretAccessKey &&
    secretAccessKey !== 'your_r2_secret_access_key' &&
    bucketName &&
    bucketName !== 'your_r2_bucket_name'
  );
}

/**
 * Generates a presigned PUT URL for uploading a file directly from the browser to Cloudflare R2.
 */
export async function getPresignedUploadUrl(key: string, contentType: string, expiresInSeconds = 3600): Promise<string> {
  if (!isR2Configured()) {
    console.warn('⚠️ Cloudflare R2 credentials not fully configured. Using mock upload URL.');
    // Return a mock API endpoint URL for local testing
    return `/api/mock-r2-upload?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`;
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Generates a presigned GET URL for downloading a file directly from Cloudflare R2.
 */
export async function getPresignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  if (!isR2Configured()) {
    console.warn('⚠️ Cloudflare R2 credentials not fully configured. Using mock download URL.');
    // Return a local mock download URL
    return `/api/mock-r2-upload?key=${encodeURIComponent(key)}&download=true`;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}
