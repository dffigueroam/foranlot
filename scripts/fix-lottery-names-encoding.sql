-- Script para corregir nombres de loterías con encoding corrupto
-- Ejecutar este script después de actualizar el código de carga

-- Corregir Antioqueñita
UPDATE lottery_results
SET lottery_name = 'Antioqueñita Dia'
WHERE lottery_name LIKE 'Antioque%ita Dia' OR lottery_name = 'Antioque�ita Dia';

UPDATE lottery_results
SET lottery_name = 'Antioqueñita Tarde'
WHERE lottery_name LIKE 'Antioque%ita Tarde' OR lottery_name = 'Antioque�ita Tarde';

UPDATE predictions
SET lottery_name = 'Antioqueñita Dia'
WHERE lottery_name LIKE 'Antioque%ita Dia' OR lottery_name = 'Antioque�ita Dia';

UPDATE predictions
SET lottery_name = 'Antioqueñita Tarde'
WHERE lottery_name LIKE 'Antioque%ita Tarde' OR lottery_name = 'Antioque�ita Tarde';

-- Corregir Caribeña
UPDATE lottery_results
SET lottery_name = 'Caribeña Dia'
WHERE lottery_name LIKE 'Caribe%a Dia' OR lottery_name = 'Caribe�a dia';

UPDATE lottery_results
SET lottery_name = 'Caribeña Noche'
WHERE lottery_name LIKE 'Caribe%a Noche' OR lottery_name = 'Caribe�a noche';

UPDATE predictions
SET lottery_name = 'Caribeña Dia'
WHERE lottery_name LIKE 'Caribe%a Dia' OR lottery_name = 'Caribe�a dia';

UPDATE predictions
SET lottery_name = 'Caribeña Noche'
WHERE lottery_name LIKE 'Caribe%a Noche' OR lottery_name = 'Caribe�a noche';

-- Corregir Dorado Mañana
UPDATE lottery_results
SET lottery_name = 'Dorado Mañana'
WHERE lottery_name LIKE 'Dorado ma%ana' OR lottery_name = 'Dorado mañana';

UPDATE predictions
SET lottery_name = 'Dorado Mañana'
WHERE lottery_name LIKE 'Dorado ma%ana' OR lottery_name = 'Dorado mañana';

-- Corregir Fantástica
UPDATE lottery_results
SET lottery_name = 'Fantastica Dia'
WHERE lottery_name LIKE 'Fant%stica%' AND lottery_name LIKE '%dia';

UPDATE lottery_results
SET lottery_name = 'Fantastica Noche'
WHERE lottery_name LIKE 'Fant%stica%' AND lottery_name LIKE '%noche';

UPDATE predictions
SET lottery_name = 'Fantastica Dia'
WHERE lottery_name LIKE 'Fant%stica%' AND lottery_name LIKE '%dia';

UPDATE predictions
SET lottery_name = 'Fantastica Noche'
WHERE lottery_name LIKE 'Fant%stica%' AND lottery_name LIKE '%noche';

-- Normalizar capitalización (todos deben usar Title Case)
UPDATE lottery_results
SET lottery_name = 
  CASE 
    WHEN LOWER(lottery_name) = 'astro sol' THEN 'Astro Sol'
    WHEN LOWER(lottery_name) = 'cafeterito noche' THEN 'Cafeterito Noche'
    WHEN LOWER(lottery_name) = 'cafeterito tarde' THEN 'Cafeterito Tarde'
    WHEN LOWER(lottery_name) = 'caribeña dia' THEN 'Caribeña Dia'
    WHEN LOWER(lottery_name) = 'caribeña noche' THEN 'Caribeña Noche'
    WHEN LOWER(lottery_name) = 'cash three dia' THEN 'Cash Three Dia'
    WHEN LOWER(lottery_name) = 'chontico dia' THEN 'Chontico Dia'
    WHEN LOWER(lottery_name) = 'chontico noche' THEN 'Chontico Noche'
    WHEN LOWER(lottery_name) = 'culona noche' THEN 'Culona Noche'
    WHEN LOWER(lottery_name) = 'fantastica dia' THEN 'Fantastica Dia'
    WHEN LOWER(lottery_name) = 'motilon tarde' THEN 'Motilon Tarde'
    WHEN LOWER(lottery_name) = 'paisita dia' THEN 'Paisita Dia'
    WHEN LOWER(lottery_name) = 'paisita noche' THEN 'Paisita Noche'
    WHEN LOWER(lottery_name) = 'pijao de oro' THEN 'Pijao de Oro'
    WHEN LOWER(lottery_name) = 'play four dia' THEN 'Play Four Dia'
    WHEN LOWER(lottery_name) = 'saman dia' THEN 'Saman Dia'
    WHEN LOWER(lottery_name) = 'sinuano dia' THEN 'Sinuano Dia'
    WHEN LOWER(lottery_name) = 'sinuano noche' THEN 'Sinuano Noche'
    ELSE lottery_name
  END
WHERE LOWER(lottery_name) IN (
  'astro sol', 'cafeterito noche', 'cafeterito tarde', 'caribeña dia',
  'caribeña noche', 'cash three dia', 'chontico dia', 'chontico noche',
  'culona noche', 'fantastica dia', 'motilon tarde', 'paisita dia',
  'paisita noche', 'pijao de oro', 'play four dia', 'saman dia',
  'sinuano dia', 'sinuano noche'
);

UPDATE predictions
SET lottery_name = 
  CASE 
    WHEN LOWER(lottery_name) = 'astro sol' THEN 'Astro Sol'
    WHEN LOWER(lottery_name) = 'cafeterito noche' THEN 'Cafeterito Noche'
    WHEN LOWER(lottery_name) = 'cafeterito tarde' THEN 'Cafeterito Tarde'
    WHEN LOWER(lottery_name) = 'caribeña dia' THEN 'Caribeña Dia'
    WHEN LOWER(lottery_name) = 'caribeña noche' THEN 'Caribeña Noche'
    WHEN LOWER(lottery_name) = 'cash three dia' THEN 'Cash Three Dia'
    WHEN LOWER(lottery_name) = 'chontico dia' THEN 'Chontico Dia'
    WHEN LOWER(lottery_name) = 'chontico noche' THEN 'Chontico Noche'
    WHEN LOWER(lottery_name) = 'culona noche' THEN 'Culona Noche'
    WHEN LOWER(lottery_name) = 'fantastica dia' THEN 'Fantastica Dia'
    WHEN LOWER(lottery_name) = 'motilon tarde' THEN 'Motilon Tarde'
    WHEN LOWER(lottery_name) = 'paisita dia' THEN 'Paisita Dia'
    WHEN LOWER(lottery_name) = 'paisita noche' THEN 'Paisita Noche'
    WHEN LOWER(lottery_name) = 'pijao de oro' THEN 'Pijao de Oro'
    WHEN LOWER(lottery_name) = 'play four dia' THEN 'Play Four Dia'
    WHEN LOWER(lottery_name) = 'saman dia' THEN 'Saman Dia'
    WHEN LOWER(lottery_name) = 'sinuano dia' THEN 'Sinuano Dia'
    WHEN LOWER(lottery_name) = 'sinuano noche' THEN 'Sinuano Noche'
    ELSE lottery_name
  END
WHERE LOWER(lottery_name) IN (
  'astro sol', 'cafeterito noche', 'cafeterito tarde', 'caribeña dia',
  'caribeña noche', 'cash three dia', 'chontico dia', 'chontico noche',
  'culona noche', 'fantastica dia', 'motilon tarde', 'paisita dia',
  'paisita noche', 'pijao de oro', 'play four dia', 'saman dia',
  'sinuano dia', 'sinuano noche'
);

-- Verificar los cambios
SELECT 'lottery_results' as tabla, lottery_name, COUNT(*) as cantidad
FROM lottery_results
GROUP BY lottery_name
ORDER BY lottery_name;

SELECT 'predictions' as tabla, lottery_name, COUNT(*) as cantidad
FROM predictions
GROUP BY lottery_name
ORDER BY lottery_name;
