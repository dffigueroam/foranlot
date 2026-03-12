"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { PredictionList } from "@/components/predictions/prediction-list"
import type { Prediction } from "@/lib/predictions"

export function PredictionListWithFilter({
  initialPredictions,
  isPremium,
  fetchVerifiedCorrectPredictions
}: {
  initialPredictions: Prediction[]
  isPremium: boolean
  fetchVerifiedCorrectPredictions: () => Promise<Prediction[]>
}) {
  const [showHits, setShowHits] = useState(false)
  const [predictions, setPredictions] = useState(initialPredictions)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setPredictions(initialPredictions)
    setShowHits(false)
  }, [initialPredictions])

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
