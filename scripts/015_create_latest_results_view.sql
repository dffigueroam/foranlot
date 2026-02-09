-- Vista para obtener el último resultado de cada lotería
-- Independientemente de la fecha, muestra el resultado más reciente disponible

CREATE OR REPLACE VIEW latest_lottery_results AS
WITH ranked_results AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY lottery_name
            ORDER BY draw_date DESC
        ) AS rn
    FROM lottery_results
)
SELECT *
FROM ranked_results
WHERE rn = 1
ORDER BY lottery_name ASC;

-- Ejemplo de uso:
-- SELECT * FROM latest_lottery_results;
