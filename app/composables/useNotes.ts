import type { NoteRecord } from '~/types/pocketbase'

export const useNotes = () => {
  const pb = usePocketBase()
  const notes = useState<NoteRecord[]>('notes', () => [])

  const fetchNotes = async () => {
    const records = await pb.collection('notes').getFullList<NoteRecord>({
      sort: '-is_pinned,-updated',
      expand: 'linked_tags'
    })
    notes.value = records
  }

  const createNote = async (data: {
    title: string
    content: string
    is_pinned: boolean
    linked_tags: string[]
  }) => {
    const record = await pb.collection('notes').create<NoteRecord>(data, {
      expand: 'linked_tags'
    })
    notes.value.unshift(record)
    return record
  }

  const updateNote = async (id: string, data: Partial<NoteRecord>) => {
    const record = await pb.collection('notes').update<NoteRecord>(id, data, {
      expand: 'linked_tags'
    })
    const idx = notes.value.findIndex(n => n.id === id)
    if (idx !== -1) notes.value[idx] = record
    return record
  }

  const deleteNote = async (id: string) => {
    await pb.collection('notes').delete(id)
    notes.value = notes.value.filter(n => n.id !== id)
  }

  return { notes, fetchNotes, createNote, updateNote, deleteNote }
}
