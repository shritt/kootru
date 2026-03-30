import type { RecordModel } from 'pocketbase'

export interface TagRecord extends RecordModel {
  name: string
}

export interface FileRecord extends RecordModel {
  name: string
  media: string
}

export interface NoteRecord extends RecordModel {
  title: string
  content: string
  is_sticky: boolean
  is_favorite: boolean
  tags: string[]
  attachments: string[]
  expand?: {
    tags?: TagRecord[]
    attachments?: FileRecord[]
  }
}
