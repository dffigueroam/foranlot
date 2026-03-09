# Estado SEO - Corte YYYY-MM-DD

## Fecha de corte
- YYYY-MM-DD

## Resumen ejecutivo
- [ ] Estado general del SEO en una linea.
- [ ] Fase actual (tecnico, on-page, contenido, medicion).
- [ ] Riesgo principal o bloqueo (si aplica).

## Alcance completado

### Fase 1 - SEO tecnico base
- [ ] Dominio/canonical unificado.
- [ ] `robots` alineado con rutas publicas/privadas.
- [ ] `sitemap` actualizado con rutas indexables.
- [ ] `noindex` aplicado en rutas privadas.

Archivos clave tocados:
- `app/layout.tsx`
- `app/robots.ts`
- `app/sitemap.ts`

### Fase 2 - On-page SEO
- [ ] Metadata por pagina publica.
- [ ] Open Graph/Twitter por pagina.
- [ ] JSON-LD por tipo de pagina.

Archivos clave tocados:
- `app/page.tsx`
- `app/results/page.tsx`
- `app/info/...`

### Fase 3 - Search Console / Bing
- [ ] Variables de verificacion configuradas.
- [ ] Propiedades verificadas en paneles.
- [ ] Sitemap enviado.

Archivos clave tocados:
- `app/layout.tsx`
- `README.md`

## Variables de entorno (estado)
- `NEXT_PUBLIC_APP_URL`: [pendiente/configurada]
- `GOOGLE_SITE_VERIFICATION`: [pendiente/configurada]
- `BING_SITE_VERIFICATION`: [pendiente/configurada]

## Pendientes para siguiente iteracion
1. [ ] Tarea prioritaria 1.
2. [ ] Tarea prioritaria 2.
3. [ ] Tarea prioritaria 3.

## Checklist post-deploy
- [ ] `https://<dominio>/robots.txt` responde correctamente.
- [ ] `https://<dominio>/sitemap.xml` responde y lista rutas esperadas.
- [ ] Meta de verificacion Google visible en HTML final.
- [ ] Meta de verificacion Bing visible en HTML final.
- [ ] Canonical correcto en Home y Results.
- [ ] Open Graph/Twitter sin errores en previews.

## KPIs del periodo (opcional)
- Impresiones organicas: [valor]
- Clics organicos: [valor]
- CTR promedio: [valor]
- URLs validas indexadas: [valor]

## Nota de control
- Documento creado a partir de `docs/SEO_AVANCE_TEMPLATE.md`.
- Mantener formato por fecha: `docs/SEO_AVANCE_YYYY-MM-DD.md`.
