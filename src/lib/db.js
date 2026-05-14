import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

let db;

export function getDb() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
    seedIfEmpty();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      company TEXT,
      avatar_color TEXT DEFAULT '#8b5cf6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      platform TEXT NOT NULL CHECK(platform IN ('shorts','facebook','instagram')),
      caption TEXT,
      hashtags TEXT,
      media_url TEXT,
      media_type TEXT DEFAULT 'image',
      scheduled_date DATETIME,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','pending','approved','revision','rejected')),
      review_token TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_role TEXT DEFAULT 'creator' CHECK(author_role IN ('creator','client')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id)
    );
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id)
    );
  `);
}

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM clients').get();
  if (count.c > 0) return;

  const clients = [
    { id: uuidv4(), name: 'Sarah Mitchell', email: 'sarah@luminance.co', company: 'Luminance Studios', avatar_color: '#8b5cf6' },
    { id: uuidv4(), name: 'Alex Rivera', email: 'alex@novabrands.com', company: 'Nova Brands', avatar_color: '#ec4899' },
    { id: uuidv4(), name: 'Jordan Chen', email: 'jordan@peakdigital.io', company: 'Peak Digital', avatar_color: '#f97316' },
  ];

  const insertClient = db.prepare('INSERT INTO clients (id, name, email, company, avatar_color) VALUES (?, ?, ?, ?, ?)');
  for (const c of clients) insertClient.run(c.id, c.name, c.email, c.company, c.avatar_color);

  const projects = [
    { id: uuidv4(), client_id: clients[0].id, name: 'Summer Campaign 2026', description: 'Vibrant summer collection launch across all platforms' },
    { id: uuidv4(), client_id: clients[1].id, name: 'Product Launch - Nova X', description: 'Multi-platform reveal for the new Nova X product line' },
    { id: uuidv4(), client_id: clients[2].id, name: 'Q2 Social Strategy', description: 'Quarterly content plan for organic engagement growth' },
  ];

  const insertProject = db.prepare('INSERT INTO projects (id, client_id, name, description) VALUES (?, ?, ?, ?)');
  for (const p of projects) insertProject.run(p.id, p.client_id, p.name, p.description);

  const posts = [
    { id: uuidv4(), project_id: projects[0].id, platform: 'instagram', caption: '☀️ Summer is calling! Our new collection drops next week. Get ready for vibrant colors and bold designs that turn heads.', hashtags: '#SummerVibes,#NewCollection,#Fashion2026', status: 'approved', review_token: uuidv4() },
    { id: uuidv4(), project_id: projects[0].id, platform: 'facebook', caption: 'We\'re thrilled to announce our Summer 2026 collection! 🌊 Featuring sustainable fabrics and designs inspired by coastal living. Available June 1st.', hashtags: '#Sustainable,#SummerFashion', status: 'pending', review_token: uuidv4() },
    { id: uuidv4(), project_id: projects[0].id, platform: 'shorts', caption: 'Behind the scenes of our Summer shoot 🎬 #BTS', hashtags: '#BehindTheScenes,#FashionShoot', status: 'draft', review_token: uuidv4() },
    { id: uuidv4(), project_id: projects[1].id, platform: 'instagram', caption: 'Introducing Nova X. The future is here. 🚀 Precision engineered. Beautifully designed. Launching March 15.', hashtags: '#NovaX,#Innovation,#TechLaunch', status: 'revision', review_token: uuidv4() },
    { id: uuidv4(), project_id: projects[1].id, platform: 'shorts', caption: 'Nova X in 30 seconds ⚡ Everything you need to know', hashtags: '#NovaX,#ProductReveal', status: 'pending', review_token: uuidv4() },
    { id: uuidv4(), project_id: projects[2].id, platform: 'facebook', caption: 'Peak Digital helps businesses scale with data-driven strategies. Here\'s how we increased engagement by 340% for our latest client.', hashtags: '#DigitalMarketing,#Growth', status: 'approved', review_token: uuidv4() },
    { id: uuidv4(), project_id: projects[2].id, platform: 'instagram', caption: '📊 Data doesn\'t lie. See the results that speak for themselves. Swipe to learn more →', hashtags: '#DataDriven,#Results', status: 'rejected', review_token: uuidv4() },
    { id: uuidv4(), project_id: projects[2].id, platform: 'shorts', caption: '3 tips to boost your social media engagement 📈', hashtags: '#SocialMediaTips,#Marketing', status: 'pending', review_token: uuidv4() },
  ];

  const insertPost = db.prepare('INSERT INTO posts (id, project_id, platform, caption, hashtags, status, review_token) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertActivity = db.prepare('INSERT INTO activity_log (id, post_id, action, details) VALUES (?, ?, ?, ?)');

  for (const p of posts) {
    insertPost.run(p.id, p.project_id, p.platform, p.caption, p.hashtags, p.status, p.review_token);
    insertActivity.run(uuidv4(), p.id, 'created', JSON.stringify({ status: p.status }));
  }

  const insertComment = db.prepare('INSERT INTO comments (id, post_id, author_name, author_role, content) VALUES (?, ?, ?, ?, ?)');
  insertComment.run(uuidv4(), posts[3].id, 'Alex Rivera', 'client', 'Love the concept but can we make the CTA stronger? Also the launch date should be March 20 not 15.');
  insertComment.run(uuidv4(), posts[3].id, 'Creative Team', 'creator', 'Great feedback! We\'ll update the date and strengthen the CTA. New version coming soon.');
  insertComment.run(uuidv4(), posts[6].id, 'Jordan Chen', 'client', 'The data visualization feels too cluttered. Can we simplify and focus on the 340% stat?');
}
