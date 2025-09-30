<template>
  <div class="home-view">
    <div class="home-container">
      <div class="home-header">
        <i class="pi pi-microphone home-icon"></i>
        <h1>Open Mic Queue Manager</h1>
        <p class="subtitle">Real-time open mic performance queue management</p>
      </div>

      <div class="action-cards">
        <Card class="action-card">
          <template #header>
            <i class="pi pi-users card-icon"></i>
          </template>
          <template #title>View Queue</template>
          <template #content>
            <p>See who's performing and when you're up</p>
          </template>
          <template #footer>
            <div class="card-footer">
              <InputText
                v-model="eventIdInput"
                placeholder="Enter Event ID"
                class="w-full"
              />
              <Button
                label="View Queue"
                icon="pi pi-eye"
                @click="goToQueue"
                :disabled="!eventIdInput"
                class="w-full"
              />
            </div>
          </template>
        </Card>

        <Card class="action-card">
          <template #header>
            <i class="pi pi-user-plus card-icon"></i>
          </template>
          <template #title>Sign Up</template>
          <template #content>
            <p>Add yourself to the performance queue</p>
          </template>
          <template #footer>
            <div class="card-footer">
              <InputText
                v-model="signupEventId"
                placeholder="Enter Event ID"
                class="w-full"
              />
              <Button
                label="Sign Up"
                icon="pi pi-user-plus"
                @click="goToSignup"
                :disabled="!signupEventId"
                class="w-full"
              />
            </div>
          </template>
        </Card>

        <Card class="action-card">
          <template #header>
            <i class="pi pi-cog card-icon"></i>
          </template>
          <template #title>Admin</template>
          <template #content>
            <p>Manage events and control the queue</p>
          </template>
          <template #footer>
            <Button
              label="Admin Login"
              icon="pi pi-sign-in"
              @click="goToAdmin"
              class="w-full"
            />
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

const router = useRouter()
const eventIdInput = ref('')
const signupEventId = ref('')

function goToQueue() {
  if (eventIdInput.value) {
    router.push({ name: 'public-queue', params: { eventId: eventIdInput.value } })
  }
}

function goToSignup() {
  if (signupEventId.value) {
    router.push({ name: 'performer-signup', params: { eventId: signupEventId.value } })
  }
}

function goToAdmin() {
  router.push({ name: 'admin-login' })
}
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
}

.home-container {
  max-width: 1200px;
  width: 100%;
}

.home-header {
  text-align: center;
  margin-bottom: 3rem;
}

.home-icon {
  font-size: 4rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.home-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  color: var(--text-color-secondary);
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.action-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 3rem;
  color: var(--primary-color);
  padding: 2rem;
  text-align: center;
  display: block;
}

.card-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.w-full {
  width: 100%;
}

@media (max-width: 768px) {
  .home-view {
    padding: 1rem;
  }

  .home-header h1 {
    font-size: 2rem;
  }

  .action-cards {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>