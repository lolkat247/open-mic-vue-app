<template>
  <div class="admin-login-view">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo-section">
            <i class="pi pi-shield logo-icon"></i>
            <h1>Admin Login</h1>
            <p class="subtitle">Event Organizer Access</p>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="login-form">
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
              autofocus
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
              :feedback="false"
              toggleMask
              placeholder="Your password"
              autocomplete="current-password"
              @blur="validateField('password')"
              class="w-full"
            />
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>

          <div class="form-options">
            <div class="checkbox-field">
              <Checkbox
                id="rememberMe"
                v-model="formData.rememberMe"
                :binary="true"
              />
              <label for="rememberMe" class="checkbox-label">Remember me</label>
            </div>
            <a href="#" class="forgot-link" @click.prevent="handleForgotPassword">
              Forgot password?
            </a>
          </div>

          <Message v-if="error" severity="error" :closable="true" @close="error = null">
            {{ error }}
          </Message>

          <div class="form-actions">
            <Button
              type="submit"
              label="Sign In"
              icon="pi pi-sign-in"
              size="large"
              :loading="isLoading"
              :disabled="!isFormValid || isLoading"
              class="w-full"
            />
          </div>
        </form>

        <div class="login-footer">
          <div class="divider">
            <span>or</span>
          </div>
          <p class="signup-prompt">
            Don't have an account?
            <router-link to="/admin/signup" class="signup-link">Sign Up</router-link>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '../stores/auth'
import { validateEmail } from '../utils/validation'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()

const formData = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const errors = reactive<Record<string, string>>({})
const error = ref<string | null>(null)
const isLoading = ref(false)

const isFormValid = computed(() => {
  return (
    formData.email.trim().length > 0 &&
    validateEmail(formData.email) &&
    formData.password.length > 0
  )
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
      if (!formData.password) {
        errors.password = 'Password is required'
      }
      break
  }
}

function validateAll(): boolean {
  validateField('email')
  validateField('password')
  return Object.keys(errors).length === 0
}

async function handleSubmit() {
  if (!validateAll()) {
    return
  }

  isLoading.value = true
  error.value = null

  try {
    await authStore.signIn(formData.email, formData.password)

    toast.add({
      severity: 'success',
      summary: 'Welcome Back',
      detail: 'You have successfully signed in',
      life: 3000
    })

    // Redirect to dashboard or the page they were trying to access
    const redirect = route.query.redirect as string
    router.push(redirect || { name: 'admin-dashboard' })
  } catch (err: any) {
    console.error('Login failed:', error)

    // User-friendly error messages
    let errorMessage = 'Login failed. Please try again.'

    if (err.message?.includes('User does not exist')) {
      errorMessage = 'No account found with this email'
    } else if (err.message?.includes('Incorrect username or password')) {
      errorMessage = 'Incorrect email or password'
    } else if (err.message?.includes('User is not confirmed')) {
      errorMessage = 'Please confirm your email address first'
    } else if (err.message) {
      errorMessage = err.message
    }

    error.value = errorMessage

    toast.add({
      severity: 'error',
      summary: 'Login Failed',
      detail: errorMessage,
      life: 5000
    })
  } finally {
    isLoading.value = false
  }
}

function handleForgotPassword() {
  router.push({ name: 'admin-forgot-password' })
}

function goHome() {
  router.push({ name: 'home' })
}
</script>

<style scoped>
.admin-login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1e1e1e;
  background-image: repeating-radial-gradient(circle at 0 0, transparent 0, #1e1e1e 40px), repeating-linear-gradient(rgba(0, 206, 144, 0.33), rgb(0, 206, 144));
  padding: 2rem;
  position: relative;
}

.admin-login-view::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  pointer-events: none;
  z-index: 0;
}

.login-container {
  width: 100%;
  max-width: 450px;
  position: relative;
  z-index: 1;
}

.login-card {
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

.login-header {
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

.login-header h1 {
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

.login-form {
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

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-label {
  margin: 0;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
}

.forgot-link {
  color: rgba(0, 206, 144, 1);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: rgba(0, 255, 163, 1);
  text-decoration: underline;
}

.form-actions {
  margin-top: 0.5rem;
}

.login-footer {
  margin-top: 2rem;
}

.signup-prompt {
  text-align: center;
  margin: 1rem 0;
  color: rgba(255, 255, 255, 0.7);
}

.signup-link {
  color: rgba(0, 206, 144, 1);
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.5rem;
}

.signup-link:hover {
  color: rgba(0, 255, 163, 1);
  text-decoration: underline;
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

.w-full {
  width: 100%;
}

/* Validation error styling - red and prominent */
.p-error {
  color: #ef4444 !important;
  font-weight: 700;
  font-size: 0.9rem;
  display: block;
  margin-top: 0.5rem;
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

/* Error message styling */
:deep(.p-message-error) {
  background: rgba(239, 68, 68, 0.15) !important;
  border: 1px solid rgba(239, 68, 68, 0.4) !important;
  color: rgba(254, 202, 202, 0.95) !important;
}

:deep(.p-message-error .p-message-icon) {
  color: #ef4444 !important;
}

:deep(.p-message-error .p-message-text) {
  color: rgba(254, 202, 202, 0.95) !important;
}

@media (max-width: 768px) {
  .admin-login-view {
    padding: 1rem;
  }

  .login-card {
    padding: 2rem;
  }

  .logo-icon {
    font-size: 3rem;
  }

  .login-header h1 {
    font-size: 1.75rem;
  }
}
</style>