"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface LotteryResult {
  id: number
  lottery_name: string
  lottery_type: string
  winning_number: string
  draw_date: string
  draw_time: string
  verified_at: string
}

interface ResultsTableProps {
  results: LotteryResult[]
}

export function ResultsTable({ results }: ResultsTableProps) {
  const getLotteryTypeLabel = (type: string) => `${type.replace("_digits", " Cifras")}`

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay resultados oficiales disponibles</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados Oficiales</CardTitle>
        <CardDescription>Números ganadores verificados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Lotería</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Número Ganador</TableHead>
                <TableHead>Verificado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{format(new Date(result.draw_date), "dd MMM yyyy", { locale: es })}</TableCell>
                  <TableCell className="font-medium">{result.lottery_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getLotteryTypeLabel(result.lottery_type)}</Badge>
                  </TableCell>
                  <TableCell className="font-bold text-lg text-primary">{result.winning_number}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(result.verified_at), "dd/MM/yyyy HH:mm", { locale: es })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
