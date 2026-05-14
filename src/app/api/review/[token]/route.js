import { NextResponse } from 'next/server';
import { getPostByToken, getComments, addComment, updatePostStatus } from '@/lib/queries';

export async function GET(request, { params }) {
  const { token } = await params;
  const post = getPostByToken(token);
  if (!post) return NextResponse.json({ error: 'Invalid review link' }, { status: 404 });
  const comments = getComments(post.id);
  return NextResponse.json({ ...post, comments });
}

export async function POST(request, { params }) {
  const { token } = await params;
  const post = getPostByToken(token);
  if (!post) return NextResponse.json({ error: 'Invalid review link' }, { status: 404 });
  const body = await request.json();
  if (body.action === 'comment') {
    const comment = addComment({ post_id: post.id, author_name: body.author_name || 'Client', author_role: 'client', content: body.content });
    return NextResponse.json(comment);
  }
  if (body.action === 'status' && ['approved','revision','rejected'].includes(body.status)) {
    const updated = updatePostStatus(post.id, body.status);
    return NextResponse.json(updated);
  }
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
