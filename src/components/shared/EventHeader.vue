<template>
  <div class="event-header">
    <div class="event-header-content">
      <h1 class="event-name">{{ event.name }}</h1>
      <div class="event-details">
        <div class="event-detail">
          <i class="pi pi-calendar"></i>
          <span>{{ formatDate(event.date) }}</span>
        </div>
        <div class="event-detail">
          <i class="pi pi-clock"></i>
          <span>Curfew: {{ event.curfew }}</span>
        </div>
      </div>
      <Message v-if="event.signups_enabled === false" severity="warn" :closable="false">
        Signups are currently paused
      </Message>
    </div>
  </div>
</template>

<script setup lang="ts">
import Message from 'primevue/message'
import type { Event } from '../../types/api'
import { formatDate } from '../../utils/time'

interface Props {
  event: Event
}

defineProps<Props>()
</script>

<style scoped>
.event-header {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px 16px 0 0;
  padding: 2rem 1.5rem 2rem 4rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
}

.event-header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.event-name {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(0, 206, 144, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 1rem 0;
  letter-spacing: -0.02em;
  position: relative;
  padding-bottom: 0.75rem;
}

.event-name::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, rgba(0, 206, 144, 1) 0%, rgba(0, 255, 163, 1) 100%);
  border-radius: 2px;
}

.event-details {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.event-detail {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.85);
  font-size: 1rem;
}

.event-detail i {
  font-size: 1.25rem;
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 8px rgba(0, 206, 144, 0.3));
}

@media (max-width: 768px) {
  .event-header {
    padding: 1.5rem 1rem 1.5rem 3.5rem;
    border-radius: 0;
  }

  .event-name {
    font-size: 2rem;
  }

  .event-name::after {
    width: 60px;
  }

  .event-details {
    gap: 1rem;
  }
}
</style>