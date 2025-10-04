# Data Directory

This directory contains all runtime data for the WireFlow application. **All files in this directory are excluded from version control** to protect sensitive information and prevent repository bloat.

## Structure

```
data/
├── backups/           # Automated backup archives (.tar.gz)
│   └── versions/      # Workflow version history
├── wf-*.json          # Workflow definition files
├── owners.json        # Workflow owner information
├── tags.json          # Tag definitions for categorization
└── teams.json         # Team definitions and memberships
```

## Files Created at Runtime

### Workflow Files
- **Format**: `wf-{timestamp}.json`
- **Content**: Complete workflow definitions including nodes, edges, metadata
- **Created**: When users save new workflows via the editor

### Configuration Files
- **owners.json**: Maps workflows to their creators/owners
- **tags.json**: Available tags for categorizing workflows
- **teams.json**: Team structures and membership

### Backups
- **Location**: `backups/data_backup_YYYYMMDD_HHMMSS.tar.gz`
- **Content**: Complete snapshot of all data files at time of backup
- **Created**: Via Admin Backup API endpoint (`/admin/backup`)
- **Versions**: Workflow version history stored in `backups/versions/`

## Initial Setup

On first run, the application will create this directory structure automatically. Default files will be generated as needed.

### Required Files (created by backend if missing)
- `owners.json` - Will be initialized as empty array `[]`
- `tags.json` - Will be initialized as empty array `[]`
- `teams.json` - Will be initialized as empty array `[]`

## Security Notes

⚠️ **Important**: This directory is excluded from git for security reasons:
- Contains workflow data that may include sensitive business logic
- Backup files can be large and unsuitable for version control
- User and authentication data should not be committed

## Backup and Restore

### Creating a Backup
Backups are created via the admin interface or API:
```bash
POST /admin/backup
Authorization: Bearer {admin-token}
```

### Restoring from Backup
1. Stop the backend server
2. Extract the backup archive:
   ```bash
   cd wireflow/backend/data
   tar -xzf backups/data_backup_YYYYMMDD_HHMMSS.tar.gz
   ```
3. Restart the backend server

## Development vs Production

- **Development**: Data persists locally in this directory
- **Production**: Consider using external storage (S3, database) or ensure proper backup procedures
- **Migration**: Use the backup/restore mechanism to transfer data between environments
