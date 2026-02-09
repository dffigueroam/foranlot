import PricingPage from "@/app/pricing/page"

const MONTHLY_PRICE = 25995;
const YEARLY_PRICE = 195000;
const MONTHS_IN_YEAR = 12;

const yearlyCostMonthly = MONTHLY_PRICE * MONTHS_IN_YEAR;
const moneySaved = yearlyCostMonthly - YEARLY_PRICE;
const monthsSaved = Math.round(moneySaved / MONTHLY_PRICE);

export interface Product {
  id: string
  name: string
  description: string
  price: number
  features: string[]
}

export const MEMBERSHIP_PRODUCTS: Product[] = [
  {
    id: "monthly-premium",
    name: "Membresía Premium Mensual",
    description: "Acceso completo a todos los pronósticos",
    price: MONTHLY_PRICE,
    features: [
      "Acceso a todos los pronósticos",
      "Historial completo de aciertos",
      "Gráficos avanzados",
      "Sin anuncios",
      "Soporte prioritario",
    ],
  },
  {
    id: "yearly-premium",
    name: "Membresía Premium Anual",
    description: "Ahorra pagando anual",
    price: YEARLY_PRICE,
    features: [
      "Acceso a todos los pronósticos",
      "Historial completo de aciertos",
      "Gráficos avanzados",
      "Sin anuncios",
      "Soporte prioritario",
      `Ahorra ${monthsSaved} meses (${moneySaved.toLocaleString("es-CO")} COP) vs mensual`,
    ],
  },
];

