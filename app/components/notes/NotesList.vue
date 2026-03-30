<script setup lang="ts">
defineProps<{ activeNoteId?: string }>()
defineEmits<{ select: [id: string], new: [] }>()

const { notes, fetchNotes } = useNotes()

onMounted(fetchNotes)
</script>

<template>
  <div class="flex h-[200px] w-full shrink-0 flex-col border-b border-default lg:h-full lg:w-72 lg:border-b-0 lg:border-r">
    <!-- Header -->
    <div class="flex h-14 shrink-0 items-center justify-between border-b border-default px-4">
      <span class="text-sm font-semibold text-highlighted">Notes</span>
      <UButton
        icon="i-lucide-plus"
        size="xs"
        variant="ghost"
        color="neutral"
        aria-label="New note"
        @click="$emit('new')"
      />
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
      <p v-if="notes.length === 0" class="px-3 py-10 text-center text-xs text-muted">
        No notes yet.<br>Click + to create one.
      </p>
      <NotesNoteCard
        v-for="note in notes"
        :key="note.id"
        :note="note"
        :active="activeNoteId === note.id"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>
