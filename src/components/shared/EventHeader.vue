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
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.event-header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.event-name {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  color: var(--text-color);
}

.event-details {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.event-detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.95rem;
}

.event-detail i {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .event-header {
    padding: 1rem;
  }

  .event-name {
    font-size: 1.5rem;
  }

  .event-details {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>