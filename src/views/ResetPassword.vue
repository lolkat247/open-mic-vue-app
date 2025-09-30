<template>
  <div class="reset-password-view">
    <div class="reset-container">
      <div class="reset-card">
        <div class="reset-header">
          <div class="logo-section">
            <i class="pi pi-key logo-icon"></i>
            <h1>Reset Password</h1>
            <p class="subtitle">Enter your verification code and new password</p>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="reset-form">
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
              class="w-full"
            />
            <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
          </div>

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
              class="w-full code-input"
            />
            <small v-if="errors.code" class="p-error">{{ errors.code }}</small>
            <small v-else class="help-text">Enter the code sent to your email</small>
          </div>

          <div class="form-field">
            <label for="newPassword" class="required">New Password</label>
            <Password
              id="newPassword"
              v-model="formData.newPassword"
              :class="{ 'p-invalid': errors.newPassword }"
              toggleMask
              placeholder="Create a strong password"
              autocomplete="new-password"
              @blur="validateField('newPassword')"
              :promptLabel="passwordStrength.label"
              :weakLabel="'Weak'"
              :mediumLabel="'Medium'"
              :strongLabel="'Strong'"
              class="w-full"
            >
              <template #footer>
                <ul class="password-requirements">
                  <li :class="{ met: requirements.length }">
                    <i :class="requirements.length ? 'pi pi-check' : 'pi pi-times'"></i>
                    At least 8 characters
                  </li>
                  <li :class="{ met: requirements.uppercase }">
                    <i :class="requirements.uppercase ? 'pi pi-check' : 'pi pi-times'"></i>
                    One uppercase letter
                  </li>
                  <li :class="{ met: requirements.lowercase }">
                    <i :class="requirements.lowercase ? 'pi pi-check' : 'pi pi-times'"></i>
                    One lowercase letter
                  </li>
                  <li :class="{ met: requirements.number }">
                    <i :class="requirements.number ? 'pi pi-check' : 'pi pi-times'"></i>
                    One number
                  </li>
                </ul>
              </template>
            </Password>
            <small v-if="errors.newPassword" class="p-error">{{ errors.newPassword }}</small>
          </div>

          <div class="form-field">
            <label for="confirmPassword" class="required">Confirm New Password</label>
            <Password
              id="confirmPassword"
              v-model="formData.confirmPassword"
              :class="{ 'p-invalid': errors.confirmPassword }"
              :feedback="false"
              toggleMask
              placeholder="Re-enter new password"
              autocomplete="new-password"
              @blur="validateField('confirmPassword')"
              class="w-full"
            />
            <small v-if="errors.confirmPassword" class="p-error">{{ errors.confirmPassword }}</small>
          </div>

          <Message v-if="error" severity="error" :closable="true" @close="error = null">
            {{ error }}
          </Message>

          <div class="form-actions">
            <Button
              type="submit"
              label="Reset Password"
              icon="pi pi-check"
              size="large"
              :loading="isLoading"
              :disabled="!isFormValid || isLoading"
              class="w-full"
            />
          </div>
        </form>

        <div class="reset-footer">
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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '../stores/auth'
import { validateEmail, validatePassword } from '../utils/validation'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()

const formData = reactive({
  email: (route.query.email as string) || '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

const errors = reactive<Record<string, string>>({})
const error = ref<string | null>(null)
const isLoading = ref(false)

const requirements = computed(() => ({
  length: formData.newPassword.length >= 8,
  uppercase: /[A-Z]/.test(formData.newPassword),
  lowercase: /[a-z]/.test(formData.newPassword),
  number: /\d/.test(formData.newPassword)
}))

const passwordStrength = computed(() => {
  const metCount = Object.values(requirements.value).filter(Boolean).length
  if (metCount === 4) return { label: 'Strong password', severity: 'success' }
  if (metCount >= 2) return { label: 'Medium strength', severity: 'warn' }
  return { label: 'Weak password', severity: 'error' }
})

const isFormValid = computed(() => {
  return (
    formData.email.trim().length > 0 &&
    validateEmail(formData.email) &&
    formData.code.length === 6 &&
    formData.newPassword.length >= 8 &&
    requirements.value.uppercase &&
    requirements.value.lowercase &&
    requirements.value.number &&
    formData.newPassword === formData.confirmPassword
  )
})

watch(() => formData.newPassword, () => {
  // Re-validate confirm password when password changes
  if (formData.confirmPassword) {
    validateField('confirmPassword')
  }
})

onMounted(() => {
  if (!formData.email) {
    toast.add({
      severity: 'warn',
      summary: 'Email Required',
      detail: 'Please start from the forgot password page',
      life: 3000
    })
    router.push({ name: 'admin-forgot-password' })
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
    case 'email':
      if (!formData.email.trim()) {
        errors.email = 'Email is required'
      } else if (!validateEmail(formData.email)) {
        errors.email = 'Invalid email format'
      }
      break
    case 'code':
      if (!formData.code) {
        errors.code = 'Verification code is required'
      } else if (formData.code.length !== 6) {
        errors.code = 'Code must be 6 digits'
      }
      break
    case 'newPassword':
      const passwordValidation = validatePassword(formData.newPassword)
      if (!passwordValidation.valid) {
        errors.newPassword = passwordValidation.message || 'Invalid password'
      }
      break
    case 'confirmPassword':
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
      break
  }
}

function validateAll(): boolean {
  validateField('email')
  validateField('code')
  validateField('newPassword')
  validateField('confirmPassword')
  return Object.keys(errors).length === 0
}

async function handleSubmit() {
  if (!validateAll()) {
    return
  }

  isLoading.value = true
  error.value = null

  try {
    await authStore.confirmPassword(
      formData.email,
      formData.code,
      formData.newPassword
    )

    toast.add({
      severity: 'success',
      summary: 'Password Reset',
      detail: 'Your password has been reset successfully. Please sign in.',
      life: 5000
    })

    // Redirect to login after 1 second
    setTimeout(() => {
      router.push({ name: 'admin-login' })
    }, 1000)
  } catch (err: any) {
    console.error('Reset password failed:', err)

    // User-friendly error messages
    let errorMessage = 'Failed to reset password. Please try again.'

    if (err.message?.includes('Code mismatch') || err.message?.includes('Invalid code')) {
      errorMessage = 'Invalid verification code. Please check and try again.'
    } else if (err.message?.includes('Expired code')) {
      errorMessage = 'Verification code has expired. Please request a new one.'
    } else if (err.message?.includes('User does not exist')) {
      errorMessage = 'Account not found. Please check your email address.'
    } else if (err.message?.includes('Limit exceeded')) {
      errorMessage = 'Too many attempts. Please try again later.'
    } else if (err.message) {
      errorMessage = err.message
    }

    error.value = errorMessage

    toast.add({
      severity: 'error',
      summary: 'Reset Failed',
      detail: errorMessage,
      life: 5000
    })
  } finally {
    isLoading.value = false
  }
}

function goToLogin() {
  router.push({ name: 'admin-login' })
}
</script>

<style scoped>
.reset-password-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
  padding: 2rem;
}

.reset-container {
  width: 100%;
  max-width: 500px;
}

.reset-card {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.reset-header {
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

.reset-header h1 {
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

.reset-form {
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
  font-size: 1.25rem;
  text-align: center;
  letter-spacing: 0.5rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.help-text {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.password-requirements {
  list-style: none;
  padding: 0.5rem 0 0 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.password-requirements li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.password-requirements li.met {
  color: var(--green-600);
}

.password-requirements li i {
  font-size: 0.75rem;
}

.password-requirements li.met i {
  color: var(--green-600);
}

.form-actions {
  margin-top: 0.5rem;
}

.reset-footer {
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

:deep(.p-password) {
  width: 100%;
}

:deep(.p-password input) {
  width: 100%;
}

@media (max-width: 768px) {
  .reset-password-view {
    padding: 1rem;
  }

  .reset-card {
    padding: 2rem;
  }

  .logo-icon {
    font-size: 3rem;
  }

  .reset-header h1 {
    font-size: 1.75rem;
  }

  .code-input {
    font-size: 1.1rem;
  }
}
</style>
