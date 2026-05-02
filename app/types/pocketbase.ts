import type { RecordModel } from 'pocketbase'

export interface TagRecord extends RecordModel {
  title: string
}

export interface ProjectRecord extends RecordModel {
  name: string
  description: string
  color: string
}

export interface NoteRecord extends RecordModel {
  title: string
  content: string
  project: string
  linked_tags: string[]
  is_pinned: boolean
  is_dropped: boolean
  expand?: {
    linked_tags?: TagRecord[]
    project?: ProjectRecord
  }
}
