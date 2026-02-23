import { getPaymentMethods } from "@/lib/payment-methods"
import { ManualPaymentForm } from "@/components/payments/manual-payment-form"

export default async function LotiqLitePaymentPage() {
  const paymentMethods = getPaymentMethods()
  return (
    <div className="max-w-xl mx-auto mt-10">
      <ManualPaymentForm paymentMethods={paymentMethods} />
    </div>
  )
}
