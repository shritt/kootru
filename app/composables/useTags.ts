import type { TagRecord } from '~/types/pocketbase'

export const useTags = () => {
  const pb = usePocketBase()
  const tags = useState<TagRecord[]>('tags', () => [])

  const fetchTags = async () => {
    tags.value = await pb.collection('tags').getFullList<TagRecord>({ sort: 'title' })
  }

  const createTag = async (title: string) => {
    const tag = await pb.collection('tags').create<TagRecord>({ title })
    tags.value.push(tag)
    tags.value.sort((a, b) => a.title.localeCompare(b.title))
    return tag
  }

  const deleteTag = async (id: string) => {
    await pb.collection('tags').delete(id)
    tags.value = tags.value.filter(t => t.id !== id)
  }

  return { tags, fetchTags, createTag, deleteTag }
}
