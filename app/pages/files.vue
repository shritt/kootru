<script setup lang="ts">
definePageMeta({ layout: 'app', middleware: 'auth' })

const { files, fetchFiles, uploadFile, deleteFile } = useFiles()
const toast = useToast()

const uploading = ref(false)
const fileInputRef = ref<HTMLInputElement>()

onMounted(fetchFiles)

const handleFileSelect = async (e: Event) => {
  const selected = (e.target as HTMLInputElement).files
  if (!selected?.length) return

  uploading.value = true
  try {
    await Promise.all(Array.from(selected).map(f => uploadFile(f)))
    toast.add({ title: `${selected.length} file(s) uploaded`, color: 'success' })
  }
  catch {
    toast.add({ title: 'Upload failed', color: 'error' })
  }
  finally {
    uploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

const handleDelete = async (id: string) => {
  try {
    await deleteFile(id)
    toast.add({ title: 'File deleted', color: 'neutral' })
  }
  catch {
    toast.add({ title: 'Failed to delete file', color: 'error' })
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col overflow-y-auto">
    <div class="mx-auto w-full max-w-2xl px-6 py-8 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-highlighted">Files</h1>
          <p class="text-sm text-muted mt-1">All files attached to your notes.</p>
        </div>
        <div>
          <input
            ref="fileInputRef"
            type="file"
            multiple
            class="hidden"
            @change="handleFileSelect"
          />
          <UButton
            icon="i-lucide-upload"
            label="Upload"
            :loading="uploading"
            @click="fileInputRef?.click()"
          />
        </div>
      </div>

      <!-- List -->
      <div class="space-y-2">
        <p v-if="files.length === 0" class="text-sm text-muted py-6 text-center">
          No files yet. Attach files to notes or upload directly.
        </p>
        <FilesFileItem
          v-for="file in files"
          :key="file.id"
          :file="file"
          @delete="handleDelete"
        />
      </div>
    </div>
  </div>
</template>
