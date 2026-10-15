// Избранное хранится только в браузере. Состояние общее на всё приложение (useState), инициализирует его плагин favorites.client.
const KEY = 'jewell:favorites'

export function useFavorites() {
  const ids = useState<string[]>('favorites', () => [])
  // true, когда список прочитан из localStorage (до гидратации он пуст, и «пустым» его считать нельзя).
  const ready = useState('favorites-ready', () => false)

  function toggle(documentId: string) {
    ids.value = ids.value.includes(documentId)
      ? ids.value.filter(id => id !== documentId)
      : [...ids.value, documentId]
    try {
      localStorage.setItem(KEY, JSON.stringify(ids.value))
    } catch { /* приватный режим: работаем только в памяти */ }
  }

  return { ids, ready, has: (documentId: string) => ids.value.includes(documentId), toggle }
}
