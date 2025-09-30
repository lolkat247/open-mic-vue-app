<template>
  <div class="forgot-password-view">
    <div class="forgot-container">
      <div class="forgot-card">
        <div class="forgot-header">
          <div class="logo-section">
            <i class="pi pi-lock logo-icon"></i>
            <h1>Reset Password</h1>
            <p class="subtitle">Enter your email to receive a reset code</p>
          </div>
        </div>

        <form v-if="!codeSent" @submit.prevent="handleSubmit" class="forgot-form">
          <div class="form-field">
            <label for="email" class="required">Email Address</label>
            <InputText
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="your@email.com"
              :class="{ 'p-invalid': errors.email }"
              @blur="validateField('email')"
              autocomplete="username"
              autofocus
              class="w-full"
            />
            <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
            <small v-else class="help-text">We'll send a verification code to this email</small>
          </div>

          <Message v-if="error" severity="error" :closable="true" @close="error = null">
            {{ error }}
          </Message>

          <div class="form-actions">
            <Button
              type="submit"
              label="Send Reset Code"
              icon="pi pi-send"
              size="large"
              :loading="isLoading"
              :disabled="!isFormValid || isLoading"
              class="w-full"
            />
          </div>
        </form>

        <!-- Success State -->
        <div v-else class="success-state">
          <div class="success-icon-container">
            <i class="pi pi-check-circle success-icon"></i>
          </div>
          <h2 class="success-title">Check Your Email</h2>
          <p class="success-message">
            We've sent a password reset code to <strong>{{ formData.email }}</strong>
          </p>
          <p class="success-instructions">
            Please check your inbox and enter the code on the next page to reset your password.
          </p>

          <Message severity="info" :closable="false" class="info-message">
            <i class="pi pi-info-circle"></i>
            Didn't receive the email? Check your spam folder or try again in a few minutes.
          </Message>

          <div class="success-actions">
            <Button
              label="Continue to Reset Password"
              icon="pi pi-arrow-right"
              size="large"
              @click="goToResetPassword"
              class="w-full"
            />
            <Button
              label="Resend Code"
              icon="pi pi-refresh"
              text
              :loading="isResending"
              :disabled="isResending || resendCooldown > 0"
              @click="handleResendCode"
              class="w-full resend-btn"
            />
            <small v-if="resendCooldown > 0" class="cooldown-text">
              Resend available in {{ resendCooldown }}s
            </small>
          </div>
        </div>

        <div class="forgot-footer">
          <div class="divider">
            <span>or</span>
          </div>
          <Button
            label="Back to Login"
            icon="pi pi-arrow-left"
            text
            @click="goToLogin"
            class="w-full"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '../stores/auth'
import { validateEmail } from '../utils/validation'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const formData = reactive({
  email: ''
})

const errors = reactive<Record<string, string>>({})
const error = ref<string | null>(null)
const isLoading = ref(false)
const codeSent = ref(false)
const isResending = ref(false)
const resendCooldown = ref(0)
let cooldownInterval: number | null = null

const isFormValid = computed(() => {
  return formData.email.trim().length > 0 && validateEmail(formData.email)
})

onUnmounted(() => {
  if (cooldownInterval !== null) {
    clearInterval(cooldownInterval)
  }
})

function validateField(field: string) {
  delete errors[field]

  switch (field) {
    case 'email':
      if (!formData.email.trim()) {
        errors.email = 'Email is required'
      } else if (!validateEmail(formData.email)) {
        errors.email = 'Invalid email format'
      }
      break
  }
}

function validateAll(): boolean {
  validateField('email')
  return Object.keys(errors).length === 0
}

async function handleSubmit() {
  if (!validateAll()) {
    return
  }

  isLoading.value = true
  error.value = null

  try {
    await authStore.forgotPassword(formData.email)

    codeSent.value = true

    toast.add({
      severity: 'success',
      summary: 'Code Sent',
      detail: 'Password reset code has been sent to your email',
      life: 5000
    })

    // Start 60 second cooldown for resend
    startResendCooldown()
  } catch (err: any) {
    console.error('Forgot password failed:', err)

    // User-friendly error messages
    let errorMessage = 'Failed to send reset code. Please try again.'

    if (err.message?.includes('User does not exist') || err.message?.includes('not found')) {
      errorMessage = 'No account found with this email address'
    } else if (err.message?.includes('Limit exceeded')) {
      errorMessage = 'Too many attempts. Please try again later.'
    } else if (err.message) {
      errorMessage = err.message
    }

    error.value = errorMessage

    toast.add({
      severity: 'error',
      summary: 'Request Failed',
      detail: errorMessage,
      life: 5000
    })
  } finally {
    isLoading.value = false
  }
}

async function handleResendCode() {
  if (resendCooldown.value > 0) {
    return
  }

  isResending.value = true

  try {
    await authStore.forgotPassword(formData.email)

    toast.add({
      severity: 'success',
      summary: 'Code Resent',
      detail: 'A new password reset code has been sent',
      life: 5000
    })

    startResendCooldown()
  } catch (err: any) {
    console.error('Resend failed:', err)

    toast.add({
      severity: 'error',
      summary: 'Resend Failed',
      detail: err.message || 'Failed to resend code',
      life: 5000
    })
  } finally {
    isResending.value = false
  }
}

function startResendCooldown() {
  resendCooldown.value = 60
  if (cooldownInterval !== null) {
    clearInterval(cooldownInterval)
  }
  cooldownInterval = window.setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0 && cooldownInterval !== null) {
      clearInterval(cooldownInterval)
      cooldownInterval = null
    }
  }, 1000)
}

function goToResetPassword() {
  router.push({
    name: 'admin-reset-password',
    query: { email: formData.email }
  })
}

function goToLogin() {
  router.push({ name: 'admin-login' })
}
</script>

<style scoped>
.forgot-password-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
  padding: 2rem;
}

.forgot-container {
  width: 100%;
  max-width: 450px;
}

.forgot-card {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.forgot-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.logo-icon {
  font-size: 4rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.forgot-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.subtitle {
  font-size: 1rem;
  color: var(--text-color-secondary);
  margin: 0;
}

.forgot-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  color: var(--text-color);
}

.form-field label.required::after {
  content: ' *';
  color: var(--red-500);
}

.help-text {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.form-actions {
  margin-top: 0.5rem;
}

.success-state {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  text-align: center;
}

.success-icon-container {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.success-icon {
  font-size: 4rem;
  color: var(--green-500);
}

.success-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.success-message {
  font-size: 1rem;
  color: var(--text-color);
  margin: 0;
  line-height: 1.6;
}

.success-instructions {
  font-size: 0.95rem;
  color: var(--text-color-secondary);
  margin: 0;
  line-height: 1.6;
}

.info-message {
  text-align: left;
}

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.resend-btn {
  margin-top: 0.5rem;
}

.cooldown-text {
  color: var(--orange-500);
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
}

.forgot-footer {
  margin-top: 2rem;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--surface-border);
}

.divider span {
  padding: 0 1rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.w-full {
  width: 100%;
}

@media (max-width: 768px) {
  .forgot-password-view {
    padding: 1rem;
  }

  .forgot-card {
    padding: 2rem;
  }

  .logo-icon {
    font-size: 3rem;
  }

  .forgot-header h1 {
    font-size: 1.75rem;
  }

  .success-icon {
    font-size: 3rem;
  }

  .success-title {
    font-size: 1.25rem;
  }
}
</style>
