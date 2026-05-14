import { NextResponse } from 'next/server';
import { r2Client, BUCKET_NAME } from '@/lib/r2';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

export async function POST(request) {
  try {
    const { fileKey, clientId } = await request.json();

    if (!fileKey) {
      return NextResponse.json({ error: 'No file key provided' }, { status: 400 });
    }

    // Basic ownership validation - in a real app, this should match 
    // the authenticated user's client_id or check if they are an admin
    if (clientId && !fileKey.includes(`clients/${clientId}/`)) {
      return NextResponse.json({ error: 'Unauthorized to delete this file' }, { status: 403 });
    }

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
      })
    );

    return NextResponse.json({ success: true, message: 'File deleted from R2' });
  } catch (error) {
    console.error('Delete Error:', error);
    return NextResponse.json({ error: 'Internal server error during deletion' }, { status: 500 });
  }
}
