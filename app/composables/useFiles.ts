import type { FileRecord } from '~/types/pocketbase'

export const useFiles = () => {
  const pb = usePocketBase()
  const files = useState<FileRecord[]>('files', () => [])

  const fetchFiles = async () => {
    files.value = await pb.collection('files').getFullList<FileRecord>({ sort: '-created' })
  }

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('name', file.name)
    formData.append('media', file)
    const record = await pb.collection('files').create<FileRecord>(formData)
    files.value.unshift(record)
    return record
  }

  const deleteFile = async (id: string) => {
    await pb.collection('files').delete(id)
    files.value = files.value.filter(f => f.id !== id)
  }

  const getFileUrl = (record: FileRecord) => pb.files.getURL(record, record.media)

  return { files, fetchFiles, uploadFile, deleteFile, getFileUrl }
}
