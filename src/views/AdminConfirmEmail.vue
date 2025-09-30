<template>
  <div class="confirm-email-view">
    <div class="confirm-container">
      <div class="confirm-card">
        <div class="confirm-header">
          <div class="logo-section">
            <i class="pi pi-envelope logo-icon"></i>
            <h1>Verify Your Email</h1>
            <p class="subtitle">Enter the verification code we sent to</p>
            <p class="email-display">{{ email }}</p>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="confirm-form">
          <div class="form-field">
            <label for="code" class="required">Verification Code</label>
            <InputText
              id="code"
              v-model="formData.code"
              placeholder="Enter 6-digit code"
              :class="{ 'p-invalid': errors.code }"
              @blur="validateField('code')"
              @input="handleCodeInput"
              maxlength="6"
              autofocus
              class="w-full code-input"
            />
            <small v-if="errors.code" class="p-error">{{ errors.code }}</small>
            <small v-else class="help-text">Check your email for the verification code</small>
          </div>

          <Message v-if="error" severity="error" :closable="true" @close="error = null">
            {{ error }}
          </Message>

          <Message v-if="successMessage" severity="success" :closable="false">
            {{ successMessage }}
          </Message>

          <div class="form-actions">
            <Button
              type="submit"
              label="Verify Email"
              icon="pi pi-check"
              size="large"
              :loading="isLoading"
              :disabled="!isFormValid || isLoading"
              class="w-full"
            />
          </div>

          <div class="resend-section">
            <p class="resend-text">Didn't receive the code?</p>
            <Button
              label="Resend Code"
              icon="pi pi-refresh"
              text
              :loading="isResending"
              :disabled="isResending || resendCooldown > 0"
              @click="handleResendCode"
              class="resend-button"
            />
            <small v-if="resendCooldown > 0" class="cooldown-text">
              Resend available in {{ resendCooldown }}s
            </small>
          </div>
        </form>

        <div class="confirm-footer">
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()

const email = ref((route.query.email as string) || '')
const formData = reactive({
  code: ''
})

const errors = reactive<Record<string, string>>({})
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const isLoading = ref(false)
const isResending = ref(false)
const resendCooldown = ref(0)
let cooldownInterval: number | null = null

const isFormValid = computed(() => {
  return formData.code.length === 6 && /^\d{6}$/.test(formData.code)
})

onMounted(() => {
  if (!email.value) {
    toast.add({
      severity: 'warn',
      summary: 'Email Required',
      detail: 'Please provide your email address',
      life: 3000
    })
    router.push({ name: 'admin-signup' })
  }
})

onUnmounted(() => {
  if (cooldownInterval !== null) {
    clearInterval(cooldownInterval)
  }
})

function handleCodeInput(event: Event) {
  const input = event.target as HTMLInputElement
  // Only allow digits
  formData.code = input.value.replace(/\D/g, '')
}

function validateField(field: string) {
  delete errors[field]

  switch (field) {
    case 'code':
      if (!formData.code) {
        errors.code = 'Verification code is required'
      } else if (formData.code.length !== 6) {
        errors.code = 'Code must be 6 digits'
      } else if (!/^\d{6}$/.test(formData.code)) {
        errors.code = 'Code must contain only numbers'
      }
      break
  }
}

function validateAll(): boolean {
  validateField('code')
  return Object.keys(errors).length === 0
}

async function handleSubmit() {
  if (!validateAll() || !email.value) {
    return
  }

  isLoading.value = true
  error.value = null
  successMessage.value = null

  try {
    await authStore.confirmRegistration(email.value, formData.code)

    successMessage.value = 'Email verified successfully! Redirecting to login...'

    toast.add({
      severity: 'success',
      summary: 'Email Verified',
      detail: 'Your account has been verified. Please sign in.',
      life: 5000
    })

    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push({ name: 'admin-login' })
    }, 2000)
  } catch (err: any) {
    console.error('Verification failed:', err)

    // User-friendly error messages
    let errorMessage = 'Verification failed. Please try again.'

    if (err.message?.includes('Code mismatch') || err.message?.includes('Invalid code')) {
      errorMessage = 'Invalid verification code. Please check and try again.'
    } else if (err.message?.includes('Expired code')) {
      errorMessage = 'Verification code has expired. Please request a new one.'
    } else if (err.message?.includes('User cannot be confirmed')) {
      errorMessage = 'This account has already been verified. Please sign in.'
    } else if (err.message) {
      errorMessage = err.message
    }

    error.value = errorMessage

    toast.add({
      severity: 'error',
      summary: 'Verification Failed',
      detail: errorMessage,
      life: 5000
    })
  } finally {
    isLoading.value = false
  }
}

async function handleResendCode() {
  if (!email.value || resendCooldown.value > 0) {
    return
  }

  isResending.value = true
  error.value = null

  try {
    await authStore.resendConfirmationCode(email.value)

    toast.add({
      severity: 'success',
      summary: 'Code Sent',
      detail: 'A new verification code has been sent to your email',
      life: 5000
    })

    // Start 60 second cooldown
    resendCooldown.value = 60
    cooldownInterval = window.setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0 && cooldownInterval !== null) {
        clearInterval(cooldownInterval)
        cooldownInterval = null
      }
    }, 1000)
  } catch (err: any) {
    console.error('Resend failed:', err)

    let errorMessage = 'Failed to resend code. Please try again.'

    if (err.message?.includes('Limit exceeded')) {
      errorMessage = 'Too many attempts. Please wait before requesting another code.'
    } else if (err.message) {
      errorMessage = err.message
    }

    toast.add({
      severity: 'error',
      summary: 'Resend Failed',
      detail: errorMessage,
      life: 5000
    })
  } finally {
    isResending.value = false
  }
}

function goToLogin() {
  router.push({ name: 'admin-login' })
}
</script>

<style scoped>
.confirm-email-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
  padding: 2rem;
}

.confirm-container {
  width: 100%;
  max-width: 450px;
}

.confirm-card {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.confirm-header {
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

.confirm-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.subtitle {
  font-size: 0.95rem;
  color: var(--text-color-secondary);
  margin: 0.5rem 0 0 0;
}

.email-display {
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0.25rem 0 0 0;
}

.confirm-form {
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

.code-input {
  font-size: 1.5rem;
  text-align: center;
  letter-spacing: 0.5rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.help-text {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  text-align: center;
}

.form-actions {
  margin-top: 0.5rem;
}

.resend-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0;
  border-top: 1px solid var(--surface-border);
}

.resend-text {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.resend-button {
  font-weight: 600;
}

.cooldown-text {
  color: var(--orange-500);
  font-size: 0.85rem;
  font-weight: 500;
}

.confirm-footer {
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
  .confirm-email-view {
    padding: 1rem;
  }

  .confirm-card {
    padding: 2rem;
  }

  .logo-icon {
    font-size: 3rem;
  }

  .confirm-header h1 {
    font-size: 1.75rem;
  }

  .code-input {
    font-size: 1.25rem;
  }
}
</style>
