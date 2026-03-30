import type { RecordModel } from 'pocketbase'

export const useAuth = () => {
  const pb = usePocketBase()

  const currentUser = computed<RecordModel | null>(() => pb.authStore.record)
  const isAuthenticated = computed<boolean>(() => pb.authStore.isValid)

  const login = async (email: string, password: string) => {
    await pb.collection('users').authWithPassword(email, password)
  }

  const logout = () => {
    pb.authStore.clear()
    navigateTo('/login')
  }

  return { currentUser, isAuthenticated, login, logout }
}
