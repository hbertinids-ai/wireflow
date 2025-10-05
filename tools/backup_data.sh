#!/bin/bash
# filepath: /home/hbertini/processmgr/tools/backup_data.sh

BACKUP_DIR="../../../wireflow/backend/data/backups"
SOURCE_DIR="../../../wireflow/backend/data"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_NAME="data_backup_$TIMESTAMP.tar.gz"

mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/$ARCHIVE_NAME" -C "$SOURCE_DIR" .
