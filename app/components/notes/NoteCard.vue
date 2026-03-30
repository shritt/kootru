<script setup lang="ts">
import type { NoteRecord } from '~/types/pocketbase'

const props = defineProps<{
  note: NoteRecord
  active?: boolean
}>()

defineEmits<{ select: [id: string] }>()

const updatedAt = computed(() =>
  new Date(props.note.updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
)
</script>

<template>
  <button
    class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors"
    :class="active ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-elevated'"
    @click="$emit('select', note.id)"
  >
    <span class="flex-1 truncate text-sm font-medium text-highlighted">
      {{ note.title || 'Untitled' }}
    </span>
    <span class="shrink-0 text-xs text-muted">{{ updatedAt }}</span>
    <UIcon v-if="note.is_sticky" name="i-lucide-pin" class="size-3 shrink-0 text-primary" />
    <UIcon v-if="note.is_favorite" name="i-lucide-star" class="size-3 shrink-0 text-yellow-500" />
  </button>
</template>
