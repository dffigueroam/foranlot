-- Crear tabla de auditoría para sincronización de resultados
CREATE TABLE IF NOT EXISTS lottery_sync_audit (
  id SERIAL PRIMARY KEY,
  source VARCHAR(100) NOT NULL, -- 'dropbox_manual', 'dropbox_cron', 'csv_upload'
  file_path TEXT,
  status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'partial'
  rows_processed INTEGER DEFAULT 0,
  error_message TEXT,
  synced_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_sync_audit_source ON lottery_sync_audit(source);
CREATE INDEX IF NOT EXISTS idx_sync_audit_date ON lottery_sync_audit(synced_at DESC);

-- Comentarios
COMMENT ON TABLE lottery_sync_audit IS 'Registro de auditoría de todas las sincronizaciones de resultados de lotería';
COMMENT ON COLUMN lottery_sync_audit.source IS 'Origen de la sincronización: dropbox_manual, dropbox_cron, csv_upload';
COMMENT ON COLUMN lottery_sync_audit.status IS 'Estado de la sincronización: success, failed, partial';
