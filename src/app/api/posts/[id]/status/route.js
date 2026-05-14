import { NextResponse } from 'next/server';
import { updatePostStatus } from '@/lib/queries';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { status } = await request.json();
  if (!['draft','pending','approved','revision','rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  const post = updatePostStatus(id, status);
  return NextResponse.json(post);
}
