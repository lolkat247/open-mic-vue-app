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
  background-color: #1e1e1e;
  background-image: repeating-radial-gradient(circle at 0 0, transparent 0, #1e1e1e 40px), repeating-linear-gradient(rgba(0, 206, 144, 0.33), rgb(0, 206, 144));
  padding: 2rem;
  position: relative;
}

.admin-signup-view::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  pointer-events: none;
  z-index: 0;
}

.signup-container {
  width: 100%;
  max-width: 500px;
  position: relative;
  z-index: 1;
}

.signup-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  padding: 2.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px rgba(0, 206, 144, 0.2),
    0 4px 16px rgba(0, 206, 144, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
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
  color: rgba(0, 206, 144, 1);
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 0 15px rgba(0, 206, 144, 0.5));
}

.signup-header h1 {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #00ce90 50%, #00ffa3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
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
  color: rgba(255, 255, 255, 0.9);
}

.form-field label.required::after {
  content: ' *';
  color: rgba(239, 68, 68, 1);
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
  color: rgba(255, 255, 255, 0.6);
}

.password-requirements li.met {
  color: rgba(34, 197, 94, 1);
}

.password-requirements li i {
  font-size: 0.75rem;
}

.password-requirements li.met i {
  color: rgba(34, 197, 94, 1);
}

.checkbox-field {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.checkbox-label {
  margin: 0;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.85);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.divider span {
  padding: 0 1rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.login-prompt {
  text-align: center;
  margin: 1rem 0;
  color: rgba(255, 255, 255, 0.7);
}

.login-link {
  color: rgba(0, 206, 144, 1);
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.5rem;
}

.login-link:hover {
  color: rgba(0, 255, 163, 1);
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
  color: rgba(34, 197, 94, 1);
}

.success-message {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  text-align: center;
}

.verification-message {
  color: rgba(255, 255, 255, 0.7);
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

:deep(.p-inputtext) {
  background-color: rgba(0, 0, 0, 0.6) !important;
  color: rgba(255, 255, 255, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-inputtext::placeholder) {
  color: rgba(255, 255, 255, 0.5) !important;
}

:deep(.p-inputtext:focus) {
  background-color: rgba(0, 0, 0, 0.7) !important;
  border-color: rgba(0, 206, 144, 0.6) !important;
  box-shadow: 0 0 0 0.2rem rgba(0, 206, 144, 0.2) !important;
}

:deep(.p-checkbox .p-checkbox-box) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

:deep(.p-checkbox .p-checkbox-box.p-highlight) {
  background-color: rgba(0, 206, 144, 1) !important;
  border-color: rgba(0, 206, 144, 1) !important;
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
