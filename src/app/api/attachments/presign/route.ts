import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl, getPresignedDownloadUrl } from '@/lib/r2';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate Employee (only authenticated employees can generate presigned URLs)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request
    const body = await request.json();
    const { filename, contentType, submissionId } = body;

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType are required' }, { status: 400 });
    }

    // 3. Generate a clean, structured R2 object key
    // submissions/{submissionId}/{timestamp}-{filename}
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_'); // sanitize filename
    const pathPrefix = submissionId ? `submissions/${submissionId}` : 'general';
    const key = `${pathPrefix}/${Date.now()}-${cleanFilename}`;

    // 4. Issue the presigned PUT URL
    const uploadUrl = await getPresignedUploadUrl(key, contentType);

    return NextResponse.json({
      success: true,
      key,
      uploadUrl,
    });
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET requests to this route can retrieve download URLs for given keys
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate Employee
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse query key
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    // 3. Issue the presigned GET URL
    const downloadUrl = await getPresignedDownloadUrl(key);

    return NextResponse.json({
      success: true,
      downloadUrl,
    });
  } catch (error: any) {
    console.error('Error generating download URL:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
