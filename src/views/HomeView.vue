<template>
  <div class="home-view">
    <div class="home-container">
      <div class="home-header">
        <i class="pi pi-microphone home-icon"></i>
        <h1>OpenMic.Site</h1>
        <p class="subtitle">Real-time open mic performance queue management</p>
        <span class="made-with-love">made with love~</span>
      </div>

      <p class="intro-text">You're probably here for this ↓</p>

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
                placeholder="Enter Event Code (e.g. ABC123)"
                class="w-full"
                @input="formatEventCodeInput"
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
                placeholder="Enter Event Code (e.g. ABC123)"
                class="w-full"
                @input="formatSignupEventId"
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
      </div>

      <div class="intro-section">
        <h2 class="section-title">What is OpenMic.Site?</h2>
        <p class="intro-description">
          A modern, real-time queue management system designed to make open mic nights run smoothly.
          Performers can sign up instantly, hosts can manage the queue with ease, and everyone stays
          informed with live updates.
        </p>
      </div>

      <div class="about-section">
        <h2 class="section-title">Everything You Want to Know</h2>

        <div class="info-grid">
          <div class="info-item">
            <h3><i class="pi pi-lightbulb"></i> Why use it?</h3>
            <ul>
              <li>No more asking "when am I up?"</li>
              <li>No clipboard chaos for hosts</li>
              <li>Everyone knows exactly what's happening ⚡</li>
            </ul>
          </div>

          <div class="info-item">
            <h3><i class="pi pi-users"></i> Who's it for?</h3>
            <ul>
              <li><strong>Hosts</strong> managing the night</li>
              <li><strong>Performers</strong> waiting their turn 🎤</li>
              <li><strong>Friends</strong> tracking their people 🥳</li>
            </ul>
          </div>

          <div class="info-item">
            <h3><i class="pi pi-star"></i> What's included?</h3>
            <ul>
              <li>Live updates for everyone</li>
              <li>Auto wait time estimates</li>
              <li>Password-protected slots 🔒</li>
              <li>Projector-ready display 📺</li>
              <li>Mobile-friendly interface</li>
              <li>No personal data collection</li>
            </ul>
          </div>

          <div class="info-item">
            <h3><i class="pi pi-play"></i> How it works</h3>
            <ol>
              <li>Host creates event → gets code</li>
              <li>Performers enter code → join queue</li>
              <li>Everyone watches live updates</li>
            </ol>
          </div>

          <div class="info-item info-item-highlight">
            <h3><i class="pi pi-dollar"></i> How much?</h3>
            <p class="big-answer">Free! ...for now >:)</p>
            <p class="subtext">We're in closed beta. Pricing TBD, but enjoy it while it lasts!</p>
          </div>
        </div>
      </div>

      <div class="admin-section">
        <p class="admin-intro">Admin? You're in the right place.</p>
        <Card class="admin-card">
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

      <Footer />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Footer from '../components/shared/Footer.vue'

const router = useRouter()
const eventIdInput = ref('')
const signupEventId = ref('')

function formatEventCodeInput(event: Event) {
  const input = (event.target as HTMLInputElement).value
  eventIdInput.value = input.trim().toUpperCase()
}

function formatSignupEventId(event: Event) {
  const input = (event.target as HTMLInputElement).value
  signupEventId.value = input.trim().toUpperCase()
}

function goToQueue() {
  if (eventIdInput.value) {
    router.push({ name: 'public-queue', params: { eventId: eventIdInput.value.trim() } })
  }
}

function goToSignup() {
  if (signupEventId.value) {
    router.push({ name: 'performer-signup', params: { eventId: signupEventId.value.trim() } })
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
  position: relative;
  background-color: #1e1e1e;
  background-image: repeating-radial-gradient(circle at 0 0, transparent 0, #1e1e1e 40px), repeating-linear-gradient(rgba(0, 206, 144, 0.33), rgb(0, 206, 144));
}

.home-view::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  pointer-events: none;
  z-index: 0;
}

.home-container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  width: 100%;
}

.home-header {
  text-align: center;
  margin: 0 auto 4rem auto;
  position: relative;
  padding: 3rem 6rem;
  border-radius: 60px;
  width: fit-content;
  overflow: hidden;
}

.home-header::before {
  content: '';
  position: absolute;
  inset: -2px;
  z-index: -2;
  background: linear-gradient(135deg, rgba(0, 206, 144, 0.4), rgba(0, 255, 163, 0.4));
  border-radius: 60px;
  padding: 2px;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  animation: border-glow 3s ease-in-out infinite;
}

@keyframes border-glow {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.home-header::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(0, 206, 144, 0.05) 50%,
    rgba(255, 255, 255, 0.1) 100%);
  border-radius: 60px;
  box-shadow:
    0 20px 60px rgba(0, 206, 144, 0.3),
    0 10px 30px rgba(0, 206, 144, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 206, 144, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  pointer-events: none;
}

.home-icon {
  font-size: 5rem;
  background: linear-gradient(135deg, #00ce90 0%, #00ffa3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 20px rgba(0, 206, 144, 0.5));
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    filter: drop-shadow(0 0 20px rgba(0, 206, 144, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 30px rgba(0, 206, 144, 0.8));
  }
}

.home-header h1 {
  font-size: 3.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ffffff 0%, #00ce90 50%, #00ffa3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
  text-shadow: 0 0 40px rgba(0, 206, 144, 0.3);
}

.subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
  letter-spacing: 0.05em;
}

.made-with-love {
  position: absolute;
  bottom: 1.5rem;
  right: 2rem;
  font-family: Monaco, 'Courier New', Courier, monospace;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.05em;
}

.intro-text {
  text-align: center;
  font-size: 2rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(0, 206, 144, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  margin: 2.5rem 0 3.5rem 0;
  letter-spacing: -0.01em;
  text-shadow: 0 0 30px rgba(0, 206, 144, 0.2);
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 5rem;
}

.intro-section {
  margin-top: 5rem;
  padding: 3rem 2.5rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.intro-description {
  text-align: center;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.8;
  max-width: 800px;
  margin: 0 auto;
}

.about-section {
  margin-top: 3rem;
  padding: 3rem 2.5rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(0, 206, 144, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.info-item {
  padding: 1.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.info-item h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-item h3 i {
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 8px rgba(0, 206, 144, 0.4));
}

.info-item p {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
  margin: 0;
}

.info-item .big-answer {
  font-size: 1.35rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.4;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(0, 206, 144, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.info-item .subtext {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
}

.info-item ul,
.info-item ol {
  margin: 0;
  padding-left: 1.25rem;
  color: rgba(255, 255, 255, 0.75);
}

.info-item ul li,
.info-item ol li {
  font-size: 1.05rem;
  line-height: 2;
  margin-bottom: 0.25rem;
  color: rgba(255, 255, 255, 0.85);
}

.info-item ul li strong {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 700;
}

.info-item ul li::marker,
.info-item ol li::marker {
  color: rgba(0, 206, 144, 1);
  font-weight: 700;
}

.info-item-highlight {
  border: 1px solid rgba(0, 206, 144, 0.3) !important;
  background: rgba(0, 206, 144, 0.05) !important;
  box-shadow: 0 0 20px rgba(0, 206, 144, 0.15);
}

.admin-section {
  margin-top: 4rem;
  padding-top: 3rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-intro {
  text-align: center;
  font-size: 1.8rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(0, 206, 144, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  margin-bottom: 2.5rem;
  letter-spacing: -0.01em;
  text-shadow: 0 0 30px rgba(0, 206, 144, 0.2);
}

.admin-card {
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: visible;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  max-width: 400px;
  margin: 0 auto;
}

.admin-card :deep(.p-card) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.admin-card :deep(.p-card-body) {
  background: transparent !important;
}

.admin-card :deep(.p-card-content) {
  background: transparent !important;
}

.admin-card :deep(.p-card-title) {
  color: rgba(255, 255, 255, 0.95) !important;
}

.admin-card :deep(.p-card-content p) {
  color: rgba(255, 255, 255, 0.8) !important;
}

.admin-card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.03);
  border-radius: inherit;
  box-shadow:
    0 8px 32px rgba(0, 206, 144, 0.2),
    0 4px 16px rgba(0, 206, 144, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  pointer-events: none;
}

.admin-card:hover {
  transform: translateY(-4px);
}

.admin-card:hover::before {
  box-shadow:
    0 12px 40px rgba(0, 206, 144, 0.3),
    0 6px 20px rgba(0, 206, 144, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.action-card {
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: visible;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.action-card :deep(.p-card) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.action-card :deep(.p-card-body) {
  background: transparent !important;
}

.action-card :deep(.p-card-content) {
  background: transparent !important;
}

.action-card :deep(.p-card-title) {
  color: rgba(255, 255, 255, 0.95) !important;
}

.action-card :deep(.p-card-content p) {
  color: rgba(255, 255, 255, 0.8) !important;
}

.action-card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.03);
  border-radius: inherit;
  box-shadow:
    0 8px 32px rgba(0, 206, 144, 0.2),
    0 4px 16px rgba(0, 206, 144, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  pointer-events: none;
}

.action-card:hover {
  transform: translateY(-4px);
}

.action-card:hover::before {
  box-shadow:
    0 12px 40px rgba(0, 206, 144, 0.3),
    0 6px 20px rgba(0, 206, 144, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.card-icon {
  font-size: 3rem;
  color: rgba(0, 206, 144, 1);
  padding: 2rem;
  text-align: center;
  display: block;
  filter: drop-shadow(0 0 10px rgba(0, 206, 144, 0.5));
}

.card-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.w-full {
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

@media (max-width: 768px) {
  .home-view {
    padding: 0;
    min-height: 100vh;
  }

  .home-container {
    display: flex;
    flex-direction: column;
  }

  .home-header {
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 2.5rem 2rem 3rem 2rem;
    border-radius: 0 0 30px 30px;
    margin-bottom: 0;
    max-width: 100%;
    position: relative;
    overflow: hidden;
    text-align: center;
  }

  .home-header::before {
    border-radius: 0 0 30px 30px;
    background: linear-gradient(135deg,
      rgba(0, 206, 144, 0.6) 0%,
      rgba(0, 255, 163, 0.25) 100%);
  }

  .home-header::after {
    border-radius: 0 0 30px 30px;
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    box-shadow:
      0 15px 40px rgba(0, 206, 144, 0.3),
      0 5px 15px rgba(0, 206, 144, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  .home-icon {
    font-size: 5rem;
    margin-bottom: 2rem;
    filter: drop-shadow(0 0 30px rgba(0, 206, 144, 0.7));
    align-self: center;
  }

  .home-header h1 {
    font-size: 3rem;
    font-weight: 800;
    line-height: 1.15;
    text-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
    position: relative;
    padding-bottom: 1rem;
  }

  .home-header h1::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, rgba(0, 206, 144, 1) 0%, rgba(0, 255, 163, 1) 100%);
    border-radius: 2px;
  }

  .subtitle {
    font-size: 1.05rem;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    margin-top: 1rem;
    max-width: 90%;
    line-height: 1.5;
  }

  .made-with-love {
    bottom: 1.25rem;
    right: 50%;
    transform: translateX(50%);
    font-size: 0.7rem;
  }

  .intro-text {
    font-size: 1.3rem;
    margin: 3rem 1.5rem 2rem 1.5rem;
    padding: 1rem;
  }

  .action-cards {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    margin-bottom: 3rem;
    padding: 2rem 1rem;
  }

  .admin-section {
    margin-top: 3rem;
    padding: 2rem 1rem;
  }

  .intro-section {
    margin-top: 3rem;
    padding: 2rem 1.5rem;
  }

  .about-section {
    margin-top: 2rem;
    padding: 2rem 1.5rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .intro-description {
    font-size: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .admin-intro {
    font-size: 1.4rem;
  }
}

@media (max-width: 480px) {
  .home-header {
    padding: 2rem 1.5rem 3rem 1.5rem;
    border-radius: 0 0 25px 25px;
    min-height: 75vh;
  }

  .home-header::before {
    border-radius: 0 0 25px 25px;
  }

  .home-header::after {
    border-radius: 0 0 25px 25px;
  }

  .home-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
  }

  .home-header h1 {
    font-size: 2.5rem;
  }

  .home-header h1::after {
    width: 50px;
    height: 2.5px;
  }

  .subtitle {
    font-size: 0.95rem;
  }

  .made-with-love {
    font-size: 0.65rem;
    bottom: 1rem;
  }

  .intro-text {
    font-size: 1.2rem;
    margin: 2.5rem 1rem 1.5rem 1rem;
  }

  .intro-section {
    margin-top: 2.5rem;
    padding: 1.75rem 1.25rem;
  }

  .about-section {
    margin-top: 1.5rem;
    padding: 1.75rem 1.25rem;
  }

  .section-title {
    font-size: 1.75rem;
  }

  .intro-description {
    font-size: 0.95rem;
  }

  .info-item {
    padding: 1.5rem;
  }

  .info-item h3 {
    font-size: 1.05rem;
  }

  .info-item .big-answer {
    font-size: 1.2rem;
  }

  .info-item p {
    font-size: 0.9rem;
  }

  .info-item ul li {
    font-size: 0.95rem;
  }

  .admin-intro {
    font-size: 1.2rem;
  }
}
</style>