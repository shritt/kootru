import type PocketBase from 'pocketbase'

export const usePocketBase = (): PocketBase => {
  return useNuxtApp().$pb as PocketBase
}
