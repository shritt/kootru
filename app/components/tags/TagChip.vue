<script setup lang="ts">
import type { TagRecord } from '~/types/pocketbase'

defineProps<{
  tag: TagRecord
  count?: number
  deletable?: boolean
}>()

defineEmits<{ delete: [id: string] }>()
</script>

<template>
  <div class="flex items-center gap-2 rounded-lg border border-default bg-background px-3 py-2">
    <UIcon name="i-lucide-tag" class="size-3.5 text-muted shrink-0" />
    <span class="text-sm font-medium text-highlighted flex-1">{{ tag.name }}</span>
    <UBadge v-if="count !== undefined" :label="String(count)" variant="subtle" color="neutral" size="xs" />
    <UButton
      v-if="deletable"
      icon="i-lucide-trash-2"
      variant="ghost"
      color="error"
      size="xs"
      aria-label="Delete tag"
      @click="$emit('delete', tag.id)"
    />
  </div>
</template>
