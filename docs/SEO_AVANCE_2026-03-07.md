# Estado SEO - Corte 2026-03-07

## Fecha de corte
- 2026-03-07

## Resumen ejecutivo
- Se completo la base tecnica SEO (Fase 1).
- Se completo metadata por paginas publicas y JSON-LD inicial (Fase 2).
- Se dejo lista la integracion tecnica para verificacion en Google Search Console y Bing Webmaster (Fase 3).

## Alcance completado

### Fase 1 - SEO tecnico base
- Dominio base unificado por variable de entorno en metadata/robots/sitemap.
- Limpieza de metadata global (eliminacion de duplicados y consistencia de marca).
- Reglas de `robots` alineadas con rutas privadas/autenticadas.
- Sitemap ajustado a rutas publicas indexables.
- `noindex` aplicado en rutas privadas/autenticadas.

Archivos clave tocados:
- `app/layout.tsx`
- `app/robots.ts`
- `app/sitemap.ts`
- `app/dashboard/page.tsx`
- `app/pricing/page.tsx`
- `app/ranking/page.tsx`
- `app/premium/page.tsx`
- `app/profile/page.tsx`
- `app/tools/page.tsx`
- `app/stats/page.tsx`
- `app/selections/page.tsx`
- `app/my-payments/page.tsx`
- `app/contracts/page.tsx`
- `app/verify-email/page.tsx`
- `app/admin/layout.tsx`
- `app/admin/page.tsx`
- `app/admin/diagnostics/page.tsx`
- `app/admin/ml-utilities/page.tsx`

### Fase 2 - On-page SEO
- Metadata especifica por pagina en rutas publicas de alto valor.
- Canonical y Open Graph/Twitter por pagina.
- JSON-LD agregado:
	- Home: `WebSite` + `Organization`
	- Results: `ItemList` + `BreadcrumbList`
- Login/Register/Reactivate marcadas como `noindex`.
- Sitemap refinado para incluir solo paginas publicas de valor SEO.

Archivos clave tocados:
- `app/page.tsx`
- `app/results/page.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/reactivate/page.tsx`
- `app/info/guia-usos/page.tsx`
- `app/info/consideraciones-usos/page.tsx`
- `app/info/vinculacion-cuentas/page.tsx`
- `app/sitemap.ts`

### Fase 3 - Search Console / Bing
- Verificacion de buscadores parametrizada por variables de entorno (sin hardcode).
- Soporte para Google y Bing en metadata.
- Documentacion operativa agregada en README.

Archivos clave tocados:
- `app/layout.tsx`
- `README.md`

## Variables de entorno requeridas (pendientes de definir en produccion)
- `NEXT_PUBLIC_APP_URL`
- `GOOGLE_SITE_VERIFICATION`
- `BING_SITE_VERIFICATION`

## Pendientes para cierre SEO (siguiente iteracion)
1. Definir dominio final y aplicar `NEXT_PUBLIC_APP_URL` en produccion.
2. Crear/validar propiedades en Google Search Console y Bing Webmaster.
3. Enviar sitemap y solicitar indexacion de URLs clave (`/`, `/results`, rutas `/info/*`).
4. Implementar paginas long-tail de resultados por loteria/fecha (SEO programatico).
5. Agregar `FAQPage` JSON-LD en paginas con preguntas frecuentes reales.

## Checklist post-deploy
- [ ] `https://<dominio>/robots.txt` responde correctamente.
- [ ] `https://<dominio>/sitemap.xml` responde y lista rutas esperadas.
- [ ] Meta de verificacion Google visible en HTML final.
- [ ] Meta de verificacion Bing visible en HTML final.
- [ ] Canonical correcto en Home y Results.
- [ ] Open Graph/Twitter sin errores en previews.

## Nota de control
- Este documento refleja el estado hasta el corte del 2026-03-07.
- Recomendado: crear un nuevo corte por fecha para mantener historial (`docs/SEO_AVANCE_YYYY-MM-DD.md`).
- Plantilla base creada: `docs/SEO_AVANCE_TEMPLATE.md`.
