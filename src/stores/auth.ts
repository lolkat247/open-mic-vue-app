// Pinia store for authentication state

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { AuthService } from '../services/auth'
import { config } from '../config'
import type { AuthTokens, SignUpData } from '../services/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const authService = new AuthService(config.userPoolId, config.userPoolClientId)
  const idToken = ref<string | null>(null)
  const accessToken = ref<string | null>(null)
  const userEmail = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!idToken.value)

  // Actions
  async function signIn(email: string, password: string) {
    isLoading.value = true
    error.value = null
    try {
      const tokens: AuthTokens = await authService.signIn(email, password)
      idToken.value = tokens.idToken
      accessToken.value = tokens.accessToken
      userEmail.value = email
      return tokens
    } catch (err: any) {
      error.value = err.message || 'Sign in failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function signUp(data: SignUpData) {
    isLoading.value = true
    error.value = null
    try {
      const result = await authService.signUp(data)
      return result
    } catch (err: any) {
      error.value = err.message || 'Sign up failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function confirmRegistration(email: string, code: string) {
    isLoading.value = true
    error.value = null
    try {
      await authService.confirmRegistration(email, code)
    } catch (err: any) {
      error.value = err.message || 'Confirmation failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function signOut() {
    authService.signOut()
    idToken.value = null
    accessToken.value = null
    userEmail.value = null
    error.value = null
  }

  async function restoreSession() {
    isLoading.value = true
    try {
      const session = await authService.getCurrentSession()
      if (session) {
        idToken.value = session.getIdToken().getJwtToken()
        accessToken.value = session.getAccessToken().getJwtToken()
        // Extract email from token payload
        const tokenParts = idToken.value.split('.')
        if (tokenParts[1]) {
          const payload = JSON.parse(atob(tokenParts[1]))
          userEmail.value = payload.email || null
        }
        return true
      }
      return false
    } catch (err: any) {
      console.error('Failed to restore session:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function refreshSession() {
    try {
      const session = await authService.refreshSession()
      idToken.value = session.getIdToken().getJwtToken()
      accessToken.value = session.getAccessToken().getJwtToken()
    } catch (err: any) {
      console.error('Failed to refresh session:', err)
      signOut()
      throw err
    }
  }

  async function forgotPassword(email: string) {
    isLoading.value = true
    error.value = null
    try {
      await authService.forgotPassword(email)
    } catch (err: any) {
      error.value = err.message || 'Password reset request failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function confirmPassword(email: string, code: string, newPassword: string) {
    isLoading.value = true
    error.value = null
    try {
      await authService.confirmPassword(email, code, newPassword)
    } catch (err: any) {
      error.value = err.message || 'Password reset failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    isLoading.value = true
    error.value = null
    try {
      await authService.changePassword(oldPassword, newPassword)
    } catch (err: any) {
      error.value = err.message || 'Password change failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function resendConfirmationCode(email: string) {
    isLoading.value = true
    error.value = null
    try {
      await authService.resendConfirmationCode(email)
    } catch (err: any) {
      error.value = err.message || 'Failed to resend code'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    idToken,
    accessToken,
    userEmail,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    // Actions
    signIn,
    signUp,
    confirmRegistration,
    signOut,
    restoreSession,
    refreshSession,
    forgotPassword,
    confirmPassword,
    changePassword,
    resendConfirmationCode
  }
})