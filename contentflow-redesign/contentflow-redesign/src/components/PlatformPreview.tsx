import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ThumbsUp, Repeat2, Play, BadgeCheck } from 'lucide-react'
import { mediaUrl, type Platform } from '@/lib/data'

export type Aspect = 'original' | '1:1' | '9:16' | '16:9'

const ASPECT_CSS: Record<Aspect, string> = {
  original: '4/5', '1:1': '1/1', '9:16': '9/16', '16:9': '16/9',
}

interface PreviewProps {
  platform: Platform
  caption: string
  author: string
  seed: number
  aspect?: Aspect
  video?: boolean
  compact?: boolean
}

function Media({ seed, aspect = 'original', video }: { seed: number; aspect?: Aspect; video?: boolean }) {
  return (
    <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: ASPECT_CSS[aspect] }}>
      <img src={mediaUrl(seed, 720, 720)} alt="" className="w-full h-full object-cover" loading="lazy" />
      {video && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid place-items-center rounded-full" style={{ width: 44, height: 44, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)' }}>
            <Play size={18} className="text-white ml-0.5" fill="white" />
          </div>
        </div>
      )}
    </div>
  )
}

const handleStyle = { color: 'hsl(var(--faint-foreground))' } as const

export default function PlatformPreview({ platform, caption, author, seed, aspect, video, compact }: PreviewProps) {
  const cap = caption || 'Your caption appears here…'
  const short = compact && cap.length > 110 ? cap.slice(0, 110) + '…' : cap

  if (platform === 'instagram') {
    return (
      <div className="cf-card overflow-hidden text-[13px]">
        <div className="flex items-center gap-2.5 px-3.5 py-2.5">
          <div className="rounded-full p-[2px]" style={{ background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>
            <div className="w-7 h-7 rounded-full grid place-items-center text-[10px] font-bold text-white" style={{ background: 'hsl(262 60% 45%)', border: '2px solid hsl(var(--surface-2))' }}>
              {author.slice(0, 1)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs flex items-center gap-1">{author.toLowerCase().replace(/\s/g, '')} <BadgeCheck size={12} style={{ color: 'hsl(var(--st-published))' }} /></div>
            <div className="text-[10px]" style={handleStyle}>Original audio</div>
          </div>
          <MoreHorizontal size={16} style={handleStyle} />
        </div>
        <Media seed={seed} aspect={aspect} video={video} />
        <div className="px-3.5 py-3">
          <div className="flex items-center gap-3.5 mb-2">
            <Heart size={20} /> <MessageCircle size={20} /> <Send size={20} />
            <Bookmark size={20} className="ml-auto" />
          </div>
          <div className="font-semibold text-xs mb-1">1,248 likes</div>
          <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--foreground) / .9)' }}>
            <span className="font-semibold mr-1.5">{author.toLowerCase().replace(/\s/g, '')}</span>{short}
          </p>
        </div>
      </div>
    )
  }

  if (platform === 'facebook') {
    return (
      <div className="cf-card overflow-hidden text-[13px]">
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          <div className="w-9 h-9 rounded-full grid place-items-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#1877F2,#0a4faf)' }}>{author.slice(0, 1)}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs">{author}</div>
            <div className="text-[10px]" style={handleStyle}>Just now · 🌎</div>
          </div>
          <MoreHorizontal size={16} style={handleStyle} />
        </div>
        <p className="px-3.5 pb-3 text-xs leading-relaxed" style={{ color: 'hsl(var(--foreground) / .9)' }}>{short}</p>
        <Media seed={seed} aspect={aspect} video={video} />
        <div className="flex items-center justify-around px-2 py-1.5" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          {[['Like', ThumbsUp], ['Comment', MessageCircle], ['Share', Repeat2]].map(([label, Icon]) => {
            const I = Icon as typeof ThumbsUp
            return (
              <span key={label as string} className="flex items-center gap-1.5 text-[11px] font-medium py-1.5 px-3 rounded-lg" style={handleStyle}>
                <I size={14} /> {label as string}
              </span>
            )
          })}
        </div>
      </div>
    )
  }

  if (platform === 'youtube') {
    return (
      <div className="cf-card overflow-hidden text-[13px]">
        <div className="relative">
          <Media seed={seed} aspect={aspect ?? '9:16'} video />
          <div className="absolute right-2.5 bottom-16 flex flex-col items-center gap-4 text-white">
            {[Heart, MessageCircle, Send, Bookmark].map((I, i) => (
              <span key={i} className="grid place-items-center rounded-full" style={{ width: 36, height: 36, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}>
                <I size={16} />
              </span>
            ))}
          </div>
          <div className="absolute left-3 right-14 bottom-3 text-white">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full grid place-items-center text-[9px] font-bold" style={{ background: '#FF0033' }}>{author.slice(0, 1)}</div>
              <span className="text-xs font-semibold">@{author.toLowerCase().replace(/\s/g, '')}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-black">Subscribe</span>
            </div>
            <p className="text-[11px] leading-snug opacity-90">{short}</p>
          </div>
        </div>
      </div>
    )
  }

  // LinkedIn
  return (
    <div className="cf-card overflow-hidden text-[13px]">
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        <div className="w-10 h-10 rounded-full grid place-items-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#0A66C2,#004182)' }}>{author.slice(0, 1)}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-xs">{author}</div>
          <div className="text-[10px]" style={handleStyle}>Technology · 12k followers</div>
          <div className="text-[10px]" style={handleStyle}>Now · 🌐</div>
        </div>
        <MoreHorizontal size={16} style={handleStyle} />
      </div>
      <p className="px-3.5 pb-3 text-xs leading-relaxed" style={{ color: 'hsl(var(--foreground) / .9)' }}>{short}</p>
      <Media seed={seed} aspect={aspect} video={video} />
      <div className="flex items-center justify-around px-2 py-1.5" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        {[['Like', ThumbsUp], ['Comment', MessageCircle], ['Repost', Repeat2], ['Send', Send]].map(([label, Icon]) => {
          const I = Icon as typeof ThumbsUp
          return (
            <span key={label as string} className="flex items-center gap-1.5 text-[11px] font-medium py-1.5 px-2 rounded-lg" style={handleStyle}>
              <I size={14} /> {label as string}
            </span>
          )
        })}
      </div>
    </div>
  )
}
