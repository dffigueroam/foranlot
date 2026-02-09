/**
 * Sincronización automática con node-cron (solo si corres servidor 24/7)
 * 
 * Para usar:
 * 1. npm install node-cron
 * 2. Descomentar este archivo en tu servidor principal
 * 3. Importar en tu app: import './lib/cron-scheduler'
 */

// import cron from 'node-cron'

// // Ejecutar todos los días a las 6 AM
// cron.schedule('0 6 * * *', async () => {
//   console.log('[v0] Running scheduled sync at 6 AM')
  
//   try {
//     const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron/sync-results`, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${process.env.CRON_SECRET}`
//       }
//     })

//     const result = await response.json()
//     console.log('[v0] Sync result:', result)
//   } catch (error) {
//     console.error('[v0] Error in scheduled sync:', error)
//   }
// }, {
//   timezone: "America/Bogota" // Zona horaria de Colombia
// })

// console.log('[v0] Cron scheduler initialized - Daily sync at 6 AM')
