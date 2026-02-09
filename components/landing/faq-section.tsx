import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"

const FAQS = [
  {
    question: "¿Cómo funciona Lotiq?",
    answer:
      "Puedes predecir números de loterías, compartir tus predicciones con la comunidad y ganar dinero cuando tus predicciones son acertadas. También puedes seguir a otros pronosticadores y contratar sus predicciones si eres miembro premium.",
  },
  {
    question: "¿Cómo puedo ganar dinero en Lotiq?",
    answer:
      "Ganas dinero de dos formas: 1) Teniendo predicciones acertadas: recibes compensación basada en tu aporte económico, recurrencia y consistencia. 2) Siendo seguido: otros usuarios pagan por seguir tus predicciones.",
  },
  {
    question: "¿Qué es una membresía premium?",
    answer:
      "Con la membresía premium obtienes créditos para seguir predicciones de otros usuarios y acceder a su información detallada. Puedes elegir plan mensual (30 créditos) o anual (365 créditos).",
  },
  {
    question: "¿Cuál es la diferencia entre membresía mensual y anual?",
    answer:
      "Plan Mensual: $9.99/mes = 30 créditos. Plan Anual: $99.99/año = 365 créditos. El plan anual te da mejor precio por crédito. Los créditos se deducen diariamente mientras sigas usuarios.",
  },
  {
    question: "¿Cómo reporto un pago manual?",
    answer:
      "Si realizas una transferencia bancaria directa, ingresa a tu perfil > Mis Pagos > Reportar Pago. Selecciona el método (BRE-B, Bancolombia o Giro), ingresa el comprobante y la fecha. Nuestro equipo verifica el pago en 24 horas.",
  },
  {
    question: "¿Cuáles son los métodos de pago disponibles?",
    answer:
      "Aceptamos: 1) BRE-B, 2) Transferencia Bancolombia a cuenta de ahorros, 3) Giros directos. También aceptamos pagos vía Stripe si usas tarjeta de crédito internacional.",
  },
  {
    question: "¿Cómo funcionan los avatares?",
    answer:
      "Puedes elegir un avatar de nuestras 8 opciones sugeridas o subir tu propio avatar en formato SVG (máximo 50KB). El avatar aparece en tu perfil y ranking.",
  },
  {
    question: "¿Qué es un usuario sintético?",
    answer:
      "Son perfiles especializados creados por el sistema para analizar patrones por día o lotería. Se usan como referencia informativa dentro de la plataforma.",
  },
  {
    question: "¿Cómo se calcula mi posición en el ranking?",
    answer:
      "Tu posición se calcula con tres factores: 1) Aporte económico (50%), 2) Recurrencia de números acertados (30%), 3) Consistencia histórica (20%). El ranking se actualiza automáticamente.",
  },
  {
    question: "¿Puedo cambiar mi contraseña?",
    answer:
      "Sí, en tu perfil > Configuración > Cambiar Contraseña. Si olvidas tu contraseña, usa la opción ¿Olvidaste tu contraseña? en login.",
  },
  {
    question: "¿Es seguro mis datos personales?",
    answer:
      "Sí. Usamos encriptación HTTPS, validación de entrada para prevenir inyección SQL, y rate limiting para prevenir ataques. Nunca vendemos tus datos a terceros.",
  },
  {
    question: "¿Puedo contactar al soporte?",
    answer:
      "Claro, usa el formulario en la sección Contacto o envía un email a soporte@lotiq.com. Responderemos en máximo 24 horas.",
  },
]

export function FAQSection() {
  return (
    <section className="py-24 bg-linear-to-b from-white via-blue-50/30 dark:from-gray-950 dark:via-blue-900/10 to-white dark:to-gray-950">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Mejorado */}
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-blue-400/50 dark:border-blue-500/50">
              <span className="text-blue-700 dark:text-blue-300 font-semibold text-sm">❓ RESUELVE TUS DUDAS</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 text-gray-900 dark:text-white">
              Preguntas Frecuentes
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Todo lo que necesitas saber sobre Lotiq en un solo lugar
            </p>
          </div>

          {/* FAQ Accordion con mejor styling */}
          <Card className="border-0 shadow-none bg-transparent">
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className={`border rounded-xl px-6 py-4 backdrop-blur transition-all duration-300 ${
                    index % 4 === 0
                      ? "bg-linear-to-r from-green-50 to-cyan-50 dark:from-green-900/20 dark:to-cyan-900/20 border-green-300 dark:border-green-700"
                      : index % 4 === 1
                      ? "bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-300 dark:border-blue-700"
                      : index % 4 === 2
                      ? "bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300 dark:border-purple-700"
                      : "bg-linear-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700"
                  } hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-purple-500/20`}
                  suppressHydrationWarning
                >
                  <AccordionTrigger className="hover:no-underline py-2 text-left font-bold text-gray-900 dark:text-white text-lg">
                    <span className="flex items-start gap-3">
                      <span className="mt-0.5">
                        {index % 4 === 0 ? "💚" : index % 4 === 1 ? "💙" : index % 4 === 2 ? "💜" : "💛"}
                      </span>
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700 dark:text-gray-300 pb-3 pt-2 text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>

          {/* CTA Footer */}
          <div className="mt-16 p-8 bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl border border-indigo-300 dark:border-indigo-700 text-center">
            <p className="text-gray-700 dark:text-gray-300 mb-4 font-medium">
              ¿No encontraste lo que buscabas?
            </p>
            <a
              href="mailto:soporte@lotiq.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all hover:shadow-lg"
            >
              <span>📧</span>
              Contacta con nuestro equipo
              <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
