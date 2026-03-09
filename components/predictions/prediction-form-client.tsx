"use client"

import { PredictionForm } from "./prediction-form"

export default function PredictionFormClient({ preferredCountry = "" }: { preferredCountry?: string }) {
  return <PredictionForm preferredCountry={preferredCountry} />
}
