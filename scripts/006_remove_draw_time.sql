-- Simplemente agregar la constraint UNIQUE si no existe
-- PostgreSQL ignorará si ya existe
ALTER TABLE IF EXISTS lottery_results 
ADD CONSTRAINT lottery_results_unique_key UNIQUE (lottery_type, draw_date) 
ON CONFLICT DO NOTHING;
