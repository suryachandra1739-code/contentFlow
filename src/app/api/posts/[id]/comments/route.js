import { NextResponse } from 'next/server';
import { getComments, addComment } from '@/lib/queries';

export async function GET(request, { params }) {
  const { id } = await params;
  return NextResponse.json(getComments(id));
}

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  if (!body.content || !body.author_name) return NextResponse.json({ error: 'content and author_name required' }, { status: 400 });
  const comment = addComment({ post_id: id, ...body });
  return NextResponse.json(comment, { status: 201 });
}
