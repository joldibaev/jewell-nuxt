// Лёгкая проверка для Docker/Coolify: не обращается к Strapi, поэтому недоступность CMS не перезапускает сайт.
export default defineEventHandler(() => ({ status: 'ok' }))
