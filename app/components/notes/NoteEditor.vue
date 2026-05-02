<script setup lang="ts">
import type { NoteRecord, TagRecord } from '~/types/pocketbase'

const props = defineProps<{ noteId: string | undefined }>()
const emit = defineEmits<{
  saved: [note: NoteRecord]
  deleted: [id: string]
}>()

const pb = usePocketBase()
const { createNote, updateNote, deleteNote } = useNotes()
const { tags: allTags, fetchTags, createTag } = useTags()
const toast = useToast()

const isNew = computed(() => !props.noteId || props.noteId === 'new')
const showPreview = ref(false)
const saving = ref(false)
const deleting = ref(false)
const deleteConfirmOpen = ref(false)
const tagPopoverOpen = ref(false)
const tagSearch = ref('')

// Form state
const title = ref('')
const content = ref('')
const isPinned = ref(false)
const selectedTags = ref<TagRecord[]>([])

// Dirty tracking
const originalTitle = ref('')
const originalContent = ref('')

const isDirty = computed(() => {
  if (isNew.value) return !!(title.value.trim() || content.value.trim())
  return title.value !== originalTitle.value || content.value !== originalContent.value
})

watch(() => props.noteId, async (id) => {
  title.value = ''
  content.value = ''
  isPinned.value = false
  selectedTags.value = []
  originalTitle.value = ''
  originalContent.value = ''

  if (!id || id === 'new') {
    showPreview.value = false
    return
  }

  const note = await pb.collection('notes').getOne<NoteRecord>(id, {
    expand: 'linked_tags'
  })
  title.value = note.title
  content.value = note.content
  isPinned.value = note.is_pinned
  selectedTags.value = note.expand?.linked_tags ?? []
  originalTitle.value = note.title
  originalContent.value = note.content
  showPreview.value = true
}, { immediate: true })

onMounted(fetchTags)

// Pin — save immediately on existing notes
const togglePin = async () => {
  isPinned.value = !isPinned.value
  if (!isNew.value && props.noteId) {
    try {
      await updateNote(props.noteId, { is_pinned: isPinned.value })
    }
    catch {
      isPinned.value = !isPinned.value
      toast.add({ title: 'Failed to update pin', color: 'error' })
    }
  }
}

// Tags
const filteredTags = computed(() => {
  const q = tagSearch.value.toLowerCase()
  return allTags.value.filter(t =>
    t.title.toLowerCase().includes(q) &&
    !selectedTags.value.some(s => s.id === t.id)
  )
})

const addTag = (tag: TagRecord) => {
  selectedTags.value.push(tag)
  tagSearch.value = ''
  tagPopoverOpen.value = false
}

const createAndAddTag = async () => {
  const title = tagSearch.value.trim()
  if (!title) return
  const tag = await createTag(title)
  selectedTags.value.push(tag)
  tagSearch.value = ''
  tagPopoverOpen.value = false
}

const removeTag = (id: string) => {
  selectedTags.value = selectedTags.value.filter(t => t.id !== id)
}

// Save
const save = async () => {
  saving.value = true
  try {
    const data = {
      title: title.value,
      content: content.value,
      is_pinned: isPinned.value,
      linked_tags: selectedTags.value.map(t => t.id)
    }
    const note = isNew.value
      ? await createNote(data)
      : await updateNote(props.noteId!, data)
    const wasNew = isNew.value
    originalTitle.value = title.value
    originalContent.value = content.value
    toast.add({ title: wasNew ? 'Note created' : 'Note saved', color: 'success' })
    emit('saved', note)
  }
  catch {
    toast.add({ title: 'Save failed', color: 'error' })
  }
  finally {
    saving.value = false
  }
}

// Delete
const doDelete = async () => {
  if (!props.noteId || isNew.value) return
  deleting.value = true
  try {
    await deleteNote(props.noteId)
    deleteConfirmOpen.value = false
    toast.add({ title: 'Note deleted', color: 'neutral' })
    emit('deleted', props.noteId)
  }
  catch {
    toast.add({ title: 'Failed to delete note', color: 'error' })
  }
  finally {
    deleting.value = false
  }
}

defineShortcuts({ meta_s: () => isDirty.value && save() })

const renderedContent = computed(() => renderMarkdown(content.value))
</script>

<template>
  <!-- Empty state -->
  <div v-if="noteId === undefined" class="flex flex-1 flex-col items-center justify-center gap-3 text-muted">
    <UIcon name="i-lucide-file-text" class="size-12 opacity-20" />
    <p class="text-sm">Select a note or create a new one</p>
  </div>

  <!-- Editor -->
  <div v-else class="flex flex-1 flex-col overflow-hidden">
    <!-- Toolbar -->
    <div class="shrink-0 border-b border-default">
      <div class="flex h-14 items-center gap-2 px-4">
        <!-- Title -->
        <UInput
          v-model="title"
          placeholder="Note title"
          variant="none"
          size="lg"
          class="font-semibold shrink-0"
          style="width: auto; min-width: 0;"
        />
        <!-- Tags inline -->
        <div class="flex flex-1 flex-wrap items-center gap-1.5 min-w-0 overflow-hidden">
          <UBadge
            v-for="tag in selectedTags"
            :key="tag.id"
            variant="subtle"
            color="primary"
            size="sm"
            class="cursor-pointer gap-1 shrink-0"
            @click="removeTag(tag.id)"
          >
            {{ tag.title }}
            <UIcon name="i-lucide-x" class="size-3" />
          </UBadge>
          <UPopover v-model:open="tagPopoverOpen">
            <UButton icon="i-lucide-tag" size="xs" variant="ghost" color="neutral" aria-label="Add tag" />
            <template #content>
              <div class="w-48 p-2 space-y-1">
                <UInput
                  v-model="tagSearch"
                  placeholder="Search or create…"
                  size="sm"
                  autofocus
                  @keydown.enter.prevent="createAndAddTag"
                />
                <div class="max-h-40 overflow-y-auto space-y-0.5 pt-1">
                  <button
                    v-for="tag in filteredTags"
                    :key="tag.id"
                    class="w-full text-left rounded px-2 py-1.5 text-sm hover:bg-elevated transition-colors"
                    @click="addTag(tag)"
                  >
                    {{ tag.title }}
                  </button>
                  <button
                    v-if="tagSearch.trim() && !filteredTags.some(t => t.title === tagSearch.trim())"
                    class="w-full text-left rounded px-2 py-1.5 text-sm text-primary hover:bg-elevated transition-colors"
                    @click="createAndAddTag"
                  >
                    Create "{{ tagSearch.trim() }}"
                  </button>
                  <p
                    v-if="!tagSearch && filteredTags.length === 0"
                    class="px-2 py-1.5 text-xs text-muted"
                  >
                    No more tags
                  </p>
                </div>
              </div>
            </template>
          </UPopover>
        </div>
        <!-- Action buttons -->
        <div class="flex items-center gap-0.5 shrink-0">
          <UButton
            :icon="showPreview ? 'i-lucide-eye' : 'i-lucide-pencil'"
            variant="ghost"
            :color="showPreview ? 'primary' : 'neutral'"
            size="sm"
            :aria-label="showPreview ? 'Switch to edit' : 'Switch to preview'"
            @click="showPreview = !showPreview"
          />
          <UButton
            icon="i-lucide-pin"
            variant="ghost"
            :color="isPinned ? 'primary' : 'neutral'"
            size="sm"
            aria-label="Pin"
            @click="togglePin"
          />
          <UButton
            v-if="!isNew"
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            size="sm"
            aria-label="Delete note"
            @click="deleteConfirmOpen = true"
          />
          <UButton
            :label="isNew ? 'Create' : 'Save'"
            size="sm"
            :loading="saving"
            :disabled="!isDirty"
            class="ml-1"
            @click="save"
          />
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-hidden">
      <textarea
        v-if="!showPreview"
        v-model="content"
        placeholder="Write in markdown..."
        class="h-full w-full resize-none bg-transparent p-4 text-sm outline-none font-mono leading-relaxed"
      />
      <div
        v-else
        class="prose prose-sm dark:prose-invert h-full w-full overflow-y-auto p-4 max-w-none"
        v-html="renderedContent"
      />
    </div>

    <!-- Delete confirm modal -->
    <UModal v-model:open="deleteConfirmOpen">
      <template #content>
        <div class="p-5 space-y-4">
          <div class="space-y-1">
            <p class="font-semibold text-highlighted">Delete this note?</p>
            <p class="text-sm text-muted">This action cannot be undone.</p>
          </div>
          <div class="flex justify-end gap-2">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              @click="deleteConfirmOpen = false"
            />
            <UButton
              label="Delete"
              color="error"
              :loading="deleting"
              @click="doDelete"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
