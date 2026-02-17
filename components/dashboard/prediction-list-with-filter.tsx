"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { PredictionList } from "@/components/predictions/prediction-list"

export function PredictionListWithFilter({
  initialPredictions,
  isPremium,
  fetchVerifiedCorrectPredictions
}: {
  initialPredictions: any[]
  isPremium: boolean
  fetchVerifiedCorrectPredictions: () => Promise<any[]>
}) {
  const [showHits, setShowHits] = useState(false)
  const [predictions, setPredictions] = useState(initialPredictions)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    if (!showHits) {
      startTransition(async () => {
        const hits = await fetchVerifiedCorrectPredictions()
        setPredictions(hits)
        setShowHits(true)
      })
    } else {
      setPredictions(initialPredictions)
      setShowHits(false)
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={handleToggle}
        className="mb-2"
        disabled={isPending}
      >
        {showHits ? "Ver todos" : "Ver solo aciertos"}
      </Button>
      <PredictionList predictions={predictions} isPremium={isPremium} />
    </div>
  )
}
