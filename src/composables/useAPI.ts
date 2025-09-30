// Composable for API calls

import { ref, watch } from 'vue'
import { APIService } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { config } from '../config'

const apiService = new APIService(config.apiBaseUrl)

export function useAPI() {
  const authStore = useAuthStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Update API token when auth state changes
  watch(
    () => authStore.idToken,
    (token) => {
      apiService.setToken(token)
    },
    { immediate: true }
  )

  async function withLoadingAndError<T>(
    apiCall: () => Promise<T>
  ): Promise<T | null> {
    isLoading.value = true
    error.value = null

    try {
      const result = await apiCall()
      return result
    } catch (err: any) {
      error.value = err.message || 'An error occurred'
      console.error('API call failed:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    apiService,
    isLoading,
    error,
    withLoadingAndError
  }
}