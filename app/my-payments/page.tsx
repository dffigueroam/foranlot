import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getUserPaymentRequests } from "@/lib/manual-payments"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Clock, CheckCircle, XCircle, FileText } from "lucide-react"
import { PageWrapper } from "@/components/layout/page-wrapper"

export default async function MyPaymentsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const payments = await getUserPaymentRequests(user.id)

  return (
    <PageWrapper user={{ username: user.username, role: user.role }}>
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mis Solicitudes de Pago</h1>
          <p className="text-muted-foreground">Historial de tus pagos por transferencia</p>
        </div>

        {payments.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-1">No tienes solicitudes</h3>
            <p className="text-sm text-muted-foreground mb-4">Aún no has enviado ninguna solicitud de pago manual</p>
            <Button asChild>
              <Link href="/pricing">Ir a Planes</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {payments.map((payment) => {
              const statusConfig = {
                pending: {
                  icon: Clock,
                  color: "bg-yellow-100 text-yellow-800 border-yellow-200",
                  label: "Pendiente",
                },
                approved: {
                  icon: CheckCircle,
                  color: "bg-green-100 text-green-800 border-green-200",
                  label: "Aprobado",
                },
                rejected: {
                  icon: XCircle,
                  color: "bg-red-100 text-red-800 border-red-200",
                  label: "Rechazado",
                },
              }

              const status = statusConfig[payment.status as keyof typeof statusConfig]
              const StatusIcon = status.icon

              return (
                <Card key={payment.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          Plan {payment.plan_type === "monthly" ? "Mensual" : "Anual"}
                        </h3>
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Solicitado: {new Date(payment.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${(payment.amount_cents / 100).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{payment.credits_to_add} créditos</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    {payment.reference_number && (
                      <div>
                        <p className="text-muted-foreground">Referencia</p>
                        <p className="font-medium">{payment.reference_number}</p>
                      </div>
                    )}
                    {payment.bank_name && (
                      <div>
                        <p className="text-muted-foreground">Banco</p>
                        <p className="font-medium">{payment.bank_name}</p>
                      </div>
                    )}
                    {payment.payment_date && (
                      <div>
                        <p className="text-muted-foreground">Fecha de pago</p>
                        <p className="font-medium">{new Date(payment.payment_date).toLocaleDateString("es-ES")}</p>
                      </div>
                    )}
                  </div>

                  {payment.notes && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Notas:</p>
                      <p className="text-sm">{payment.notes}</p>
                    </div>
                  )}

                  {payment.status === "rejected" && payment.rejection_reason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-medium mb-1">Razón del rechazo:</p>
                      <p className="text-sm text-red-700">{payment.rejection_reason}</p>
                    </div>
                  )}

                  {payment.status === "approved" && payment.reviewed_at && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✓ Aprobado el {new Date(payment.reviewed_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
