export default defineNuxtRouteMiddleware(() => {
  const pb = usePocketBase()
  if (pb.authStore.isValid) {
    return navigateTo('/')
  }
})
