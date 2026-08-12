// ---------- Mock data for the ContentFlow redesign mockup ----------

export type Platform = 'instagram' | 'facebook' | 'youtube' | 'linkedin'
export type PostStatus = 'draft' | 'pending' | 'approved' | 'published' | 'revision' | 'rejected'

export interface Client {
  id: string
  company: string
  contact: string
  email: string
  createdAt: string
  portal: 'active' | 'pending'
  platforms: Platform[]
  hue: number // gradient seed
}

export interface Post {
  id: string
  title: string
  caption: string
  hashtags: string[]
  platforms: Platform[]
  clientId: string
  project: string
  status: PostStatus
  author: string
  updatedAt: string
  autoDelete?: string
  media: { kind: 'image' | 'video'; seed: number }
}

export const CLIENTS: Client[] = [
  { id: 'c1', company: 'Lumen Athletics', contact: 'Maya Chen', email: 'maya@lumenathletics.co', createdAt: 'Jan 12, 2026', portal: 'active', platforms: ['instagram', 'facebook', 'youtube'], hue: 262 },
  { id: 'c2', company: 'Northwind Coffee', contact: 'Elliot Park', email: 'elliot@northwind.coffee', createdAt: 'Feb 3, 2026', portal: 'active', platforms: ['instagram', 'linkedin'], hue: 24 },
  { id: 'c3', company: 'Halcyon Skincare', contact: 'Sofia Reyes', email: 'sofia@halcyonskin.com', createdAt: 'Mar 18, 2026', portal: 'active', platforms: ['instagram', 'youtube', 'linkedin'], hue: 187 },
  { id: 'c4', company: 'Boulder & Pine', contact: 'Tom Alvarez', email: 'tom@boulderpine.outdoor', createdAt: 'Apr 2, 2026', portal: 'pending', platforms: ['facebook'], hue: 145 },
  { id: 'c5', company: 'Nimbus Fintech', contact: 'Priya Nair', email: 'priya@nimbusfin.io', createdAt: 'May 27, 2026', portal: 'pending', platforms: ['linkedin'], hue: 210 },
  { id: 'c6', company: 'Studio Kessler', contact: 'Jonas Kessler', email: 'jonas@studiokessler.de', createdAt: 'Jun 14, 2026', portal: 'active', platforms: ['instagram', 'facebook', 'youtube', 'linkedin'], hue: 320 },
]

export const POSTS: Post[] = [
  { id: 'p1', title: 'Summer Drop Teaser', caption: 'Something new is coming. The Atlas Collection drops Friday — engineered for heat, built for motion. ☀️', hashtags: ['#AtlasCollection', '#LumenAthletics', '#SummerDrop'], platforms: ['instagram', 'facebook'], clientId: 'c1', project: 'Q3 Product Launch', status: 'pending', author: 'Dana K.', updatedAt: '12m ago', autoDelete: '6d 4h', media: { kind: 'image', seed: 11 } },
  { id: 'p2', title: 'Behind the Roast Ep. 4', caption: 'Single-origin Yirgacheffe, roasted in small batches. Watch how we dial in the perfect profile.', hashtags: ['#SpecialtyCoffee', '#BehindTheRoast'], platforms: ['youtube'], clientId: 'c2', project: 'Video Series', status: 'pending', author: 'Marcus L.', updatedAt: '48m ago', media: { kind: 'video', seed: 22 } },
  { id: 'p3', title: 'Glow Ritual Tutorial', caption: 'Three steps to morning radiance with the Halcyon Renewal Serum. Save this for your AM routine ✨', hashtags: ['#SkincareRoutine', '#GlowRitual'], platforms: ['instagram'], clientId: 'c3', project: 'Always-On Content', status: 'approved', author: 'Dana K.', updatedAt: '2h ago', media: { kind: 'image', seed: 33 } },
  { id: 'p4', title: 'Trail Guide: Lost Creek', caption: 'Our favorite 8-mile loop, mapped. Difficulty: moderate. Views: unreal.', hashtags: ['#TrailGuide', '#GetOutside'], platforms: ['facebook'], clientId: 'c4', project: 'Community', status: 'pending', author: 'Alex R.', updatedAt: '3h ago', autoDelete: '2d 11h', media: { kind: 'image', seed: 44 } },
  { id: 'p5', title: 'Fintech Friday: APR Explained', caption: 'APR vs APY — what actually matters for your savings? A 60-second breakdown.', hashtags: ['#FintechFriday', '#MoneyBasics'], platforms: ['linkedin'], clientId: 'c5', project: 'Thought Leadership', status: 'revision', author: 'Marcus L.', updatedAt: '5h ago', media: { kind: 'video', seed: 55 } },
  { id: 'p6', title: 'Studio Reel — August', caption: 'A month of sets, shoots and happy accidents. Full reel on the channel.', hashtags: ['#BTS', '#StudioLife'], platforms: ['instagram', 'youtube'], clientId: 'c6', project: 'Brand Awareness', status: 'published', author: 'Dana K.', updatedAt: '1d ago', media: { kind: 'video', seed: 66 } },
  { id: 'p7', title: 'Member Spotlight: Jess', caption: 'Jess ran her first ultramarathon in Atlas gear. Her story, in her words.', hashtags: ['#MemberSpotlight'], platforms: ['instagram', 'facebook', 'linkedin'], clientId: 'c1', project: 'Community', status: 'approved', author: 'Alex R.', updatedAt: '1d ago', media: { kind: 'image', seed: 77 } },
  { id: 'p8', title: 'Cold Brew Season Launch', caption: 'Cold brew is back on the menu — smoother, bolder, and brewed for 18 hours.', hashtags: ['#ColdBrew', '#SummerMenu'], platforms: ['instagram'], clientId: 'c2', project: 'Seasonal Menu', status: 'published', author: 'Dana K.', updatedAt: '2d ago', media: { kind: 'image', seed: 88 } },
  { id: 'p9', title: 'SPF Myth-Busting Carousel', caption: '5 SPF myths, debunked by our lead formulator. Swipe through →', hashtags: ['#SPF', '#SkincareScience'], platforms: ['instagram', 'facebook'], clientId: 'c3', project: 'Education', status: 'draft', author: 'Marcus L.', updatedAt: '2d ago', media: { kind: 'image', seed: 99 } },
  { id: 'p10', title: 'Gear Care 101', caption: 'Make your shell jacket last a decade. Wash, dry, re-proof — the right way.', hashtags: ['#GearCare'], platforms: ['youtube', 'facebook'], clientId: 'c4', project: 'Education', status: 'rejected', author: 'Alex R.', updatedAt: '3d ago', media: { kind: 'video', seed: 110 } },
  { id: 'p11', title: 'Series A Announcement', caption: 'We raised $18M to make money simpler for everyone. Here is what comes next.', hashtags: ['#Announcement', '#Fintech'], platforms: ['linkedin'], clientId: 'c5', project: 'PR & Comms', status: 'approved', author: 'Dana K.', updatedAt: '3d ago', media: { kind: 'image', seed: 121 } },
  { id: 'p12', title: 'Set Design Timelapse', caption: 'From empty warehouse to neon dreamscape in 14 hours. Timelapse inside.', hashtags: ['#SetDesign', '#Timelapse'], platforms: ['youtube'], clientId: 'c6', project: 'Brand Awareness', status: 'pending', author: 'Marcus L.', updatedAt: '4d ago', media: { kind: 'video', seed: 132 } },
]

export const ACTIVITY = [
  { id: 'a1', icon: 'check', text: 'Maya Chen approved “Glow Ritual Tutorial”', time: '12m ago', tone: 'approved' },
  { id: 'a2', icon: 'message', text: 'Sofia Reyes left a comment on “SPF Myth-Busting Carousel”', time: '40m ago', tone: 'comment' },
  { id: 'a3', icon: 'upload', text: 'Dana K. published “Studio Reel — August” to 2 platforms', time: '1h ago', tone: 'published' },
  { id: 'a4', icon: 'edit', text: 'Priya Nair requested revisions on “Fintech Friday”', time: '3h ago', tone: 'revision' },
  { id: 'a5', icon: 'plus', text: 'Marcus L. created “Trail Guide: Lost Creek”', time: '5h ago', tone: 'new' },
  { id: 'a6', icon: 'user', text: 'Jonas Kessler accepted the portal invite', time: '1d ago', tone: 'client' },
]

export const COMMENTS = [
  { id: 'cm1', author: 'Maya Chen', role: 'client', time: '2h ago', text: 'Love the direction. Can we try the headline in sentence case instead of all caps?' },
  { id: 'cm2', author: 'Dana K.', role: 'team', time: '1h ago', text: 'Good call — swapped the headline and bumped the logo 8px. New render attached.' },
  { id: 'cm3', author: 'Maya Chen', role: 'client', time: '32m ago', text: 'Perfect. Approving once the CTA button is the new violet.' },
]

export const clientById = (id: string) => CLIENTS.find((c) => c.id === id)!

export const PLATFORM_META: Record<Platform, { label: string; color: string }> = {
  instagram: { label: 'Instagram', color: '#E1306C' },
  facebook: { label: 'Facebook', color: '#1877F2' },
  youtube: { label: 'YouTube', color: '#FF0033' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2' },
}

export const STATUS_META: Record<PostStatus, { label: string; var: string }> = {
  draft: { label: 'Draft', var: '--st-draft' },
  pending: { label: 'Pending', var: '--st-pending' },
  approved: { label: 'Approved', var: '--st-approved' },
  published: { label: 'Published', var: '--st-published' },
  revision: { label: 'Revision', var: '--st-revision' },
  rejected: { label: 'Rejected', var: '--st-rejected' },
}

export const mediaUrl = (seed: number, w = 640, h = 640) => `https://picsum.photos/seed/cf${seed}/${w}/${h}`
