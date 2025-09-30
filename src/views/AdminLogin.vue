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
  // TODO: Implement forgot password flow with Cognito
  toast.add({
    severity: 'info',
    summary: 'Password Reset',
    detail: 'Password reset functionality coming soon. Please contact support.',
    life: 5000
  })
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
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 450px;
}

.login-card {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
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
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.login-header h1 {
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
  color: var(--text-color);
}

.form-field label.required::after {
  content: ' *';
  color: var(--red-500);
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
  color: var(--text-color);
  font-size: 0.95rem;
}

.forgot-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: var(--primary-700);
  text-decoration: underline;
}

.form-actions {
  margin-top: 0.5rem;
}

.login-footer {
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