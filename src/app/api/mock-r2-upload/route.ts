import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Local directory for mock uploads inside the project's public folder
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'mock-uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    // Read file bytes from request
    const body = await request.arrayBuffer();
    const buffer = Buffer.from(body);

    // Resolve file path safely (sanitize filename to prevent directory traversal)
    const safeKey = path.basename(key);
    const filePath = path.join(UPLOAD_DIR, safeKey);

    // Save the file locally
    fs.writeFileSync(filePath, buffer);

    console.log(`[Mock R2] Saved file to ${filePath}`);
    return NextResponse.json({ success: true, key, message: 'Mock upload successful' });
  } catch (error: any) {
    console.error('[Mock R2] Error saving upload:', error);
    return NextResponse.json({ error: error.message || 'Failed to save file' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    // Resolve file path safely
    const safeKey = path.basename(key);
    const filePath = path.join(UPLOAD_DIR, safeKey);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found in mock storage' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Set appropriate content type
    let contentType = 'application/octet-stream';
    if (safeKey.endsWith('.pdf')) contentType = 'application/pdf';
    else if (safeKey.endsWith('.png')) contentType = 'image/png';
    else if (safeKey.endsWith('.jpg') || safeKey.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (safeKey.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (safeKey.endsWith('.xlsx')) contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${safeKey}"`, // Change to inline so images/PDFs can render in-browser
      },
    });
  } catch (error: any) {
    console.error('[Mock R2] Error serving download:', error);
    return NextResponse.json({ error: error.message || 'Failed to serve file' }, { status: 500 });
  }
}
