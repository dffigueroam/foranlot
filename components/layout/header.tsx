"use client"

import Link from "next/link"
import { Crown, Home, Wrench, User, LogOut, Star, BarChart2, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { logoutAction } from "@/app/actions/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/notifications/notification-bell"

interface HeaderProps {
  user: {
    username: string
    role: string
    is_premium?: boolean
  } | null
}

export function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80" suppressHydrationWarning>
      {/* CONTENEDOR PRINCIPAL - Distribución mejorada */}
      <div className="container mx-auto px-4 py-3 sm:py-4" suppressHydrationWarning>
        <div className="flex min-h-14 items-center justify-between gap-2 sm:gap-4">
          
          {/* IZQUIERDA – LOGO */}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2 font-semibold shrink-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-primary to-purple-600 text-white text-xs font-bold">
              L
            </div>
            <span className="hidden sm:inline text-sm sm:text-base">Lotiq</span>
          </Link>

          {/* CENTRO – MENÚ DESKTOP (solo en lg) */}
          {user && (
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs xl:text-sm text-muted-foreground flex-1 justify-center px-4" suppressHydrationWarning>
              <Link href="/dashboard" className="px-3 py-2 rounded hover:bg-accent transition-colors flex items-center gap-1.5">
                <Home size={16} /> <span className="hidden xl:inline">Postear</span>
              </Link>

              <Link href="/results" className="px-3 py-2 rounded hover:bg-accent transition-colors flex items-center gap-1.5">
                🎰 <span className="hidden xl:inline">Resultados</span>
              </Link>

              <Link href="/ranking" className="px-3 py-2 rounded hover:bg-accent transition-colors flex items-center gap-1.5">
                <Crown size={16} /> <span>Ranking</span>
              </Link>

              <Link href="/stats" className="px-3 py-2 rounded hover:bg-accent transition-colors flex items-center gap-1.5">
                <BarChart2 size={16} /> <span className="hidden xl:inline">Estadísticas</span>
              </Link>

              <Link href="/premium" className="px-3 py-2 rounded hover:bg-accent transition-colors flex items-center gap-1.5">
                <Crown size={16} /> <span className="hidden xl:inline">{user.is_premium ? "Zona Premium" : "Herramientas Gratis"}</span>
              </Link>

              <Link href="/pricing" className="px-3 py-2 rounded hover:bg-accent transition-colors flex items-center gap-1.5">
                💎 <span className="hidden xl:inline">Precios</span>
              </Link>

              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="px-3 py-2 rounded font-medium text-primary hover:bg-primary/10"
                >
                  Admin
                </Link>
              )}
            </nav>
          )}

        {/* MENÚ HAMBURGUESA MÓVIL (lg:hidden) */}
        {user && mounted && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} suppressHydrationWarning>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <nav className="flex flex-col gap-2 mt-8">
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home size={18} /> Postear
                </Link>

                <Link 
                  href="/results" 
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🎰 Resultados
                </Link>

                <Link 
                  href="/ranking" 
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Crown size={18} /> Ranking
                </Link>

                <Link 
                  href="/stats" 
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BarChart2 size={18} /> Estadísticas
                </Link>

                <Link 
                  href="/premium" 
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Crown size={18} /> {user.is_premium ? "Zona Premium" : "Herramientas Gratis"}
                </Link>

                <Link 
                  href="/pricing" 
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  💎 Precios
                </Link>

                {user.role === "admin" && (
                  <>
                    <div className="border-t my-2"></div>
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-3 py-3 rounded-lg bg-primary/10 text-primary font-medium text-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Panel Admin
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        )}

        {/* DERECHA – TEMA + NOTIFICACIONES + USUARIO */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto" suppressHydrationWarning>
          {/* Toggle Dark / Light */}
          <ThemeToggle />

          {/* Notificaciones */}
          {mounted && user && <NotificationBell />}

          {mounted && user ? (
            <DropdownMenu suppressHydrationWarning>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-xs sm:text-sm">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline truncate max-w-28">{user.username}</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Mi cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form
                    action={async () => {
                      await logoutAction()
                    }}
                    className="w-full"
                  >
                    <button
                      type="submit"
                      className="flex w-full items-center text-left text-destructive text-sm"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : mounted ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild className="text-xs sm:text-sm">
                <Link href="/register">Registro</Link>
              </Button>
            </div>
          ) : (
            <div className="w-24 h-9 bg-muted rounded animate-pulse"></div>
          )}
        </div>

        </div>
      </div>
    </header>
  )
}
