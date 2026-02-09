export const LOTTERIES = [
  // Colombia - 4 y 5ta cifras
  { name: "Cundinamarca", country: "Colombia", dias: "lunes", digits: [3, 4, 5] },
  { name: "Huila", country: "Colombia", dias: "martes", digits: [3, 4, 5] },
  { name: "Valle", country: "Colombia", dias: "miercoles", digits: [4, 5] },
  { name: "Meta", country: "Colombia", dias: "jueves", digits: [3, 4, 5] },
  { name: "Manizales", country: "Colombia", dias: "miercoles", digits: [3, 4, 5] },
  { name: "Bogota", country: "Colombia", dias: "jueves", digits: [3, 4, 5] },
  { name: "Risaralda", country: "Colombia", dias: "viernes", digits: [3, 4, 5] },
  { name: "Medellin", country: "Colombia", dias: "viernes", digits: [3, 4, 5] },
  { name: "Cauca", country: "Colombia", dias: "sabado", digits: [3, 4, 5] },
  { name: "Tolima", country: "Colombia", dias: "lunes", digits: [3, 4, 5] },
  { name: "Dorado Tarde", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Dorado Mañana", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Cafeterito Tarde", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Chontico Dia", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Cafeterito Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Paisita Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Paisita Dia", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Cruz Roja", country: "Colombia", dias: "martes", digits: [3, 4, 5] },
  { name: "Quindio", country: "Colombia", dias: "jueves", digits: [3, 4, 5] },
  { name: "Santander", country: "Colombia", dias: "jueves", digits: [3, 4, 5] },
  { name: "Boyaca", country: "Colombia", dias: "sabado", digits: [3, 4, 5] },
  { name: "Sinuano Dia", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Saman Dia", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Caribeña Dia", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Dorado Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Sinuano Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Culona", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Pijao de Oro", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Motilon Tarde", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Motilon Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Fantastica Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Fantastica Dia", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Chontico Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Caribeña Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Antioqueñita Tarde", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Antioqueñita Dia", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },
  { name: "Paisita 3", country: "Colombia", dias: "sabado", digits: [3, 4, 5] },
  { name: "Culona Noche", country: "Colombia", dias: "todos_dias", digits: [3, 4, 5] },

  // Colombia - 4 y Signo
  { name: "Astro Luna", country: "Colombia", dias: "todos_dias", digits: [3, 4] },
  { name: "Astro Sol", country: "Colombia", dias: "todos_dias", digits: [3, 4] },

  // España - 3 cifras
  { name: "TriplexOnce1", country: "España", dias: "todos_dias", digits: [3] },
  { name: "TriplexOnce2", country: "España", dias: "todos_dias", digits: [3] },
  { name: "TriplexOnce3", country: "España", dias: "todos_dias", digits: [3] },
  { name: "TriplexOnce4", country: "España", dias: "todos_dias", digits: [3] },
  { name: "TriplexOnce5", country: "España", dias: "todos_dias", digits: [3] },

  // USA y Colombia
  { name: "Play Four Noche", country: "USA y Colombia", dias: "todos_dias", digits: [3, 4] },
  { name: "Play Four Dia", country: "USA y Colombia", dias: "todos_dias", digits: [3, 4] },
  { name: "Cash Three Dia", country: "USA y Colombia", dias: "todos_dias", digits: [3] },
  { name: "Cash Three Noche", country: "USA y Colombia", dias: "todos_dias", digits: [3] },

  // USA
  { name: "Number 3", country: "USA", dias: "todos_dias", digits: [3] },
  { name: "Number 4", country: "USA", dias: "todos_dias", digits: [3, 4] },
]

export type Lottery = typeof LOTTERIES[number]
