<!--
SPDX-FileCopyrightText: 2025 Amritpal Singh <amrit3701@gmail.com>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Admin Panel (Xavier) Documentation

The Xavier admin panel is a hidden administrative interface for site administrators to manage platform configuration, branding, software releases, legal documents, and user management.

> **Access:** Navigate to `http://localhost:3000/xavier-68373833` (requires site administrator)
>
> **Site Administrator:** A user who is a member of the admin organization with `isAdmin: true`
>
> **Default Credentials:**
> - Email: `admin@local.test`
> - Password: `admin@local.test`
>
> Created automatically by `entry.sh` when backend docker starts. Customizable via environment variables (`DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_ADMIN_USERNAME`, `DEFAULT_ADMIN_NAME`)

---

## Page Overview

| Page | Route | Description |
|------|-------|-------------|
| [Xavier Menu](#xavier-menu) | `/xavier-68373833` | Main admin dashboard |
| [Branding Hub](#branding-hub) | `/xavier-branding-12345678` | Central branding configuration |
| [Brand Identity](#brand-identity) | `/xavier-branding-logo-87654321` | Logo, favicon, title & social links |
| [Homepage Content](#homepage-content) | `/xavier-branding-homepage-11223344` | Homepage customization |
| [Default Model](#default-model) | `/xavier-branding-default-model-55667788` | Default 3D model for new users |
| [Software Releases](#software-releases) | `/xavier-9384242` | Manage download links |
| [Key Documents](#key-documents) | `/xavier-7492783/:name` | Legal document management |
| [Remove User](#remove-user) | `/xavier-55554337898` | User account deletion |
| [Admin Search](#admin-search) | `/xavier-9584355633/:text` | Search users, workspaces, orgs |

---

## Xavier Menu

**Route:** `/xavier-68373833`

The main entry point for the admin panel. Provides navigation links to all administrative functions.

### Features
- Quick access to all branding configuration
- Software release management
- Legal document editing (Privacy Policy, Terms of Service, Signup Survey)
- User removal tool
- Admin search functionality

---

## Branding Hub

**Route:** `/xavier-branding-12345678`

Central dashboard for managing all platform branding and visual identity settings.

### Sections
- **Brand Identity** - Configure visual elements and social links
- **Homepage Content** - Edit homepage text, banner, and RSS feed
- **Default Model** - Set the default 3D model created on new user registration
- **Legal Documents** - Quick access to Privacy Policy, Terms of Service, and Survey Prompt

---

## Brand Identity

**Route:** `/xavier-branding-logo-87654321`

Configure the platform's visual identity and branding elements.

### Configurable Options
| Setting | Description |
|---------|-------------|
| Site Title | Platform name displayed across the site |
| Logo | Main logo image |
| Favicon | Browser tab icon |
| Copyright Text | Sidebar copyright text |
| Social Links | Forum, Discord, YouTube URLs for email templates |

### Usage
1. Upload new logo/favicon files (preview shown before saving)
2. Enter site title and copyright text
3. Configure social media links for email templates
4. Click **Save** to apply changes

---

## Homepage Content

**Route:** `/xavier-branding-homepage-11223344`

Customize the homepage content, banner, and RSS feed settings.

### Configurable Options

#### Banner Configuration
| Setting | Description |
|---------|-------------|
| Enable Banner | Toggle banner visibility |
| Banner Title | Header text |
| Banner Content | Markdown-formatted body content |
| Banner Color | Hex color code for background |

#### Homepage Settings
| Setting | Description |
|---------|-------------|
| Homepage Title | Main title |
| Homepage Content | Markdown content for the page |
| RSS Feed Enabled | Toggle RSS feed sidebar |
| RSS Feed URL | URL of the RSS feed |
| RSS Feed Name | Display name |

### Usage
1. Configure banner settings if desired
2. Set homepage title and markdown content
3. Optionally enable RSS feed with URL and display name
4. Preview changes in real-time
5. Click **Save Changes** to apply

---

## Default Model

**Route:** `/xavier-branding-default-model-55667788`

Upload and configure the default 3D model that appears for new user registrations.

### Features
- View current default model with attributes
- 3D model preview viewer
- Upload new FCStd files

### Usage
1. Review current model and attributes
2. Select a new FCStd file to upload
3. Click **Upload Model** to process and save
4. Thumbnail is automatically generated from the model

---

## Software Releases

**Route:** `/xavier-9384242`

Manage software download links for stable releases and weekly builds.

### Configuration Options
| Setting | Description |
|---------|-------------|
| Software Title | Name of the desktop application |
| Desktop App Protocol | URL scheme handler (e.g., `appname:`) |
| Enable Open in Desktop App | Toggle desktop app integration |
| Version | Current release version |

### Usage

#### Manual Update
1. Click edit icon on any release entry
2. Enter the new download URL
3. Save changes

#### Bulk Update from GitHub
1. Run the GitHub CLI command to fetch releases:
   ```bash
   gh auth login
   gh api --method GET /repos/USERNAME/REPO/releases --header 'Accept: application/vnd.github+json' > latest_releases.json
   ```
2. Paste the JSON content into the text area
3. Click **SCAN JSON** to parse releases
4. Review the extracted URLs
5. Click **SAVE ALL** to bulk update all entries

---

## Key Documents

**Route:** `/xavier-7492783/:name`

Manage legal and policy documents with version tracking.

### Available Documents
| Document | Route |
|----------|-------|
| Privacy Policy | `/xavier-7492783/privacy-policy` |
| Terms of Service | `/xavier-7492783/terms-of-service` |
| Signup Survey Prompt | `/xavier-7492783/signup-survey-prompt` |

### Features
- View current document content (rendered Markdown)
- View raw Markdown source
- Version history with effective dates
- Automatic deprecation of previous versions

### Usage
1. Navigate to the specific document
2. Click **Edit** to modify content
3. Enter new Markdown content
4. Specify version
5. Save to create new version (previous version auto-deprecated)

---

## Remove User

**Route:** `/xavier-55554337898`

Permanently delete user accounts from the platform.

### What Gets Redacted
- User fields: email, name, username, password → set to `<REDACTED>`
- Personal organization: name, slug, description → set to `<REDACTED>`
- Username and email become available for new registrations

### What Gets Deleted
- Default workspace and its root directory
- Default model file (if present)
- Notifications and org secondary references
- Keywords references

### What Gets Preserved
- User `_id` (record remains with redacted data)
- Subscription details (tier set to `deleted`, state set to `closed`)

### Limitations
- Only works on "mostly empty" accounts
- Fails if user has:
  - Membership in other organizations
  - More than one workspace
  - Files in root directory (other than default model)
  - Subdirectories in root directory
  - Paid subscription (Peer or Enterprise tier)

### Usage
1. Use the [Admin Search](#admin-search) page to find user ID and email address
2. Enter the **Internal User ID**
3. Enter the **Email Address**
4. Click **Delete** to proceed
5. Review results in the output panel

> **Warning:** This action is NOT reversible.

---

## Admin Search

**Route:** `/xavier-9584355633/:text`

Search across the platform using the Keywords service.

### Features
- Unified search across all entity types
- Direct navigation to user/workspace/org pages
- User details expansion (ID, tier, username) via **Get Detail**

### Searchable Entities
- Users
- Workspaces
- Organizations
- Shared Models
- Models

### Usage
1. Enter search term in the search dialog
2. Review results with curated previews
3. Click **Get Detail** to expand details (currently only shows user info: ID, tier, username)
4. Click result to navigate directly to the entity page

---

## Security Notes

- All Xavier pages require site administrator privileges
- Non-administrators are automatically redirected to the home page
