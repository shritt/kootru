<script setup lang="ts">
const sidebarOpen = ref(false)
</script>

<template>
  <div class="flex h-screen bg-background overflow-hidden">
    <!-- Desktop sidebar: always visible, in normal flow -->
    <aside class="hidden lg:flex w-56 shrink-0 flex-col border-r border-default bg-background">
      <LayoutAppSidebar />
    </aside>

    <!-- Mobile backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-20 bg-black/50 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Mobile sidebar: fixed overlay, only rendered when open -->
    <aside
      v-if="sidebarOpen"
      class="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-default bg-background lg:hidden"
    >
      <LayoutAppSidebar @close="sidebarOpen = false" />
    </aside>

    <!-- Main -->
    <div class="flex flex-1 flex-col min-w-0 overflow-hidden">
      <!-- Mobile top bar -->
      <header class="flex shrink-0 items-center gap-3 border-b border-default px-4 py-3 lg:hidden">
        <UButton
          icon="i-lucide-menu"
          variant="ghost"
          color="neutral"
          size="sm"
          aria-label="Open sidebar"
          @click="sidebarOpen = true"
        />
        <span class="font-semibold text-highlighted">Kooru</span>
      </header>

      <slot />
    </div>
  </div>
</template>
