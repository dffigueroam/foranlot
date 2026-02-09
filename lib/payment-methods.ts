export interface PaymentMethod {
  id: string
  name: string
  account: string
  type: string
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "bancolombia",
    name: "Bancolombia",
    account: "3062-5176901",
    type: "Ahorro",
  },
  {
    id: "NU",
    name: "NU",
    account: "94329938",
    type: "Llaves",
  },
  {
    id: "nequi",
    name: "Nequi",
    account: "3137184290",
    type: "Ahorro",
  },
]
