// Избранное читается из localStorage один раз и только после гидратации,
// чтобы серверная разметка и первая клиентская совпали, а карточки не читали storage по отдельности.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    try {
      useState<string[]>('favorites').value = JSON.parse(localStorage.getItem('jewell:favorites') || '[]')
    } catch {
      /* приватный режим или битое значение: начинаем с пустого списка */
    }
    useState('favorites-ready').value = true
  })
})
