# WireFlow

**WireFlow** is a visual workflow editor and process management application built with React and Node.js. It enables teams to design, document, and manage complex workflows using an intuitive drag-and-drop interface powered by ReactFlow.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![React](https://img.shields.io/badge/react-18.3.1-blue)

---

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### Core Workflow Management
- **Visual Workflow Editor**: Drag-and-drop interface for creating and editing workflows
- **Multiple Node Types**: Support for Input, Output, Decision, and Default (process) nodes
- **Smart Connections**: Animated, smoothstep edges with automatic routing
- **URL Recognition**: Automatically displays web icons for URLs in node descriptions
- **Workflow Versioning**: Automatic version snapshots with visual preview and restore capabilities
- **Export Capabilities**: Export workflows as PNG images or JSON files

### Organization & Collaboration
- **Team Management**: Organize workflows by teams
- **Owner Assignment**: Assign owners to workflows for accountability
- **Tagging System**: Categorize workflows with custom tags for easy filtering
- **Search & Filter**: Advanced filtering by teams, owners, tags, and text search
- **Workflow Metadata**: Track creation dates, descriptions, and organizational context

### Administration & Security
- **Role-Based Authentication**: JWT-based authentication with admin/user roles
- **User Management**: Admin interface for creating, editing, and managing users
- **Data Backup System**: Automated compressed backups with manual restore options
- **Version Control**: Complete workflow version history with visual comparison
- **Admin Dashboard**: Centralized management interface for system operations

### Data Management
- **File-Based Storage**: Simple, portable JSON-based data storage
- **Compressed Archives**: Automatic gzip compression for versions and backups
- **Audit Trail**: Version timestamps and metadata tracking
- **Data Import/Export**: Bulk data operations for migrations

---

## 🏗️ Architecture

WireFlow follows a client-server architecture:

```
┌─────────────────────────────────────────┐
│         Frontend (React + Vite)         │
│  - ReactFlow visual editor              │
│  - TailwindCSS styling                  │
│  - React Router navigation              │
│  Port: 5173 (dev) / 80 or 443 (prod)   │
└───────────────┬─────────────────────────┘
                │ REST API (JSON)
                │ JWT Authentication
┌───────────────▼─────────────────────────┐
│       Backend (Node.js + Express)       │
│  - RESTful API endpoints                │
│  - JWT authentication                   │
│  - File-based storage                   │
│  - Backup/restore operations            │
│  Port: 5001 (default)                   │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│         Data Directory Structure        │
│  - workflows: wf-*.json.gz              │
│  - teams.json, owners.json, tags.json   │
│  - backups/: data_backup_*.tar.gz       │
│  - backups/versions/: version snapshots │
│  - users.json (credentials)             │
└─────────────────────────────────────────┘
```

**Technology Stack:**
- **Frontend**: React 18.3.1, React Router 6.26.2, ReactFlow 10.3.17, TailwindCSS 3.4.13, Vite 7.1.6
- **Backend**: Node.js, Express 4.21.1, JWT authentication, zlib compression
- **Storage**: File-based JSON with gzip compression
- **Development**: ESLint, Autoprefixer, PostCSS

---

## 📦 Prerequisites

Before installing WireFlow, ensure you have:

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Operating System**: Windows, Linux, or macOS
- **RAM**: Minimum 2GB, recommended 4GB+
- **Disk Space**: ~500MB for application + space for data storage

Check your versions:
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be v8.0.0 or higher
```

---

## 🚀 Installation

### 1. Clone or Extract the Repository

If using Git:
```bash
git clone <repository-url>
cd wireflow
```

If using a zip file, extract it and navigate to the directory.

### 2. Install Backend Dependencies

```bash
cd wireflow/backend
npm install
```

This installs:
- express: Web server framework
- cors: Cross-origin resource sharing
- jsonwebtoken: JWT authentication
- fs-extra: Enhanced file system operations
- body-parser: Request body parsing
- tar: Backup archive creation
- neo4j-driver: (Optional) Graph database integration

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

This installs:
- react, react-dom: UI framework
- react-flow-renderer: Visual workflow editor
- react-router-dom: Client-side routing
- tailwindcss: Utility-first CSS framework
- vite: Build tool and dev server
- html-to-image: Export workflows as images

---

## ⚙️ Configuration

### Backend Configuration

The backend can be configured using environment variables. Create a `.env` file in `wireflow/backend/`:

```env
# Server Configuration
PORT=5001                              # Backend server port
NODE_ENV=development                   # Environment (development/production)

# Authentication
JWT_SECRET=your_secure_secret_here     # JWT signing secret (CHANGE IN PRODUCTION!)
ADMIN_PW=secure_admin_password         # Admin user default password
HBERTINI_PW=secure_hbertini_password   # hbertini user default password

# Optional: Database (if using Neo4j integration)
# NEO4J_URI=bolt://localhost:7687
# NEO4J_USER=neo4j
# NEO4J_PASSWORD=password
```

**⚠️ Security Note**: Always change default passwords and JWT_SECRET in production!

### Frontend Configuration

The frontend connects to the backend via `src/api.js`. Update the API base URL if needed:

**For Development** (default):
```javascript
// frontend/src/api.js
const API_BASE = 'http://localhost:5001';
```

**For Production**:
```javascript
// frontend/src/api.js
const API_BASE = '/api';  // Or your production backend URL
```

You can also use environment variables with Vite:

Create `frontend/.env.production`:
```env
VITE_API_URL=https://your-domain.com/api
```

Then update `api.js`:
```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';
```

---

## 🎯 Usage

### Development Mode

#### Starting the Backend

Open a terminal and run:

**Linux/macOS:**
```bash
cd wireflow/backend
node server.js
```

**Windows PowerShell:**
```powershell
cd wireflow\backend
node server.js
```

You should see: `Server running on port 5001`

#### Starting the Frontend

Open a **second terminal** and run:

**Linux/macOS:**
```bash
cd wireflow/frontend
npm run dev
```

**Windows PowerShell:**
```powershell
cd wireflow\frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

#### Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `adminpass` (or value of `ADMIN_PW` env variable)

**Secondary Admin:**
- Username: `hbertini`
- Password: `hbertinipass` (or value of `HBERTINI_PW` env variable)

### Using the Application

#### 1. Login
- Navigate to `http://localhost:5173`
- Enter your credentials and click "Login"
- Your session token is stored in localStorage

#### 2. Create a Workflow
- Click "Create Workflow" button
- Fill in workflow details:
  - **Name**: Descriptive workflow name
  - **Description**: Purpose and context
  - **Team**: Select or create a team
  - **Owner**: Assign responsibility
  - **Tags**: Add categorization tags

#### 3. Design Your Workflow
- **Add Nodes**: Click node type buttons (Input, Default, Decision, Output)
- **Connect Nodes**: Drag from one node's handle to another
- **Edit Nodes**: Click a node to edit its label and description
- **Delete Elements**: Select and press Delete key
- **Add URLs**: Paste URLs in descriptions - they'll display as clickable icons

#### 4. Save & Export
- Click "Save Workflow" to persist changes
- Use "Export as PNG" for documentation
- Use "Export as JSON" for data migration

#### 5. Manage Versions
- Workflow versions are auto-saved on changes
- Go to Admin → Versions to:
  - View version history
  - Preview workflows visually
  - Restore previous versions

#### 6. Admin Functions
- Navigate to "Admin" section (admin role required)
- **User Management**: Create/edit/delete users
- **Backups**: Create and restore data backups
- **Versions**: Manage workflow version history
- **Teams/Owners**: Manage organizational data

---

## 🌐 Deployment

### Production Build

#### 1. Build the Frontend

```bash
cd wireflow/frontend
npm run build
```

This creates an optimized production build in `frontend/dist/`.

#### 2. Configure Environment

**Backend:**
- Set `NODE_ENV=production`
- Use a strong `JWT_SECRET`
- Change all default passwords
- Configure proper CORS origins

**Frontend:**
- Update API base URL in `src/api.js` or use environment variables
- Ensure build artifacts are served correctly

### Deployment Options

#### Option A: Separate Hosting (Recommended)

**Backend (Node.js Server):**
1. Deploy to a Node.js hosting service (AWS, DigitalOcean, Heroku, etc.)
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start wireflow/backend/server.js --name wireflow-backend
   pm2 save
   pm2 startup  # Enable auto-start on boot
   ```
3. Set up a reverse proxy (Nginx/Apache) for SSL/TLS
4. Configure firewall to allow only necessary ports

**Frontend (Static Files):**
1. Upload `frontend/dist/*` to static hosting (Netlify, Vercel, S3+CloudFront, etc.)
2. Configure routing to handle React Router (SPA)
3. Set API_BASE to your backend URL

#### Option B: Unified Deployment

Serve the frontend from the backend:

1. Copy frontend build to backend:
   ```bash
   cp -r wireflow/frontend/dist wireflow/backend/public
   ```

2. Add static file serving to `backend/server.js`:
   ```javascript
   const path = require('path');
   
   // Serve static frontend files
   app.use(express.static(path.join(__dirname, 'public')));
   
   // Handle React Router - serve index.html for all non-API routes
   app.get('*', (req, res) => {
     if (!req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
       res.sendFile(path.join(__dirname, 'public', 'index.html'));
     }
   });
   ```

3. Deploy the backend with built-in frontend

### Using systemd (Linux)

Create a service file at `/etc/systemd/system/wireflow-backend.service`:

```ini
[Unit]
Description=WireFlow Backend Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/wireflow/backend
Environment="NODE_ENV=production"
Environment="PORT=5001"
Environment="JWT_SECRET=your_secure_secret"
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable wireflow-backend
sudo systemctl start wireflow-backend
sudo systemctl status wireflow-backend
```

### Nginx Reverse Proxy Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/wireflow/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /auth {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

## 📁 Project Structure

```
wireflow/
├── backend/
│   ├── server.js                    # Main Express server
│   ├── auth.js                      # Authentication helper
│   ├── package.json                 # Backend dependencies
│   ├── users.json                   # User credentials (excluded from git)
│   ├── README-auth.md               # Authentication documentation
│   ├── admin/
│   │   ├── workflow_versions.js     # Version management logic
│   │   └── version_manager.js       # Version utilities
│   ├── data/                        # Data storage (excluded from git)
│   │   ├── teams.json               # Team definitions
│   │   ├── owners.json              # Owner list
│   │   ├── tags.json                # Tag definitions
│   │   ├── wf-*.json.gz             # Workflow files (compressed)
│   │   └── backups/
│   │       ├── data_backup_*.tar.gz # Full data backups
│   │       └── versions/            # Workflow version snapshots
│   │           └── wf-*_*.json.gz   # Version files
│   └── scripts/
│       ├── test-backup-api.js       # Backup testing
│       └── migrate-*.js             # Migration scripts
├── frontend/
│   ├── src/
│   │   ├── main.jsx                 # React entry point
│   │   ├── App.jsx                  # Main application component
│   │   ├── api.js                   # API client
│   │   ├── index.css                # Global styles
│   │   └── components/
│   │       ├── WorkflowList.jsx     # Workflow listing & filtering
│   │       ├── WorkflowEditor.jsx   # Visual workflow editor
│   │       ├── AdminTasks.jsx       # Admin dashboard
│   │       ├── Login.jsx            # Authentication UI
│   │       ├── TagManager.jsx       # Tag management
│   │       ├── TeamManager.jsx      # Team management
│   │       └── OwnerManager.jsx     # Owner management
│   ├── index.html                   # HTML template
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # TailwindCSS configuration
│   └── postcss.config.js            # PostCSS configuration
├── tools/
│   ├── backup_data.sh               # Backup script
│   ├── wireflow-backend.service     # systemd service template
│   └── wireflow-frontend.service    # systemd frontend service
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
```

---

## 📖 API Documentation

### Authentication Endpoints

**POST /auth/login**
```json
Request: { "username": "admin", "password": "adminpass" }
Response: { "token": "jwt_token_here", "user": { "username": "admin", "role": "admin" } }
```

**POST /auth/users** (Admin only)
```json
Request: { "username": "newuser", "password": "pass123", "role": "user" }
Response: { "success": true, "user": {...} }
```

**PUT /auth/users/:username** (Change password)
```json
Request: { "currentPassword": "old", "password": "new" }
Response: { "success": true }
```

### Workflow Endpoints

**GET /api/workflows**
- Returns all workflows (filtered by user role)

**GET /api/workflows/:id**
- Returns a specific workflow

**POST /api/workflows**
```json
Request: {
  "name": "My Workflow",
  "description": "Description",
  "team": "Engineering",
  "owner": "John Doe",
  "tags": ["process", "automation"],
  "nodes": [...],
  "edges": [...]
}
```

**PUT /api/workflows/:id**
- Update workflow (creates version snapshot)

**DELETE /api/workflows/:id**
- Delete workflow

### Organization Endpoints

**GET /api/teams** - List all teams
**POST /api/teams** - Create team
**PUT /api/teams/:id** - Update team
**DELETE /api/teams/:id** - Delete team

**GET /api/owners** - List all owners
**POST /api/owners** - Create owner
**PUT /api/owners/:id** - Update owner
**DELETE /api/owners/:id** - Delete owner

**GET /api/tags** - List all tags
**POST /api/tags** - Create tag
**PUT /api/tags/:id** - Update tag
**DELETE /api/tags/:id** - Delete tag

### Admin Endpoints (Require Admin Role)

**GET /admin/workflow-versions** - List all workflow versions
**GET /admin/workflow-versions/:versionFile** - Get specific version
**POST /admin/workflow-versions/:versionFile/restore** - Restore version
**POST /admin/backups** - Create data backup
**GET /admin/backups** - List backups
**POST /admin/backups/:filename/restore** - Restore backup

All admin endpoints require `Authorization: Bearer <token>` header.

---

## 🔒 Security

### Best Practices

1. **Change Default Passwords**: Immediately change `admin` and `hbertini` passwords
2. **Secure JWT Secret**: Use a strong, random JWT_SECRET (minimum 32 characters)
3. **HTTPS Only**: Always use HTTPS in production
4. **Regular Backups**: Schedule automated backups (cron job)
5. **Access Control**: Keep `users.json` and `data/` directory secure (not in git)
6. **Update Dependencies**: Regularly run `npm audit` and update packages
7. **Environment Variables**: Never commit secrets to version control
8. **Rate Limiting**: Consider adding rate limiting for API endpoints
9. **CORS Configuration**: Restrict CORS to trusted domains in production

### File Permissions (Linux/macOS)

```bash
# Backend data directory - restrict access
chmod 700 wireflow/backend/data
chmod 600 wireflow/backend/users.json

# Backup directory
chmod 700 wireflow/backend/data/backups
```

### Authentication Flow

1. User sends credentials to `/auth/login`
2. Server validates and returns JWT token
3. Client stores token in localStorage
4. All API requests include `Authorization: Bearer <token>` header
5. Server validates token and checks role permissions
6. Tokens expire after 24 hours (configurable in `auth.js`)

---

## 💾 Backup & Recovery

### Manual Backup

**Using Admin UI:**
1. Login as admin
2. Navigate to Admin → Backups
3. Click "Create Backup"
4. Backup saved to `backend/data/backups/data_backup_YYYYMMDD_HHMMSS.tar.gz`

**Using Command Line:**
```bash
cd wireflow/backend
node -e "require('./admin/workflow_versions.js').createBackup().then(f => console.log('Backup created:', f))"
```

**Using Provided Script:**
```bash
cd wireflow/tools
./backup_data.sh
```

### Automated Backups (Linux/macOS)

Add to crontab:
```bash
crontab -e

# Daily backup at 2 AM
0 2 * * * cd /path/to/wireflow/backend && node -e "require('./admin/workflow_versions').createBackup()"

# Weekly backup every Sunday at 3 AM
0 3 * * 0 cd /path/to/wireflow/backend && node -e "require('./admin/workflow_versions').createBackup()"
```

### Restore from Backup

**Using Admin UI:**
1. Navigate to Admin → Backups
2. Select backup from list
3. Click "Restore"
4. Confirm restoration

**Using Command Line:**
```bash
cd wireflow/backend
node -e "require('./admin/workflow_versions.js').restoreBackup('data_backup_20251004_020000.tar.gz')"
```

### Workflow Version History

- Versions are automatically created when workflows are saved
- View version history in Admin → Versions
- Preview workflows visually before restoring
- Versions are compressed (.json.gz) to save space

---

## 🔧 Troubleshooting

### Backend Won't Start

**Issue**: `Error: Cannot find module ...`
```bash
cd wireflow/backend
npm install
```

**Issue**: `Error: listen EADDRINUSE: address already in use :::5001`
```bash
# Find process using port 5001
# Linux/macOS:
lsof -i :5001
kill -9 <PID>

# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess | Stop-Process -Force
```

**Issue**: `JWT_SECRET not set` warning
- Create `.env` file with `JWT_SECRET=your_secure_secret_here`

### Frontend Build Errors

**Issue**: `Cannot find module 'react-flow-renderer'`
```bash
cd wireflow/frontend
npm install
```

**Issue**: Vite build fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Authentication Issues

**Issue**: "Invalid token" errors
- Token may have expired (24 hour lifetime)
- Logout and login again
- Clear localStorage: `localStorage.clear()`

**Issue**: Can't login as admin
- Check `backend/users.json` exists
- Verify environment variables are set
- Reset users.json by deleting it and restarting server

### Data Issues

**Issue**: Workflows not appearing
- Check `backend/data/wf-*.json.gz` files exist
- Verify user has permission to view workflows
- Check console for API errors

**Issue**: Backup restore failed
- Ensure backup file is valid tar.gz archive
- Check disk space availability
- Review backend logs for errors

### Performance Issues

**Issue**: Slow workflow loading
- Compress old workflows: `gzip backend/data/wf-*.json`
- Archive old backups to external storage
- Consider database migration for large datasets

**Issue**: Editor lag with many nodes
- Reduce node count (split into multiple workflows)
- Disable animations in ReactFlow settings
- Use modern browser (Chrome/Edge recommended)

### Common Errors

**"CORS policy" errors**
- Update CORS configuration in `backend/server.js`
- Check API_BASE in `frontend/src/api.js`

**"Cannot read property 'nodes' of undefined"**
- Workflow data may be corrupted
- Restore from backup or version history

**File permission errors**
- Ensure Node.js process has read/write access to `backend/data/`
- Check file ownership and permissions

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow existing code style** (use ESLint for frontend)
3. **Test your changes** thoroughly
4. **Document new features** in README and code comments
5. **Submit a pull request** with clear description

### Development Setup

```bash
# Install dependencies
cd wireflow/backend && npm install
cd ../frontend && npm install

# Run in development mode
# Terminal 1:
cd wireflow/backend && node server.js

# Terminal 2:
cd wireflow/frontend && npm run dev
```

### Code Style

- **Frontend**: Follow ESLint rules (run `npm run lint`)
- **Backend**: Use consistent formatting with 2-space indentation
- **Comments**: Document complex logic and API endpoints
- **Naming**: Use descriptive variable/function names

---

## 📄 License

This project is proprietary software. All rights reserved.

For licensing inquiries, please contact the project owner.

---

## 📞 Support

For issues, questions, or feature requests:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review existing documentation in `backend/README-auth.md` and `backend/data/README.md`
3. Contact the development team

---

## 🎉 Acknowledgments

Built with:
- [React](https://react.dev/) - UI framework
- [ReactFlow](https://reactflow.dev/) - Visual workflow editor
- [Express](https://expressjs.com/) - Backend framework
- [Vite](https://vitejs.dev/) - Build tool
- [TailwindCSS](https://tailwindcss.com/) - CSS framework

---

**WireFlow** - Visualize, Design, Execute.
