import { NextResponse } from 'next/server';
import { getProject, getProjectPosts, deleteProject } from '@/lib/queries';

export async function GET(request, { params }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const posts = getProjectPosts(id);
  return NextResponse.json({ ...project, posts });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  deleteProject(id);
  return NextResponse.json({ success: true });
}
