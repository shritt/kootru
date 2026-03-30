<script setup lang="ts">
import type { FileRecord } from '~/types/pocketbase'

const props = defineProps<{ file: FileRecord }>()
defineEmits<{ delete: [id: string] }>()

const { getFileUrl } = useFiles()

const fileUrl = computed(() => getFileUrl(props.file))

const isImage = computed(() =>
  /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(props.file.name)
)

const ext = computed(() => {
  const parts = props.file.name.split('.')
  return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE'
})

const icon = computed(() => {
  if (isImage.value) return 'i-lucide-image'
  if (/\.(pdf)$/i.test(props.file.name)) return 'i-lucide-file-text'
  if (/\.(zip|tar|gz|rar)$/i.test(props.file.name)) return 'i-lucide-archive'
  if (/\.(mp4|mov|avi|mkv)$/i.test(props.file.name)) return 'i-lucide-film'
  if (/\.(mp3|wav|ogg|m4a)$/i.test(props.file.name)) return 'i-lucide-music'
  return 'i-lucide-file'
})
</script>

<template>
  <div class="group flex items-center gap-3 rounded-lg border border-default bg-background px-3 py-2.5 hover:bg-elevated transition-colors">
    <!-- Thumbnail or icon -->
    <div class="size-9 shrink-0 rounded overflow-hidden flex items-center justify-center bg-elevated">
      <img
        v-if="isImage"
        :src="fileUrl"
        :alt="file.name"
        class="size-full object-cover"
      />
      <UIcon v-else :name="icon" class="size-5 text-muted" />
    </div>

    <!-- Name + ext -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-highlighted truncate">{{ file.name }}</p>
      <p class="text-xs text-muted">{{ ext }}</p>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <UButton
        icon="i-lucide-download"
        variant="ghost"
        color="neutral"
        size="xs"
        :to="fileUrl"
        target="_blank"
        aria-label="Download"
        external
      />
      <UButton
        icon="i-lucide-trash-2"
        variant="ghost"
        color="error"
        size="xs"
        aria-label="Delete file"
        @click="$emit('delete', file.id)"
      />
    </div>
  </div>
</template>
