# Tools Folder Guide

This folder contains utility scripts and configuration files for managing and backing up your WireFlow application data.

---

## Files

### 1. `backup_data.sh`
- **Purpose:**
  - Creates a compressed archive (`.tar.gz`) of the backend data directory (`wireflow/backend/data`).
  - Each backup is timestamped and stored in `/home/hbertini/backups/wireflow`.
- **Usage:**
  - Run manually: `bash backup_data.sh`
  - Used by the scheduled cron job for unattended backups.

### 2. `cron.txt`
- **Purpose:**
  - Contains a sample cron job configuration to automate daily backups.
- **Usage:**
  - To install the cron job, run: `crontab cron.txt`
  - This will schedule `backup_data.sh` to run every day at 2:00 AM.

---

## How to Use
1. **Make the script executable:**
   ```bash
   chmod +x backup_data.sh
   ```
2. **Test the script manually:**
   ```bash
   ./backup_data.sh
   ```
3. **Install the cron job:**
   ```bash
   crontab cron.txt
   ```

Backups will be created automatically in the specified backup directory.

---

## Service Files Usage (Systemd)

If you have `.service` files (e.g., `wireflow-frontend.service`, `wireflow-backend.service`) for running WireFlow as a system service, follow these steps:

### 1. Copy the Service File
Copy the service file to the systemd directory:
```bash
sudo cp /home/hbertini/processmgr/wireflow-frontend.service /etc/systemd/system/
sudo cp /home/hbertini/processmgr/wireflow-backend.service /etc/systemd/system/
```

### 2. Reload Systemd
```bash
sudo systemctl daemon-reload
```

### 3. Enable the Service (Start on Boot)
```bash
sudo systemctl enable wireflow-frontend
sudo systemctl enable wireflow-backend
```

### 4. Start or Restart the Service
```bash
sudo systemctl start wireflow-frontend
sudo systemctl start wireflow-backend
# To restart:
sudo systemctl restart wireflow-frontend
sudo systemctl restart wireflow-backend
```

### 5. Check Service Status
```bash
sudo systemctl status wireflow-frontend
sudo systemctl status wireflow-backend
```

**Note:**
- You need root or sudo privileges to manage system services.
- Adjust file paths if your `.service` files are located elsewhere.
