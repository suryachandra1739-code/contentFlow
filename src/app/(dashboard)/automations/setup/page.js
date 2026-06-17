'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import { useToast } from '@/components/Toast';

const steps = [
  {
    id: 1, title: 'Create Oracle Cloud Account', icon: '☁️',
    content: [
      { type: 'text', value: 'Sign up for Oracle Cloud Free Tier at cloud.oracle.com. You get 4 ARM CPUs, 24GB RAM, and 200GB storage for free — forever.' },
      { type: 'text', value: 'Use a real email and payment method (you won\'t be charged). Oracle uses it for verification only.' },
    ]
  },
  {
    id: 2, title: 'Provision a VM Instance', icon: '🖥️',
    content: [
      { type: 'text', value: 'In the OCI Console, go to Compute → Instances → Create Instance.' },
      { type: 'list', items: ['Image: Ubuntu 24.04 (x86_64)', 'Shape: VM.Standard.E1.Flex', 'OCPUs: 2 (or up to 4)', 'Memory: 12 GB (or up to 24 GB)', 'Boot volume: 50 GB', 'Download your SSH key pair'] },
      { type: 'text', value: 'Under Networking, make sure "Assign a public IPv4 address" is checked.' },
    ]
  },
  {
    id: 3, title: 'Open Firewall Ports', icon: '🔓',
    content: [
      { type: 'text', value: 'You need to open ports in TWO places — the OCI Security List and the OS firewall.' },
      { type: 'subheading', value: 'OCI Security List:' },
      { type: 'text', value: 'Go to Networking → Virtual Cloud Networks → your VCN → Security Lists → Default. Add Ingress Rules:' },
      { type: 'list', items: ['TCP port 80 (HTTP)', 'TCP port 443 (HTTPS)', 'TCP port 5678 (n8n — optional, only if not using reverse proxy)'] },
      { type: 'subheading', value: 'OS Firewall (run on your VM):' },
      { type: 'code', lang: 'bash', value: 'sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT\nsudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT\nsudo netfilter-persistent save' },
    ]
  },
  {
    id: 4, title: 'Install Docker', icon: '🐳',
    content: [
      { type: 'text', value: 'SSH into your instance and install Docker + Docker Compose:' },
      { type: 'code', lang: 'bash', value: '# SSH into your VM\nssh -i ~/your-key.pem ubuntu@YOUR_PUBLIC_IP\n\n# Install Docker\ncurl -fsSL https://get.docker.com | sh\nsudo usermod -aG docker $USER\nnewgrp docker\n\n# Verify\ndocker --version\ndocker compose version' },
    ]
  },
  {
    id: 5, title: 'Deploy n8n with Docker Compose', icon: '⚡',
    content: [
      { type: 'text', value: 'Create a project directory and docker-compose.yml:' },
      { type: 'code', lang: 'bash', value: 'mkdir ~/n8n && cd ~/n8n\nnano docker-compose.yml' },
      { type: 'text', value: 'Paste this docker-compose.yml:' },
      { type: 'code', lang: 'yaml', value: `version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=n8n.yourdomain.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://n8n.yourdomain.com/
      - GENERIC_TIMEZONE=Asia/Kolkata
    volumes:
      - n8n_data:/home/node/.n8n

  caddy:
    image: caddy:2-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config

volumes:
  n8n_data:
  caddy_data:
  caddy_config:` },
      { type: 'text', value: 'Create the Caddyfile for automatic SSL:' },
      { type: 'code', lang: 'bash', value: 'nano Caddyfile' },
      { type: 'code', lang: 'text', value: `n8n.yourdomain.com {
    reverse_proxy n8n:5678
}` },
      { type: 'text', value: 'Start everything:' },
      { type: 'code', lang: 'bash', value: 'docker compose up -d\n\n# Check logs\ndocker compose logs -f' },
    ]
  },
  {
    id: 6, title: 'Point Your Domain', icon: '🌐',
    content: [
      { type: 'text', value: 'In your DNS provider (e.g., Cloudflare, Namecheap):' },
      { type: 'list', items: ['Create an A record: n8n.yourdomain.com → YOUR_ORACLE_PUBLIC_IP', 'If using Cloudflare, set proxy to "DNS only" (grey cloud) for Caddy SSL to work', 'Wait 5-10 minutes for DNS propagation'] },
      { type: 'text', value: 'Visit https://n8n.yourdomain.com — you should see the n8n setup screen! 🎉' },
    ]
  },
  {
    id: 7, title: 'Import Workflows', icon: '📦',
    content: [
      { type: 'text', value: 'Download the workflow templates from the Automations page, then:' },
      { type: 'list', items: ['Open your n8n instance in the browser', 'Click "Add workflow" → "Import from file"', 'Upload social-publisher.json', 'Upload instagram-dm-bot.json', 'Configure credentials for each platform (Instagram, Twitter, LinkedIn)', 'Activate the workflows'] },
      { type: 'text', value: 'The webhook URLs will be shown in each workflow. Copy them and paste into the Automations page in ContentFlow.' },
    ]
  },
  {
    id: 8, title: 'Meta Developer App (for Instagram DMs)', icon: '📱',
    content: [
      { type: 'text', value: 'For the Instagram DM Bot, you need a Meta Developer App:' },
      { type: 'list', items: [
        '1. Go to developers.facebook.com → Create App',
        '2. Choose "Business" type',
        '3. Add "Instagram Graph API" and "Webhooks" products',
        '4. Under Instagram → Basic Display, connect your Instagram Business account',
        '5. Under Webhooks, subscribe to: comments, messages, messaging_postbacks',
        '6. Set Callback URL to: https://n8n.yourdomain.com/webhook/instagram-webhook',
        '7. Set Verify Token to a random string (configure same in n8n)',
      ]},
      { type: 'subheading', value: 'Required Permissions (need App Review):' },
      { type: 'list', items: ['instagram_manage_comments', 'instagram_manage_messages', 'pages_manage_metadata'] },
      { type: 'text', value: '⚠️ App Review takes ~20 days. You can test with up to 25 Test Users immediately while waiting.' },
    ]
  },
];

function CodeBlock({ code, lang }) {
  const addToast = useToast();
  const copy = () => {
    navigator.clipboard.writeText(code);
    addToast('Copied to clipboard!', 'success');
  };
  return (
    <div className="auto-code-block">
      <div className="auto-code-header">
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{lang}</span>
        <button onClick={copy} className="auto-code-copy">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          Copy
        </button>
      </div>
      <pre style={{ margin: 0, overflow: 'auto', fontSize: 12, lineHeight: 1.6 }}><code>{code}</code></pre>
    </div>
  );
}

export default function SetupGuidePage({ embedded = false }) {
  const [openStep, setOpenStep] = useState(1);

  const stepsList = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: embedded ? 12 : 0 }}>
      {steps.map((step, i) => (
        <motion.div key={step.id} className="card auto-setup-step" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
          <button className="auto-setup-step-header" onClick={() => setOpenStep(openStep === step.id ? 0 : step.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="auto-step-number">{step.id <= openStep ? step.icon : step.id}</div>
              <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--sans)' }}>{step.title}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openStep === step.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {openStep === step.id && (
            <motion.div className="auto-setup-step-body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              {step.content.map((block, j) => {
                if (block.type === 'text') return <p key={j} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>{block.value}</p>;
                if (block.type === 'subheading') return <h4 key={j} style={{ fontSize: 13, fontWeight: 600, marginTop: 12, marginBottom: 6 }}>{block.value}</h4>;
                if (block.type === 'list') return (
                  <ul key={j} style={{ paddingLeft: 20, marginBottom: 12 }}>
                    {block.items.map((item, k) => <li key={k} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 4 }}>{item}</li>)}
                  </ul>
                );
                if (block.type === 'code') return <CodeBlock key={j} code={block.value} lang={block.lang} />;
                return null;
              })}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                {step.id < steps.length && (
                  <button className="btn btn-primary btn-sm" onClick={() => setOpenStep(step.id + 1)} style={{ fontSize: 12 }}>
                    Next: {steps[step.id]?.title} →
                  </button>
                )}
                {step.id === steps.length && !embedded && (
                  <Link href="/automations" className="btn btn-primary btn-sm" style={{ fontSize: 12 }}>
                    ✅ Done — Go to Automations
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );

  if (embedded) {
    return stepsList;
  }

  return (
    <PageTransition><div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <motion.div className="page-header" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Link href="/automations" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <div>
            <h1>Setup Guide</h1>
            <p>Oracle Cloud + n8n — complete walkthrough</p>
          </div>
        </div>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
          {steps.map(s => (
            <div key={s.id} style={{ flex: 1, height: 3, borderRadius: 2, background: s.id <= openStep ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s' }} />
          ))}
        </div>
      </motion.div>

      {stepsList}
    </div></PageTransition>
  );
}
