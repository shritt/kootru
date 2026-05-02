<script setup lang="ts">
defineEmits<{ close: [] }>()

const { currentUser, logout } = useAuth()

const navItems = [
  { label: 'Notes', icon: 'i-lucide-file-text', to: '/' },
  { label: 'Tags', icon: 'i-lucide-tag', to: '/tags' }
]
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Brand — h-14 matches other panel headers -->
    <div class="flex h-14 shrink-0 items-center border-b border-default px-4">
      <span class="text-base font-bold tracking-tight text-highlighted">Kooru</span>
    </div>

    <!-- Main nav -->
    <nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted hover:text-highlighted hover:bg-elevated"
        active-class="bg-elevated text-highlighted"
        @click="$emit('close')"
      >
        <UIcon :name="item.icon" class="size-4 shrink-0" />
        {{ item.label }}
      </NuxtLink>
    </nav>

    <USeparator />

    <!-- Bottom: Settings + user -->
    <div class="flex flex-col gap-1 p-3">
      <NuxtLink
        to="/settings"
        class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted hover:text-highlighted hover:bg-elevated"
        active-class="bg-elevated text-highlighted"
        @click="$emit('close')"
      >
        <UIcon name="i-lucide-settings" class="size-4 shrink-0" />
        Settings
      </NuxtLink>

      <div class="flex items-center gap-2 rounded-md px-3 py-2">
        <UAvatar
          :alt="currentUser?.email ?? 'U'"
          size="xs"
        />
        <span class="flex-1 truncate text-xs text-muted">{{ currentUser?.email }}</span>
        <UButton
          icon="i-lucide-log-out"
          variant="ghost"
          color="neutral"
          size="xs"
          aria-label="Sign out"
          @click="logout"
        />
      </div>
    </div>
  </div>
</template>
