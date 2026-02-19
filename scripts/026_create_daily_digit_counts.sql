-- scripts/026_create_daily_digit_counts.sql
-- Tabla para conteos diarios de dígitos por posición y lotería

CREATE TABLE IF NOT EXISTS daily_digit_counts (
  id SERIAL PRIMARY KEY,
  draw_date DATE NOT NULL,
  lottery_name VARCHAR(50) NOT NULL,
  position INT NOT NULL, -- 0=unidad, 1=decena, etc.
  digit INT NOT NULL,
  count INT NOT NULL DEFAULT 1,
  UNIQUE(draw_date, lottery_name, position, digit)
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_ddc_draw_date ON daily_digit_counts(draw_date);
CREATE INDEX IF NOT EXISTS idx_ddc_lottery_name ON daily_digit_counts(lottery_name);
CREATE INDEX IF NOT EXISTS idx_ddc_position ON daily_digit_counts(position);

-- Función para actualizar la tabla al cargar resultados oficiales
drop function if exists update_daily_digit_counts cascade;
create or replace function update_daily_digit_counts(p_draw_date date, p_lottery_name varchar, p_result varchar) returns void as $$
begin
  -- p_result: número ganador como string (ej: '1234')
  for i in 1..char_length(p_result) loop
    insert into daily_digit_counts(draw_date, lottery_name, position, digit, count)
    values (
      p_draw_date,
      p_lottery_name,
      i-1, -- posición (0=unidad)
      cast(substring(p_result, i, 1) as int),
      1
    )
    on conflict (draw_date, lottery_name, position, digit)
    do update set count = daily_digit_counts.count + 1;
  end loop;
end;
$$ language plpgsql;

-- Ejemplo de uso tras cargar resultado oficial:
-- select update_daily_digit_counts('2026-02-18', 'Lotería de Bogotá', '1234');

-- Limpieza de históricos viejos (opcional, por espacio)
delete from daily_digit_counts where draw_date < (current_date - interval '180 days');
