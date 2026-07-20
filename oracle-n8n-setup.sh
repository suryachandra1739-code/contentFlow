#!/bin/bash
# ============================================
# ContentFlow n8n Setup Script
# Oracle Cloud E2.Micro (1 OCPU, 1 GB RAM)
# Covers: Steps 1.5 → 3.5 of Deployment Guide
# ============================================
# USAGE:
#   1. SSH into your Oracle VM:
#      ssh -i ~/Downloads/ssh-key-*.key ubuntu@YOUR_ORACLE_PUBLIC_IP
#   2. Copy this script to the VM:
#      scp -i ~/Downloads/ssh-key-*.key oracle-n8n-setup.sh ubuntu@YOUR_IP:~/
#   3. Run it:
#      bash oracle-n8n-setup.sh
#
# OPTIONAL — add your domain for HTTPS (Phase 3):
#      bash oracle-n8n-setup.sh --domain n8n.yourdomain.com
# ============================================

set -e

# Parse arguments
DOMAIN=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: bash oracle-n8n-setup.sh [--domain n8n.yourdomain.com]"
            exit 1
            ;;
    esac
done

SERVER_IP=$(curl -s ifconfig.me)
echo "============================================"
echo " ContentFlow n8n Setup"
echo " Server IP: $SERVER_IP"
if [ -n "$DOMAIN" ]; then
    echo " Domain: $DOMAIN"
fi
echo "============================================"
echo ""

# ─────────────────────────────────────────────
# PHASE 1.5: Initial Server Setup
# ─────────────────────────────────────────────

echo "=== Step 1.5: System update ==="
sudo apt update && sudo apt upgrade -y

echo ""
echo "=== Step 1.5: Create 2GB swap (critical for 1GB RAM) ==="
if [ -f /swapfile ]; then
    echo "Swap file already exists, skipping..."
else
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi
echo "Swap status:"
free -h

echo ""
echo "=== Step 1.5: Open ports in OS firewall ==="
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 5678 -j ACCEPT
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save

# ─────────────────────────────────────────────
# PHASE 2: Install n8n
# ─────────────────────────────────────────────

echo ""
echo "=== Step 2.1: Install Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"

echo ""
echo "=== Step 2.2: Install n8n globally ==="
sudo npm install -g n8n

echo ""
echo "=== Step 2.3: Create n8n system user & data directory ==="
sudo useradd -r -m -s /bin/bash n8n 2>/dev/null || echo "User 'n8n' already exists"
sudo mkdir -p /home/n8n/.n8n
sudo chown -R n8n:n8n /home/n8n

echo ""
echo "=== Step 2.4: Create systemd service ==="

# Determine protocol and URLs based on whether domain is provided
if [ -n "$DOMAIN" ]; then
    N8N_HOST="$DOMAIN"
    N8N_PROTOCOL="https"
    WEBHOOK_URL="https://$DOMAIN/"
    EDITOR_URL="https://$DOMAIN/"
else
    N8N_HOST="$SERVER_IP"
    N8N_PROTOCOL="http"
    WEBHOOK_URL="http://$SERVER_IP:5678/"
    EDITOR_URL="http://$SERVER_IP:5678/"
fi

sudo tee /etc/systemd/system/n8n.service > /dev/null <<EOF
[Unit]
Description=n8n Workflow Automation
After=network.target

[Service]
Type=simple
User=n8n
Environment=N8N_HOST=$N8N_HOST
Environment=N8N_PORT=5678
Environment=N8N_PROTOCOL=$N8N_PROTOCOL
Environment=WEBHOOK_URL=$WEBHOOK_URL
Environment=N8N_EDITOR_BASE_URL=$EDITOR_URL
Environment=NODE_OPTIONS=--max-old-space-size=512
ExecStart=/usr/bin/n8n start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo "=== Step 2.5: Start n8n ==="
sudo systemctl daemon-reload
sudo systemctl enable n8n
sudo systemctl start n8n
echo "n8n service started. Checking status..."
sleep 3
sudo systemctl status n8n --no-pager || true

# ─────────────────────────────────────────────
# PHASE 3: HTTPS with Caddy (if domain provided)
# ─────────────────────────────────────────────

if [ -n "$DOMAIN" ]; then
    echo ""
    echo "============================================"
    echo " Phase 3: Setting up HTTPS with Caddy"
    echo "============================================"

    echo ""
    echo "=== Step 3.1: Install Caddy ==="
    sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt update
    sudo apt install -y caddy

    echo ""
    echo "=== Step 3.3: Configure Caddy reverse proxy ==="
    sudo tee /etc/caddy/Caddyfile > /dev/null <<EOF
$DOMAIN {
    reverse_proxy localhost:5678
}
EOF

    echo ""
    echo "=== Step 3.3: Restart Caddy ==="
    sudo systemctl restart caddy
    sleep 3
    sudo systemctl status caddy --no-pager || true

    echo ""
    echo "=== Step 3.5: Close port 5678 (Caddy handles traffic on 443) ==="
    sudo iptables -D INPUT -p tcp --dport 5678 -j ACCEPT 2>/dev/null || true
    sudo netfilter-persistent save

    echo ""
    echo "============================================"
    echo " ✅ Setup Complete with HTTPS!"
    echo ""
    echo " n8n Dashboard: https://$DOMAIN"
    echo " Webhook Base:  https://$DOMAIN/webhook/"
    echo "============================================"
    echo ""
    echo " IMPORTANT: Make sure your DNS has an A record:"
    echo "   $DOMAIN → $SERVER_IP"
    echo ""
    echo " If using Cloudflare, set proxy to DNS Only"
    echo " (grey cloud) so Caddy gets its own SSL cert."
    echo "============================================"
else
    echo ""
    echo "============================================"
    echo " ✅ n8n Setup Complete (HTTP mode)"
    echo ""
    echo " n8n Dashboard: http://$SERVER_IP:5678"
    echo " Webhook Base:  http://$SERVER_IP:5678/webhook/"
    echo "============================================"
    echo ""
    echo " To add HTTPS later, re-run this script:"
    echo "   bash oracle-n8n-setup.sh --domain n8n.yourdomain.com"
    echo ""
    echo " Or follow Phase 3 of the Deployment Guide."
    echo "============================================"
fi

echo ""
echo "============================================"
echo " Next Steps:"
echo ""
echo " 1. Visit the n8n URL above and create your admin account"
echo " 2. Update your ContentFlow .env.local:"
if [ -n "$DOMAIN" ]; then
    echo "    N8N_WEBHOOK_URL=https://$DOMAIN"
else
    echo "    N8N_WEBHOOK_URL=http://$SERVER_IP:5678"
fi
echo ""
echo " 3. Import workflows from public/workflows/ into n8n"
echo " 4. Deploy ContentFlow to Vercel (Phase 7)"
echo "============================================"
