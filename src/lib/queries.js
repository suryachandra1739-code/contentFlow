import { getDb } from './db';
import { v4 as uuidv4 } from 'uuid';

// --- Clients ---
export function getAllClients() {
  return getDb().prepare(`
    SELECT c.*, COUNT(p.id) as project_count 
    FROM clients c LEFT JOIN projects p ON p.client_id = c.id 
    GROUP BY c.id ORDER BY c.created_at DESC
  `).all();
}

export function getClient(id) {
  return getDb().prepare('SELECT * FROM clients WHERE id = ?').get(id);
}

export function createClient({ name, email, company }) {
  const id = uuidv4();
  const colors = ['#8b5cf6','#ec4899','#f97316','#06b6d4','#10b981','#f43f5e'];
  const avatar_color = colors[Math.floor(Math.random() * colors.length)];
  getDb().prepare('INSERT INTO clients (id, name, email, company, avatar_color) VALUES (?,?,?,?,?)').run(id, name, email, company, avatar_color);
  return getClient(id);
}

// --- Projects ---
export function getAllProjects() {
  return getDb().prepare(`
    SELECT p.*, c.name as client_name, c.company as client_company, c.avatar_color,
    (SELECT COUNT(*) FROM posts WHERE project_id = p.id) as post_count,
    (SELECT COUNT(*) FROM posts WHERE project_id = p.id AND status = 'approved') as approved_count,
    (SELECT COUNT(*) FROM posts WHERE project_id = p.id AND status = 'pending') as pending_count
    FROM projects p JOIN clients c ON c.id = p.client_id
    ORDER BY p.created_at DESC
  `).all();
}

export function getProject(id) {
  return getDb().prepare(`
    SELECT p.*, c.name as client_name, c.company as client_company, c.avatar_color
    FROM projects p JOIN clients c ON c.id = p.client_id WHERE p.id = ?
  `).get(id);
}

export function getProjectPosts(projectId) {
  return getDb().prepare('SELECT * FROM posts WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
}

export function createProject({ client_id, name, description }) {
  const id = uuidv4();
  getDb().prepare('INSERT INTO projects (id, client_id, name, description) VALUES (?,?,?,?)').run(id, client_id, name, description);
  return getProject(id);
}

export function deleteProject(id) {
  const posts = getDb().prepare('SELECT id FROM posts WHERE project_id = ?').all(id);
  for (const p of posts) {
    getDb().prepare('DELETE FROM comments WHERE post_id = ?').run(p.id);
    getDb().prepare('DELETE FROM activity_log WHERE post_id = ?').run(p.id);
  }
  getDb().prepare('DELETE FROM posts WHERE project_id = ?').run(id);
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(id);
}

// --- Posts ---
export function getAllPosts(filters = {}) {
  let query = `SELECT posts.*, projects.name as project_name, c.name as client_name, c.avatar_color
    FROM posts JOIN projects ON projects.id = posts.project_id JOIN clients c ON c.id = projects.client_id`;
  const conditions = [];
  const params = [];
  if (filters.status) { conditions.push('posts.status = ?'); params.push(filters.status); }
  if (filters.platform) { conditions.push('posts.platform = ?'); params.push(filters.platform); }
  if (filters.project_id) { conditions.push('posts.project_id = ?'); params.push(filters.project_id); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY posts.updated_at DESC';
  return getDb().prepare(query).all(...params);
}

export function getPost(id) {
  return getDb().prepare(`
    SELECT posts.*, projects.name as project_name, projects.client_id, c.name as client_name, c.avatar_color
    FROM posts JOIN projects ON projects.id = posts.project_id JOIN clients c ON c.id = projects.client_id WHERE posts.id = ?
  `).get(id);
}

export function createPost({ project_id, platform, caption, hashtags, media_url, media_type, scheduled_date }) {
  const id = uuidv4();
  const review_token = uuidv4();
  getDb().prepare('INSERT INTO posts (id, project_id, platform, caption, hashtags, media_url, media_type, scheduled_date, review_token) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(id, project_id, platform, caption, hashtags || '', media_url || null, media_type || 'image', scheduled_date || null, review_token);
  logActivity(id, 'created', { status: 'draft' });
  return getPost(id);
}

export function updatePost(id, data) {
  const fields = [];
  const params = [];
  for (const [k, v] of Object.entries(data)) {
    if (['caption','hashtags','media_url','media_type','scheduled_date','platform'].includes(k)) {
      fields.push(`${k} = ?`); params.push(v);
    }
  }
  if (!fields.length) return getPost(id);
  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  getDb().prepare(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  logActivity(id, 'edited', data);
  return getPost(id);
}

export function updatePostStatus(id, status) {
  getDb().prepare('UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  logActivity(id, 'status_change', { status });
  return getPost(id);
}

export function deletePost(id) {
  getDb().prepare('DELETE FROM comments WHERE post_id = ?').run(id);
  getDb().prepare('DELETE FROM activity_log WHERE post_id = ?').run(id);
  getDb().prepare('DELETE FROM posts WHERE id = ?').run(id);
}

// --- Review Token ---
export function getPostByToken(token) {
  return getDb().prepare(`
    SELECT posts.*, projects.name as project_name, c.name as client_name
    FROM posts JOIN projects ON projects.id = posts.project_id JOIN clients c ON c.id = projects.client_id
    WHERE posts.review_token = ?
  `).get(token);
}

// --- Comments ---
export function getComments(postId) {
  return getDb().prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC').all(postId);
}

export function addComment({ post_id, author_name, author_role, content }) {
  const id = uuidv4();
  getDb().prepare('INSERT INTO comments (id, post_id, author_name, author_role, content) VALUES (?,?,?,?,?)').run(id, post_id, author_name, author_role, content);
  logActivity(post_id, 'comment', { author_name, content: content.substring(0, 100) });
  return getDb().prepare('SELECT * FROM comments WHERE id = ?').get(id);
}

// --- Activity Log ---
export function logActivity(postId, action, details) {
  getDb().prepare('INSERT INTO activity_log (id, post_id, action, details) VALUES (?,?,?,?)').run(uuidv4(), postId, action, JSON.stringify(details));
}

export function getActivity(postId) {
  return getDb().prepare('SELECT * FROM activity_log WHERE post_id = ? ORDER BY created_at DESC').all(postId);
}

export function getRecentActivity(limit = 20) {
  return getDb().prepare(`
    SELECT a.*, p.platform, p.caption, pr.name as project_name, c.name as client_name
    FROM activity_log a JOIN posts p ON p.id = a.post_id JOIN projects pr ON pr.id = p.project_id JOIN clients c ON c.id = pr.client_id
    ORDER BY a.created_at DESC LIMIT ?
  `).all(limit);
}

// --- Analytics ---
export function getAnalytics() {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as c FROM posts').get().c;
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM posts GROUP BY status').all();
  const byPlatform = db.prepare('SELECT platform, COUNT(*) as count FROM posts GROUP BY platform').all();
  const statusMap = {};
  byStatus.forEach(s => statusMap[s.status] = s.count);
  const platformMap = {};
  byPlatform.forEach(p => platformMap[p.platform] = p.count);
  return { total, byStatus: statusMap, byPlatform: platformMap, approvalRate: total ? Math.round(((statusMap.approved || 0) / total) * 100) : 0 };
}
