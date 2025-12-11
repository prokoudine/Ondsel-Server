<!--
SPDX-FileCopyrightText: 2025 Amritpal Singh <amrit3701@gmail.com>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Lens App Installation Guide for TrueNAS SCALE

This guide provides step-by-step instructions for installing Lens on TrueNAS SCALE using Custom App Install via YAML.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Storage Setup](#storage-setup)
- [Installation Steps](#installation-steps)
- [Configuration](#configuration)
- [Accessing Services](#accessing-services)

## Overview

The Lens App deploys a complete Lens stack on TrueNAS SCALE, including:

- **Backend API** - Main application server (port 30305)
- **Frontend** - Web interface (port 30306)
- **MongoDB** - Database (port 27018)
- **Redis** - Cache and message broker for workers
- **FC Worker API** - FreeCAD worker API
- **FC Worker Celery** - Background task processor

## Prerequisites

Before installing, ensure you have:

1. **TrueNAS SCALE** with Apps enabled
2. **Storage pool** available for persistent data
3. **Network access** to the TrueNAS host

## Storage Setup

### Step 1: Determine Your Storage Path

You need to identify where to store persistent data. Common options:

- **Apps pool** (recommended): `/mnt/[pool-name]/ix-applications/lens/...`
  - Find your Apps pool in: **Apps > Settings > Advanced Settings > Pool**
- **Custom dataset**: `/mnt/[pool-name]/[dataset-name]/lens/...`

### Step 2: Create Required Directories

Open the TrueNAS Shell (System Settings > Shell) or SSH into your TrueNAS host:

```bash
# Replace /mnt/[your-pool] with your actual Apps pool path
# Example: /mnt/tank/ix-applications/lens

# Create MongoDB data directory
mkdir -p /mnt/[your-pool]/ix-applications/lens/mongodb_data

# Create uploads directory
mkdir -p /mnt/[your-pool]/ix-applications/lens/uploads_data

# Set MongoDB directory ownership (MongoDB runs as user 568:568)
chown -R 568:568 /mnt/[your-pool]/ix-applications/lens/mongodb_data
```

### Step 3: Verify Directory Permissions

```bash
# Check MongoDB directory
ls -la /mnt/[your-pool]/ix-applications/lens/mongodb_data

# Check uploads directory
ls -la /mnt/[your-pool]/ix-applications/lens/uploads_data
```

## Installation Steps

### Step 1: Open Custom App YAML Editor

1. Log in to your TrueNAS SCALE web interface
2. Navigate to **Apps > Discover Apps**
3. Click the **three-dot menu (⋮)** next to **Custom App**
4. Select **Install via YAML** from the menu
5. A YAML editor will open

### Step 2: Paste Configuration

1. Copy the contents of `lens-truenas-app.yaml`
2. Paste it into the YAML editor
3. **Important**: Before proceeding, you must update the configuration (see [Configuration](#configuration) below)

### Step 3: Update Configuration

Before deploying, update the following in the YAML:

#### Storage Paths

Replace all instances of `/mnt/[your-pool]/ix-applications/lens` with your actual storage path:

```yaml
volumes:
  - /mnt/[your-pool]/ix-applications/lens/mongodb_data:/data/db
  - /mnt/[your-pool]/ix-applications/lens/uploads_data:/app/uploads
```

#### Network Configuration

Update the `HOSTNAME`, `FRONTEND_URL`, and `VITE_APP_API_URL` environment variables:

```yaml
environment:
  - HOSTNAME=192.168.1.100  # Replace with your TrueNAS IP or hostname
  - FRONTEND_URL=http://192.168.1.100:30306  # Update accordingly
  - VITE_APP_API_URL=http://192.168.1.100:30305/  # Backend API URL for frontend
```

#### Admin Credentials

**⚠️ SECURITY WARNING**: Change the default admin credentials before deploying:

```yaml
environment:
  - DEFAULT_ADMIN_EMAIL=admin@local.test  # Change this
  - DEFAULT_ADMIN_USERNAME=admin  # Change this
  - DEFAULT_ADMIN_PASSWORD=admin@local.test  # Change this
  - DEFAULT_ADMIN_NAME=Administrator
```

#### SMTP Configuration (Optional)

If you want email functionality, configure SMTP:

```yaml
environment:
  - SMTP_HOST=smtp.example.com
  - SMTP_PORT=465
  - SMTP_USER=your-email@example.com
  - SMTP_PASS=your-password
  - SMTP_FROM=noreply@example.com
```

#### Port Configuration

Adjust ports if they conflict with other services:

- Backend: `30305:30305` (change this port if needed)
- Frontend: `30306:80` (change first number if needed)
- MongoDB: `27018:27017` (change first number if needed)

### Step 4: Deploy

1. Review all configuration changes
2. Click **Save** to deploy the application
3. TrueNAS will start pulling images and creating containers

### Step 5: Monitor Deployment

1. Navigate to **Apps**
2. You will see all running instances listed
3. Check the status of your Lens app
4. Select the Lens app to view the status of all Lens services:
   - Wait for all services to show "Running" status
   - Check logs if any service fails to start

## Configuration

### Environment Variables Reference

#### Backend Service

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `HOSTNAME` | Server hostname or IP | Yes | - |
| `PORT` | Backend API port | No | 30305 |
| `FRONTEND_URL` | Frontend application URL | Yes | - |
| `SMTP_HOST` | SMTP server hostname | No | - |
| `SMTP_PORT` | SMTP server port | No | 465 |
| `SMTP_USER` | SMTP username | No | - |
| `SMTP_PASS` | SMTP password | No | - |
| `SMTP_FROM` | SMTP from address | No | - |
| `DEFAULT_ADMIN_EMAIL` | Initial admin email | Yes | - |
| `DEFAULT_ADMIN_USERNAME` | Initial admin username | Yes | - |
| `DEFAULT_ADMIN_PASSWORD` | Initial admin password | Yes | - |
| `DEFAULT_ADMIN_NAME` | Initial admin display name | Yes | - |

#### Frontend Service

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_APP_API_URL` | Backend API URL | Yes | - |
| `VITE_STRIPE_PURCHASE_PEER_URL` | Stripe purchase URL | No | - |
| `PROXY_SCHEME_PREFIX` | Proxy scheme prefix | No | `http://` |

### Volume Mounts

| Service | Host Path | Container Path | Purpose |
|---------|-----------|----------------|---------|
| MongoDB | `/mnt/[pool]/.../mongodb_data` | `/data/db` | Database files |
| Backend | `/mnt/[pool]/.../uploads_data` | `/app/uploads` | User uploads |
| Init Container | `/mnt/[pool]/.../uploads_data` | `/mnt/uploads` | Initial file copy |

## Accessing Services

- **Frontend**: `http://[HOSTNAME]:30306`
- **Backend API**: `http://[HOSTNAME]:30305`
- **MongoDB** (external): `mongodb://[HOSTNAME]:27018`
