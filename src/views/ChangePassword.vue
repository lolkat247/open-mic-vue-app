<template>
  <div class="change-password-view">
    <div class="change-container">
      <div class="change-card">
        <div class="change-header">
          <Button
            icon="pi pi-arrow-left"
            text
            rounded
            @click="goBack"
            aria-label="Go back"
            class="back-button"
          />
          <div class="header-content">
            <i class="pi pi-lock header-icon"></i>
            <h1>Change Password</h1>
            <p class="subtitle">Update your account password</p>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="change-form">
          <div class="form-field">
            <label for="currentPassword" class="required">Current Password</label>
            <Password
              id="currentPassword"
              v-model="formData.currentPassword"
              :class="{ 'p-invalid': errors.currentPassword }"
              :feedback="false"
              toggleMask
              placeholder="Enter your current password"
              autocomplete="current-password"
              @blur="validateField('currentPassword')"
              autofocus
              class="w-full"
            />
            <small v-if="errors.currentPassword" class="p-error">{{ errors.currentPassword }}</small>
            <small v-else class="help-text">Enter your current password to verify it's you</small>
          </div>

          <div class="divider-section">
            <div class="divider-line"></div>
          </div>

          <div class="form-field">
            <label for="newPassword" class="required">New Password</label>
            <Password
              id="newPassword"
              v-model="formData.newPassword"
              :class="{ 'p-invalid': errors.newPassword }"
              toggleMask
              placeholder="Create a new strong password"
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
              placeholder="Re-enter your new password"
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
              label="Cancel"
              text
              @click="goBack"
              :disabled="isLoading"
              class="cancel-button"
            />
            <Button
              type="submit"
              label="Change Password"
              icon="pi pi-check"
              :loading="isLoading"
              :disabled="!isFormValid || isLoading"
              class="submit-button"
            />
          </div>
        </form>

        <div class="security-tip">
          <i class="pi pi-shield tip-icon"></i>
          <div class="tip-content">
            <strong>Security Tip:</strong>
            <p>Use a unique password that you don't use for other accounts. Consider using a password manager.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '../stores/auth'
import { validatePassword } from '../utils/validation'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const formData = reactive({
  currentPassword: '',
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
    formData.currentPassword.length > 0 &&
    formData.newPassword.length >= 8 &&
    requirements.value.uppercase &&
    requirements.value.lowercase &&
    requirements.value.number &&
    formData.newPassword === formData.confirmPassword &&
    formData.newPassword !== formData.currentPassword
  )
})

watch(() => formData.newPassword, () => {
  // Re-validate confirm password when password changes
  if (formData.confirmPassword) {
    validateField('confirmPassword')
  }
  // Check if new password is same as current
  if (formData.currentPassword && formData.newPassword === formData.currentPassword) {
    errors.newPassword = 'New password must be different from current password'
  }
})

function validateField(field: string) {
  delete errors[field]

  switch (field) {
    case 'currentPassword':
      if (!formData.currentPassword) {
        errors.currentPassword = 'Current password is required'
      }
      break
    case 'newPassword':
      const passwordValidation = validatePassword(formData.newPassword)
      if (!passwordValidation.valid) {
        errors.newPassword = passwordValidation.message || 'Invalid password'
      } else if (formData.currentPassword && formData.newPassword === formData.currentPassword) {
        errors.newPassword = 'New password must be different from current password'
      }
      break
    case 'confirmPassword':
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your new password'
      } else if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
      break
  }
}

function validateAll(): boolean {
  validateField('currentPassword')
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
    await authStore.changePassword(
      formData.currentPassword,
      formData.newPassword
    )

    toast.add({
      severity: 'success',
      summary: 'Password Changed',
      detail: 'Your password has been updated successfully',
      life: 5000
    })

    // Clear form
    formData.currentPassword = ''
    formData.newPassword = ''
    formData.confirmPassword = ''

    // Go back to dashboard after 1 second
    setTimeout(() => {
      goBack()
    }, 1000)
  } catch (err: any) {
    console.error('Change password failed:', err)

    // User-friendly error messages
    let errorMessage = 'Failed to change password. Please try again.'

    if (err.message?.includes('Incorrect username or password') ||
        err.message?.includes('current password')) {
      errorMessage = 'Current password is incorrect'
    } else if (err.message?.includes('Limit exceeded')) {
      errorMessage = 'Too many attempts. Please try again later.'
    } else if (err.message?.includes('NotAuthorizedException')) {
      errorMessage = 'You are not authorized. Please sign in again.'
      // Redirect to login after showing error
      setTimeout(() => {
        router.push({ name: 'admin-login' })
      }, 2000)
    } else if (err.message) {
      errorMessage = err.message
    }

    error.value = errorMessage

    toast.add({
      severity: 'error',
      summary: 'Change Failed',
      detail: errorMessage,
      life: 5000
    })
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'admin-dashboard' })
}
</script>

<style scoped>
.change-password-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
  padding: 2rem;
}

.change-container {
  width: 100%;
  max-width: 550px;
}

.change-card {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  position: relative;
}

.back-button {
  position: absolute;
  top: 1rem;
  left: 1rem;
}

.change-header {
  text-align: center;
  margin-bottom: 2.5rem;
  padding-top: 1rem;
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.header-icon {
  font-size: 3.5rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.change-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.subtitle {
  font-size: 1rem;
  color: var(--text-color-secondary);
  margin: 0;
}

.change-form {
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

.divider-section {
  margin: 0.5rem 0;
}

.divider-line {
  border-bottom: 1px solid var(--surface-border);
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
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-button {
  flex: 1;
}

.submit-button {
  flex: 2;
}

.security-tip {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1.25rem;
  background: var(--blue-50);
  border-left: 4px solid var(--blue-500);
  border-radius: 8px;
}

.tip-icon {
  font-size: 1.5rem;
  color: var(--blue-500);
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.tip-content {
  flex: 1;
}

.tip-content strong {
  color: var(--blue-700);
  display: block;
  margin-bottom: 0.5rem;
}

.tip-content p {
  margin: 0;
  color: var(--blue-700);
  font-size: 0.9rem;
  line-height: 1.5;
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
  .change-password-view {
    padding: 1rem;
  }

  .change-card {
    padding: 2rem;
  }

  .header-icon {
    font-size: 3rem;
  }

  .change-header h1 {
    font-size: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-button,
  .submit-button {
    flex: 1;
  }

  .security-tip {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
