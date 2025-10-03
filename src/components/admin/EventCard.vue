<template>
  <Card class="event-card" :class="{ 'signups-paused': event.signups_enabled === false }" @click="handleCardClick">
    <template #header>
      <div class="card-header">
        <Badge
          :value="signupStatusLabel"
          :severity="signupStatusSeverity"
          class="status-badge"
        />
        <Button
          icon="pi pi-ellipsis-v"
          text
          rounded
          size="small"
          @click.stop="toggleMenu"
          aria-label="Options"
          class="menu-button"
        />
        <Menu ref="menu" :model="menuItems" :popup="true" />
      </div>
    </template>

    <template #title>
      <h3 class="event-name">{{ event.name }}</h3>
    </template>

    <template #subtitle>
      <div class="event-meta">
        <div class="meta-item">
          <i class="pi pi-calendar"></i>
          <span>{{ formatDate(event.date) }}</span>
        </div>
        <div class="meta-item">
          <i class="pi pi-clock"></i>
          <span>Curfew: {{ event.curfew }}</span>
        </div>
        <div v-if="event.event_code" class="meta-item">
          <i class="pi pi-key"></i>
          <span>Code: {{ event.event_code }}</span>
        </div>
      </div>
    </template>

    <template #content>
      <div class="event-stats">
        <div class="stat-item">
          <i class="pi pi-users stat-icon"></i>
          <div class="stat-content">
            <span class="stat-value">{{ stats.queued }}</span>
            <span class="stat-label">Queued</span>
          </div>
        </div>
        <div class="stat-item">
          <i class="pi pi-play-circle stat-icon"></i>
          <div class="stat-content">
            <span class="stat-value">{{ stats.performing }}</span>
            <span class="stat-label">Performing</span>
          </div>
        </div>
        <div class="stat-item">
          <i class="pi pi-check-circle stat-icon"></i>
          <div class="stat-content">
            <span class="stat-value">{{ stats.completed }}</span>
            <span class="stat-label">Completed</span>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="card-footer">
        <Button
          label="Manage Event"
          icon="pi pi-cog"
          size="small"
          @click.stop="handleManage"
          class="manage-button"
        />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import type { Event } from '../../types/api'
import { formatDate } from '../../utils/time'

interface Props {
  event: Event
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [event: Event]
  delete: [eventId: string]
  toggleSignups: [eventId: string, enabled: boolean]
  manage: [eventId: string]
}>()

const router = useRouter()
const confirm = useConfirm()
const menu = ref()

const signupStatusLabel = computed(() => {
  return props.event.signups_enabled === false ? 'Paused' : 'Open'
})

const signupStatusSeverity = computed(() => {
  return props.event.signups_enabled === false ? 'warn' : 'success'
})

const stats = computed(() => {
  // Calculate stats from event.stats or default to 0
  const eventStats = props.event.stats || {}
  return {
    queued: eventStats.queued || 0,
    performing: eventStats.performing || 0,
    completed: eventStats.completed || 0
  }
})

const menuItems = computed(() => [
  {
    label: 'Edit Event',
    icon: 'pi pi-pencil',
    command: () => emit('edit', props.event)
  },
  {
    label: props.event.signups_enabled === false ? 'Resume Signups' : 'Pause Signups',
    icon: props.event.signups_enabled === false ? 'pi pi-play' : 'pi pi-pause',
    command: () => emit('toggleSignups', props.event.event_id, props.event.signups_enabled === false)
  },
  {
    separator: true
  },
  {
    label: 'View Public Queue',
    icon: 'pi pi-external-link',
    command: () => {
      const url = router.resolve({
        name: 'public-queue',
        params: { eventId: props.event.event_code || props.event.event_id }
      }).href
      window.open(url, '_blank')
    }
  },
  {
    label: 'View Projector',
    icon: 'pi pi-desktop',
    command: () => {
      const url = router.resolve({
        name: 'projector',
        params: { eventId: props.event.event_code || props.event.event_id }
      }).href
      window.open(url, '_blank')
    }
  },
  {
    separator: true
  },
  {
    label: 'Delete Event',
    icon: 'pi pi-trash',
    class: 'danger-item',
    command: () => confirmDelete()
  }
])

function toggleMenu(e: PointerEvent) {
  menu.value.toggle(e)
}

function handleCardClick() {
  handleManage()
}

function handleManage() {
  emit('manage', props.event.event_id)
}

function confirmDelete() {
  confirm.require({
    message: `Are you sure you want to delete "${props.event.name}"? This action cannot be undone and will remove all associated slots.`,
    header: 'Delete Event',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-danger',
    accept: () => {
      emit('delete', props.event.event_id)
    }
  })
}
</script>

<style scoped>
.event-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.event-card.signups-paused {
  border-left: 4px solid var(--orange-500);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 1rem 0 1rem;
}

.status-badge {
  font-size: 0.85rem;
}

.menu-button {
  margin-left: auto;
}

.event-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.meta-item i {
  font-size: 0.85rem;
  color: var(--primary-color);
}

.event-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.stat-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}

.manage-button {
  width: 100%;
}

:deep(.p-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.p-card-content) {
  flex: 1;
}

:deep(.danger-item) {
  color: var(--red-500);
}

:deep(.danger-item:hover) {
  background: var(--red-50);
}

@media (max-width: 768px) {
  .event-name {
    font-size: 1.1rem;
  }

  .event-stats {
    gap: 0.75rem;
  }

  .stat-icon {
    font-size: 1.25rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }
}
</style>