import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { normalizeCountryCode } from "@/lib/country-utils"

const sql = neon(process.env.DATABASE_URL!)

async function resolveCountryName(country?: string | null): Promise<string | null> {
  if (!country) return null
  const trimmed = country.trim()
  if (!trimmed) return null

  const normalizedInput = normalizeCountryCode(trimmed) || trimmed

  const byCode = await sql`
    SELECT name
    FROM countries
    WHERE UPPER(code) = UPPER(${normalizedInput})
    LIMIT 1
  `

  if (byCode.length > 0) {
    return byCode[0].name as string
  }

  const byName = await sql`
    SELECT name
    FROM countries
    WHERE LOWER(name) = LOWER(${normalizedInput})
    LIMIT 1
  `

  if (byName.length > 0) {
    return byName[0].name as string
  }

  return null
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("[v0] Profile update: No authenticated user")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { fullName, email, username, city, profession, estrato, country, company, gender, acceptsMarketingEmails } = await request.json()
    console.log("[v0] Profile update request:", { userId: user.id, fullName, email, username, country, city, company, profession, estrato, gender, acceptsMarketingEmails })

    const normalizedCountry = await resolveCountryName(country)

    if (country && !normalizedCountry) {
      console.log("[v0] Profile update: Invalid country:", country)
      return NextResponse.json({ error: "País inválido" }, { status: 400 })
    }

    // Validar email y username si se están cambiando
    if (email && email !== user.email) {
      const existingEmail = await sql`
        SELECT id FROM users WHERE LOWER(email) = LOWER(${email}) AND id != ${user.id}
      `
      if (existingEmail.length > 0) {
        return NextResponse.json({ error: "El correo ya está en uso por otro usuario" }, { status: 400 })
      }
    }

    if (username && username !== user.username) {
      const existingUsername = await sql`
        SELECT id FROM users WHERE LOWER(username) = LOWER(${username}) AND id != ${user.id}
      `
      if (existingUsername.length > 0) {
        return NextResponse.json({ error: "El nombre de usuario ya está en uso" }, { status: 400 })
      }
    }

    await sql`
      UPDATE users SET
        full_name = ${fullName || null},
        email = ${email || user.email},
        username = ${username || user.username},
        country = ${normalizedCountry},
        city = ${city || null},
        company = ${company || null},
        profession = ${profession || null},
        estrato = ${estrato || null},
        gender = ${gender || null},
        accepts_marketing_emails = ${acceptsMarketingEmails || false}
      WHERE id = ${user.id}
    `

    console.log("[v0] Profile updated successfully for user:", user.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Profile update error:", error)
    return NextResponse.json({ 
      error: "Error al actualizar perfil",
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const result = await sql`
      SELECT
        full_name,
        email,
        username,
        country,
        city,
        company,
        profession,
        estrato,
        gender,
        accepts_marketing_emails,
        updated_at
      FROM users
      WHERE id = ${user.id}
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, profile: result[0] })
  } catch (error: any) {
    console.error("[v0] Profile fetch error:", error)
    return NextResponse.json({ error: "Error al consultar perfil" }, { status: 500 })
  }
}
