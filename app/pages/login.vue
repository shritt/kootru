<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const { login } = useAuth()
const toast = useToast()

const state = reactive({
  email: '',
  password: ''
})

const loading = ref(false)

const onSubmit = async () => {
  loading.value = true
  try {
    await login(state.email, state.password)
    await navigateTo('/')
  }
  catch {
    toast.add({
      title: 'Sign in failed',
      description: 'Invalid email or password.',
      color: 'error'
    })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-base font-semibold text-highlighted">
        Sign in
      </h2>
    </template>

    <UForm :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Email" name="email" required>
        <UInput
          v-model="state.email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Password" name="password" required>
        <UInput
          v-model="state.password"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        class="w-full justify-center"
        :loading="loading"
      >
        Sign in
      </UButton>
    </UForm>
  </UCard>
</template>
