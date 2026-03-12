import { Mail, MapPin, Phone, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function ContactSection() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "soporte@lot-iq.com"

  return (
    <section className="py-24 bg-linear-to-b from-white via-green-50/30 dark:from-gray-950 dark:via-green-900/10 to-white dark:to-gray-950">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header Mejorado */}
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-400/50 dark:border-green-500/50">
              <span className="text-green-700 dark:text-green-300 font-semibold text-sm">📞 CONTACTO DIRECTO</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 text-gray-900 dark:text-white">
              Ponte en Contacto
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              ¿Preguntas? Estamos aquí para ayudarte
            </p>
          </div>

          {/* Contact Methods Grid - Mejorado */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {/* Email */}
            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-br from-green-400 to-cyan-400 rounded-2xl opacity-0 group-hover:opacity-20 dark:opacity-0 dark:group-hover:opacity-30 transition-opacity duration-300 blur-xl"></div>
              <Card className="border-0 relative h-full bg-linear-to-br from-white to-green-50 dark:from-gray-800/50 dark:to-green-900/20 dark:backdrop-blur dark:border dark:border-green-700/50 hover:shadow-lg dark:hover:shadow-green-500/20 transition-all">
                <CardHeader className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-green-500 to-cyan-500 flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-gray-900 dark:text-white">Email</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-green-600 dark:text-green-400 hover:underline font-semibold transition-colors"
                  >
                    {contactEmail}
                  </a>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    ⏱️ Respuesta según disponibilidad del equipo
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Ubicación */}
            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-br from-blue-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-20 dark:opacity-0 dark:group-hover:opacity-30 transition-opacity duration-300 blur-xl"></div>
              <Card className="border-0 relative h-full bg-linear-to-br from-white to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 dark:backdrop-blur dark:border dark:border-blue-700/50 hover:shadow-lg dark:hover:shadow-blue-500/20 transition-all">
                <CardHeader className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-gray-900 dark:text-white">Ubicación</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                  <p className="text-gray-700 dark:text-gray-300 font-semibold">🇨🇴 Colombia</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Comunidad Latinoamericana
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Soporte */}
            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-br from-purple-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-20 dark:opacity-0 dark:group-hover:opacity-30 transition-opacity duration-300 blur-xl"></div>
              <Card className="border-0 relative h-full bg-linear-to-br from-white to-purple-50 dark:from-gray-800/50 dark:to-purple-900/20 dark:backdrop-blur dark:border dark:border-purple-700/50 hover:shadow-lg dark:hover:shadow-purple-500/20 transition-all">
                <CardHeader className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-3">
                    <Phone className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-gray-900 dark:text-white">Soporte</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                  <p className="text-gray-700 dark:text-gray-300 font-semibold">🕐 Atención continua</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Vía email y chat
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Form Section */}
          <div className="max-w-2xl mx-auto relative">
            <div className="absolute -inset-4 bg-linear-to-r from-cyan-400/20 to-pink-400/20 dark:from-cyan-900/30 dark:to-pink-900/30 rounded-3xl blur-xl -z-10"></div>
            
            <Card className="border-0 bg-white dark:bg-gray-800/60 dark:backdrop-blur dark:border dark:border-cyan-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Envíanos un Mensaje</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Completa el formulario y nos pondremos en contacto lo antes posible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Tu Nombre</label>
                      <Input placeholder="Juan García" className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Tu Email</label>
                      <Input type="email" placeholder="juan@email.com" className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Asunto</label>
                    <Input placeholder="Ej: Pregunta sobre membresía premium" className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Mensaje</label>
                    <Textarea
                      placeholder="Cuéntanos cómo podemos ayudarte..."
                      rows={5}
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>

                  <Button className="w-full bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold shadow-lg hover:shadow-xl transition-all py-3 text-base">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Mensaje
                  </Button>

                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
                    ✓ No compartimos tu información. El tiempo de respuesta puede variar.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
