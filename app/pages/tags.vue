<script setup lang="ts">
definePageMeta({ layout: 'app', middleware: 'auth' })

const { tags, fetchTags, createTag, deleteTag } = useTags()
const { notes, fetchNotes } = useNotes()
const toast = useToast()

const newTagName = ref('')
const creating = ref(false)

onMounted(() => Promise.all([fetchTags(), fetchNotes()]))

const noteCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const note of notes.value) {
    for (const tagId of note.tags) {
      counts[tagId] = (counts[tagId] || 0) + 1
    }
  }
  return counts
})

const handleCreate = async () => {
  const name = newTagName.value.trim()
  if (!name) return
  creating.value = true
  try {
    await createTag(name)
    newTagName.value = ''
    toast.add({ title: `Tag "${name}" created`, color: 'success' })
  }
  catch {
    toast.add({ title: 'Failed to create tag', color: 'error' })
  }
  finally {
    creating.value = false
  }
}

const handleDelete = async (id: string) => {
  try {
    await deleteTag(id)
    toast.add({ title: 'Tag deleted', color: 'neutral' })
  }
  catch {
    toast.add({ title: 'Failed to delete tag', color: 'error' })
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col overflow-y-auto">
    <div class="mx-auto w-full max-w-2xl px-6 py-8 space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-xl font-semibold text-highlighted">Tags</h1>
        <p class="text-sm text-muted mt-1">Organise your notes with tags.</p>
      </div>

      <!-- Create -->
      <UForm :state="{ name: newTagName }" class="flex gap-2" @submit="handleCreate">
        <UInput
          v-model="newTagName"
          placeholder="New tag name…"
          class="flex-1"
          @keydown.enter.prevent="handleCreate"
        />
        <UButton
          label="Create"
          :loading="creating"
          :disabled="!newTagName.trim()"
          type="submit"
        />
      </UForm>

      <!-- List -->
      <div class="space-y-2">
        <p v-if="tags.length === 0" class="text-sm text-muted py-6 text-center">
          No tags yet.
        </p>
        <TagsTagChip
          v-for="tag in tags"
          :key="tag.id"
          :tag="tag"
          :count="noteCounts[tag.id] ?? 0"
          deletable
          @delete="handleDelete"
        />
      </div>
    </div>
  </div>
</template>
