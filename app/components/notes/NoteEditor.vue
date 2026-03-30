<script setup lang="ts">
import type { NoteRecord, TagRecord, FileRecord } from '~/types/pocketbase'

const props = defineProps<{ noteId: string | undefined }>()
const emit = defineEmits<{
  saved: [note: NoteRecord]
  deleted: [id: string]
}>()

const pb = usePocketBase()
const { createNote, updateNote, deleteNote } = useNotes()
const { tags: allTags, fetchTags, createTag } = useTags()
const { uploadFile, getFileUrl } = useFiles()
const toast = useToast()

const isNew = computed(() => !props.noteId || props.noteId === 'new')
const showPreview = ref(false)
const saving = ref(false)
const deleting = ref(false)
const uploading = ref(false)
const deleteConfirmOpen = ref(false)
const tagPopoverOpen = ref(false)
const tagSearch = ref('')

// Form state
const title = ref('')
const content = ref('')
const isSticky = ref(false)
const isFavorite = ref(false)
const selectedTags = ref<TagRecord[]>([])
const attachedFiles = ref<FileRecord[]>([])

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
  isSticky.value = false
  isFavorite.value = false
  selectedTags.value = []
  attachedFiles.value = []
  originalTitle.value = ''
  originalContent.value = ''

  if (!id || id === 'new') {
    showPreview.value = false
    return
  }

  const note = await pb.collection('notes').getOne<NoteRecord>(id, {
    expand: 'tags,attachments'
  })
  title.value = note.title
  content.value = note.content
  isSticky.value = note.is_sticky
  isFavorite.value = note.is_favorite
  selectedTags.value = note.expand?.tags ?? []
  attachedFiles.value = note.expand?.attachments ?? []
  originalTitle.value = note.title
  originalContent.value = note.content
  showPreview.value = true
}, { immediate: true })

onMounted(fetchTags)

// Pin / Favorite — save immediately on existing notes
const toggleSticky = async () => {
  isSticky.value = !isSticky.value
  if (!isNew.value && props.noteId) {
    try {
      await updateNote(props.noteId, { is_sticky: isSticky.value })
    }
    catch {
      isSticky.value = !isSticky.value
      toast.add({ title: 'Failed to update pin', color: 'error' })
    }
  }
}

const toggleFavorite = async () => {
  isFavorite.value = !isFavorite.value
  if (!isNew.value && props.noteId) {
    try {
      await updateNote(props.noteId, { is_favorite: isFavorite.value })
    }
    catch {
      isFavorite.value = !isFavorite.value
      toast.add({ title: 'Failed to update favourite', color: 'error' })
    }
  }
}

// Tags
const filteredTags = computed(() => {
  const q = tagSearch.value.toLowerCase()
  return allTags.value.filter(t =>
    t.name.toLowerCase().includes(q) &&
    !selectedTags.value.some(s => s.id === t.id)
  )
})

const addTag = (tag: TagRecord) => {
  selectedTags.value.push(tag)
  tagSearch.value = ''
  tagPopoverOpen.value = false
}

const createAndAddTag = async () => {
  const name = tagSearch.value.trim()
  if (!name) return
  const tag = await createTag(name)
  selectedTags.value.push(tag)
  tagSearch.value = ''
  tagPopoverOpen.value = false
}

const removeTag = (id: string) => {
  selectedTags.value = selectedTags.value.filter(t => t.id !== id)
}

// Files
const fileInputRef = ref<HTMLInputElement>()

const handleFileSelect = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const record = await uploadFile(file)
    attachedFiles.value.push(record)
  }
  catch {
    toast.add({ title: 'Upload failed', color: 'error' })
  }
  finally {
    uploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

const removeAttachment = (id: string) => {
  attachedFiles.value = attachedFiles.value.filter(f => f.id !== id)
}

// Save
const save = async () => {
  saving.value = true
  try {
    const data = {
      title: title.value,
      content: content.value,
      is_sticky: isSticky.value,
      is_favorite: isFavorite.value,
      tags: selectedTags.value.map(t => t.id),
      attachments: attachedFiles.value.map(f => f.id)
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
    <!-- Toolbar — h-14 matches other panel headers -->
    <div class="flex h-14 shrink-0 items-center gap-2 border-b border-default px-4">
      <UInput
        v-model="title"
        placeholder="Note title"
        variant="none"
        size="lg"
        class="flex-1 font-semibold"
      />
      <div class="flex items-center gap-0.5">
        <UButton
          :icon="showPreview ? 'i-lucide-pencil' : 'i-lucide-eye'"
          variant="ghost"
          color="neutral"
          size="sm"
          :aria-label="showPreview ? 'Edit' : 'Preview'"
          @click="showPreview = !showPreview"
        />
        <UButton
          icon="i-lucide-star"
          variant="ghost"
          :color="isFavorite ? 'warning' : 'neutral'"
          size="sm"
          aria-label="Favourite"
          @click="toggleFavorite"
        />
        <UButton
          icon="i-lucide-pin"
          variant="ghost"
          :color="isSticky ? 'primary' : 'neutral'"
          size="sm"
          aria-label="Pin"
          @click="toggleSticky"
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

    <!-- Footer: tags + attachments -->
    <div class="shrink-0 border-t border-default px-4 py-3 space-y-2">
      <!-- Tags -->
      <div class="flex flex-wrap items-center gap-1.5 min-h-6">
        <UIcon name="i-lucide-tag" class="size-3.5 text-muted shrink-0" />
        <UBadge
          v-for="tag in selectedTags"
          :key="tag.id"
          variant="subtle"
          color="primary"
          size="sm"
          class="cursor-pointer gap-1"
          @click="removeTag(tag.id)"
        >
          {{ tag.name }}
          <UIcon name="i-lucide-x" class="size-3" />
        </UBadge>
        <UPopover v-model:open="tagPopoverOpen">
          <UButton icon="i-lucide-plus" size="xs" variant="ghost" color="neutral" label="Add tag" />
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
                  {{ tag.name }}
                </button>
                <button
                  v-if="tagSearch.trim() && !filteredTags.some(t => t.name === tagSearch.trim())"
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

      <!-- Attachments -->
      <div class="flex flex-wrap items-center gap-1.5 min-h-6">
        <UIcon name="i-lucide-paperclip" class="size-3.5 text-muted shrink-0" />
        <UBadge
          v-for="file in attachedFiles"
          :key="file.id"
          variant="subtle"
          color="neutral"
          size="sm"
          class="gap-1"
        >
          <a :href="getFileUrl(file)" target="_blank" class="hover:underline max-w-32 truncate block">
            {{ file.name }}
          </a>
          <button @click="removeAttachment(file.id)">
            <UIcon name="i-lucide-x" class="size-3" />
          </button>
        </UBadge>
        <input ref="fileInputRef" type="file" class="hidden" @change="handleFileSelect" />
        <UButton
          icon="i-lucide-plus"
          size="xs"
          variant="ghost"
          color="neutral"
          label="Attach"
          :loading="uploading"
          @click="fileInputRef?.click()"
        />
      </div>
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
