import { NextResponse } from 'next/server';
import { r2Client, BUCKET_NAME, PUBLIC_URL } from '@/lib/r2';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

// POST /api/upload/presign
// Returns a presigned URL so the client can upload directly to R2
// This bypasses Vercel's 4.5MB serverless body limit entirely
export async function POST(request) {
  try {
    const { filename, contentType, clientId = 'unknown-client', projectId = 'unknown-project' } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType are required' }, { status: 400 });
    }

    const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideos = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

    let mediaType = 'image';
    if (allowedVideos.includes(contentType)) {
      mediaType = 'video';
    } else if (!allowedImages.includes(contentType)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const timestamp = Date.now();
    const cleanFileName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folder = mediaType === 'video' ? 'videos' : 'images';
    const fileKey = `clients/${clientId}/${projectId}/${folder}/${timestamp}-${cleanFileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    // Presigned URL valid for 15 minutes
    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });
    const publicUrl = `${PUBLIC_URL}/${fileKey}`;

    return NextResponse.json({
      presignedUrl,
      publicUrl,
      key: fileKey,
      mediaType,
    });
  } catch (error) {
    console.error('Presign Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
