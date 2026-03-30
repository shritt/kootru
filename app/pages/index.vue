<script setup lang="ts">
import type { NoteRecord } from '~/types/pocketbase'

definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

const route = useRoute()
const activeNoteId = computed(() => route.query.id as string | undefined)

const openNote = (id: string) => navigateTo({ query: { id } })
const newNote = () => navigateTo({ query: { id: 'new' } })

const handleSaved = (note: NoteRecord) => navigateTo({ query: { id: note.id } })
const handleDeleted = () => navigateTo({ query: {} })
</script>

<template>
  <div class="flex flex-1 flex-col overflow-hidden lg:flex-row">
    <NotesList
      :active-note-id="activeNoteId"
      @select="openNote"
      @new="newNote"
    />
    <NotesNoteEditor
      :note-id="activeNoteId"
      @saved="handleSaved"
      @deleted="handleDeleted"
    />
  </div>
</template>
