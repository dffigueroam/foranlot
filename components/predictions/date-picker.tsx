"use client"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  disabled?: boolean
  minDate?: Date
}

export function DatePicker({ value, onChange, disabled = false, minDate }: DatePickerProps) {
  const selected = value ? new Date(value + "T00:00:00") : undefined
  const today = minDate || new Date()

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const isoDate = date.toISOString().split("T")[0]
      onChange(isoDate)
    }
  }

  const displayText = selected
    ? format(selected, "dd 'de' MMMM 'de' yyyy", { locale: es })
    : "Selecciona fecha"

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={(date) => date < today}
          initialFocus
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  )
}
