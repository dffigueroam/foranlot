export const PYG_CONFIG = {
  baseInvestment: 100,
  exactHitWonValues: {
    "3_digits": 38000,
    "4_digits": 315000,
  },
  combinedWonValues: {
    "3_digits": 5810,
    "4_digits": 14560,
  },
  lastTwoDigitsWonValue: 500,
} as const

export const LOTTERY_PAYOUT_CONFIG = {
  direct: {
    "3_digits": 400,
    "4_digits": 4500,
  },
  combined: {
    "3_digits": 83,
    "4_digits": 208,
  },
  lastTwoDigits: 50,
} as const

export const OCCASIONAL_WITHHOLDING_PERCENTAGE = 30