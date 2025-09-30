<template>
  <div class="admin-signup-view">
    <div class="signup-container">
      <div class="signup-card">
        <div class="signup-header">
          <div class="logo-section">
            <i class="pi pi-user-plus logo-icon"></i>
            <h1>Admin Sign Up</h1>
            <p class="subtitle">Create Event Organizer Account</p>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="signup-form">
          <div class="form-field">
            <label for="name">Name (Optional)</label>
            <InputText
              id="name"
              v-model="formData.name"
              placeholder="Your full name"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="email" class="required">Email</label>
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
            <label for="password" class="required">Password</label>
            <Password
              id="password"
              v-model="formData.password"
              :class="{ 'p-invalid': errors.password }"
              toggleMask
              placeholder="Create a strong password"
              autocomplete="new-password"
              @blur="validateField('password')"
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
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>

          <div class="form-field">
            <label for="confirmPassword" class="required">Confirm Password</label>
            <Password
              id="confirmPassword"
              v-model="formData.confirmPassword"
              :class="{ 'p-invalid': errors.confirmPassword }"
              :feedback="false"
              toggleMask
              placeholder="Re-enter your password"
              autocomplete="new-password"
              @blur="validateField('confirmPassword')"
              class="w-full"
            />
            <small v-if="errors.confirmPassword" class="p-error">{{ errors.confirmPassword }}</small>
          </div>

          <div class="checkbox-field">
            <Checkbox
              id="acceptTerms"
              v-model="formData.acceptTerms"
              :binary="true"
              :class="{ 'p-invalid': errors.acceptTerms }"
            />
            <label for="acceptTerms" class="checkbox-label">
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>
          <small v-if="errors.acceptTerms" class="p-error">{{ errors.acceptTerms }}</small>

          <Message v-if="error" severity="error" :closable="true" @close="error = null">
            {{ error }}
          </Message>

          <div class="form-actions">
            <Button
              type="submit"
              label="Create Account"
              icon="pi pi-user-plus"
              size="large"
              :loading="isLoading"
              :disabled="!isFormValid || isLoading"
              class="w-full"
            />
          </div>
        </form>

        <div class="signup-footer">
          <div class="divider">
            <span>or</span>
          </div>
          <p class="login-prompt">
            Already have an account?
            <router-link to="/admin/login" class="login-link">Sign In</router-link>
          </p>
          <Button
            label="Back to Home"
            icon="pi pi-home"
            text
            @click="goHome"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <!-- Success Dialog -->
    <Dialog
      v-model:visible="showSuccessDialog"
      modal
      :closable="false"
      header="Account Created!"
      :style="{ width: '90vw', maxWidth: '500px' }"
    >
      <div class="success-content">
        <i class="pi pi-check-circle success-icon"></i>
        <p class="success-message">
          Your admin account has been created successfully!
        </p>
        <p class="verification-message">
          We've sent a verification code to <strong>{{ formData.email }}</strong>.
          Please check your email and verify your account to continue.
        </p>
      </div>
      <template #footer>
        <Button
          label="Go to Verification"
          icon="pi pi-arrow-right"
          @click="goToVerification"
          autofocus
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import { useAuthStore } from '../stores/auth'
import { validateEmail, validatePassword } from '../utils/validation'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const formData = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const errors = reactive<Record<string, string>>({})
const error = ref<string | null>(null)
const isLoading = ref(false)
const showSuccessDialog = ref(false)

const requirements = computed(() => ({
  length: formData.password.length >= 8,
  uppercase: /[A-Z]/.test(formData.password),
  lowercase: /[a-z]/.test(formData.password),
  number: /\d/.test(formData.password)
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
    formData.password.length >= 8 &&
    requirements.value.uppercase &&
    requirements.value.lowercase &&
    requirements.value.number &&
    formData.password === formData.confirmPassword &&
    formData.acceptTerms
  )
})

watch(() => formData.password, () => {
  // Re-validate confirm password when password changes
  if (formData.confirmPassword) {
    validateField('confirmPassword')
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
    case 'password':
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.valid) {
        errors.password = passwordValidation.message || 'Invalid password'
      }
      break
    case 'confirmPassword':
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
      break
    case 'acceptTerms':
      if (!formData.acceptTerms) {
        errors.acceptTerms = 'You must accept the terms to continue'
      }
      break
  }
}

function validateAll(): boolean {
  validateField('email')
  validateField('password')
  validateField('confirmPassword')
  if (!formData.acceptTerms) {
    errors.acceptTerms = 'You must accept the terms to continue'
  }
  return Object.keys(errors).length === 0
}

async function handleSubmit() {
  if (!validateAll()) {
    return
  }

  isLoading.value = true
  error.value = null

  try {
    await authStore.signUp({
      email: formData.email,
      password: formData.password,
      name: formData.name || undefined
    })

    showSuccessDialog.value = true

    toast.add({
      severity: 'success',
      summary: 'Account Created',
      detail: 'Please check your email to verify your account',
      life: 5000
    })
  } catch (err: any) {
    console.error('Signup failed:', err)

    // User-friendly error messages
    let errorMessage = 'Sign up failed. Please try again.'

    if (err.message?.includes('User already exists')) {
      errorMessage = 'An account with this email already exists'
    } else if (err.message?.includes('Invalid email')) {
      errorMessage = 'Please provide a valid email address'
    } else if (err.message?.includes('Password')) {
      errorMessage = 'Password does not meet requirements'
    } else if (err.message) {
      errorMessage = err.message
    }

    error.value = errorMessage

    toast.add({
      severity: 'error',
      summary: 'Sign Up Failed',
      detail: errorMessage,
      life: 5000
    })
  } finally {
    isLoading.value = false
  }
}

function goToVerification() {
  router.push({
    name: 'admin-confirm-email',
    query: { email: formData.email }
  })
}

function goHome() {
  router.push({ name: 'home' })
}
</script>

<style scoped>
.admin-signup-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
  padding: 2rem;
}

.signup-container {
  width: 100%;
  max-width: 500px;
}

.signup-card {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.signup-header {
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

.signup-header h1 {
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

.signup-form {
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

.checkbox-field {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.checkbox-label {
  margin: 0;
  cursor: pointer;
  color: var(--text-color);
  font-size: 0.95rem;
  line-height: 1.4;
}

.form-actions {
  margin-top: 0.5rem;
}

.signup-footer {
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

.login-prompt {
  text-align: center;
  margin: 1rem 0;
  color: var(--text-color-secondary);
}

.login-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.5rem;
}

.login-link:hover {
  text-decoration: underline;
}

.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.success-icon {
  font-size: 4rem;
  color: var(--green-500);
}

.success-message {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  text-align: center;
}

.verification-message {
  color: var(--text-color-secondary);
  margin: 0;
  text-align: center;
  line-height: 1.6;
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
  .admin-signup-view {
    padding: 1rem;
  }

  .signup-card {
    padding: 2rem;
  }

  .logo-icon {
    font-size: 3rem;
  }

  .signup-header h1 {
    font-size: 1.75rem;
  }
}
</style>
