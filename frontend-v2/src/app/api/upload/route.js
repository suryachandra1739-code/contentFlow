import { NextResponse } from 'next/server';
import { r2Client, BUCKET_NAME, PUBLIC_URL } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const clientId = formData.get('clientId') || 'unknown-client';
    const projectId = formData.get('projectId') || 'unknown-project';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Size validation (500MB)
    const MAX_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 500MB limit' }, { status: 400 });
    }

    // Type validation
    const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideos = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    
    let mediaType = 'image';
    if (allowedVideos.includes(file.type)) {
      mediaType = 'video';
    } else if (!allowedImages.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Format: {clientId}/{projectId}/{type}s/{timestamp}-{filename}
    const folder = mediaType === 'video' ? 'videos' : 'images';
    const fileKey = `clients/${clientId}/${projectId}/${folder}/${timestamp}-${cleanFileName}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const publicUrl = `${PUBLIC_URL}/${fileKey}`;

    return NextResponse.json({
      url: publicUrl,
      key: fileKey,
      type: mediaType,
      size: file.size
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal server error during upload' }, { status: 500 });
  }
}
