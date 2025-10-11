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
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow:
    0 4px 16px rgba(0, 206, 144, 0.15),
    0 2px 8px rgba(0, 206, 144, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

.event-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow:
    0 8px 32px rgba(0, 206, 144, 0.3),
    0 4px 16px rgba(0, 206, 144, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 206, 144, 0.4);
}

.event-card.signups-paused {
  border-left: 4px solid rgba(251, 146, 60, 1);
  box-shadow:
    0 4px 16px rgba(251, 146, 60, 0.2),
    0 2px 8px rgba(251, 146, 60, 0.15);
}

.event-card.signups-paused:hover {
  box-shadow:
    0 8px 32px rgba(251, 146, 60, 0.3),
    0 4px 16px rgba(251, 146, 60, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 1rem 0 1rem;
}

.status-badge {
  font-size: 0.85rem;
  background: rgba(0, 206, 144, 0.2) !important;
  border: 1px solid rgba(0, 206, 144, 0.4);
  font-weight: 600;
}

.event-card.signups-paused .status-badge {
  background: rgba(251, 146, 60, 0.2) !important;
  border: 1px solid rgba(251, 146, 60, 0.4);
}

.menu-button {
  margin-left: auto;
}

.event-name {
  font-size: 1.35rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #00ce90 50%, #00ffa3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.75rem 0;
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
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.meta-item i {
  font-size: 0.85rem;
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 4px rgba(0, 206, 144, 0.3));
}

.event-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding: 1rem 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  padding: 0.75rem 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}

.stat-item:hover {
  background: rgba(0, 206, 144, 0.1);
  border-color: rgba(0, 206, 144, 0.3);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 1.5rem;
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 8px rgba(0, 206, 144, 0.4));
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
}

.stat-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.manage-button {
  width: 100%;
  background: rgba(0, 206, 144, 0.15) !important;
  border: 1px solid rgba(0, 206, 144, 0.3) !important;
  color: rgba(0, 206, 144, 1) !important;
  font-weight: 600;
  transition: all 0.2s ease;
}

.manage-button:hover {
  background: rgba(0, 206, 144, 0.25) !important;
  border-color: rgba(0, 206, 144, 0.5) !important;
  box-shadow: 0 0 16px rgba(0, 206, 144, 0.3);
  transform: translateY(-1px);
}

:deep(.p-card) {
  background: transparent;
  border: none;
  box-shadow: none;
}

:deep(.p-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
  padding: 1.25rem;
}

:deep(.p-card-content) {
  flex: 1;
  padding: 0;
}

:deep(.p-card-title) {
  padding: 0;
  margin-bottom: 0.5rem;
}

:deep(.p-card-subtitle) {
  padding: 0;
  margin-bottom: 0;
}

:deep(.p-card-footer) {
  padding: 1rem 1.25rem;
  background: transparent;
}

:deep(.danger-item) {
  color: rgba(239, 68, 68, 1) !important;
}

:deep(.danger-item:hover) {
  background: rgba(239, 68, 68, 0.15) !important;
}

:deep(.p-menu) {
  background: rgba(30, 30, 30, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(16px);
}

:deep(.p-menu-item-content) {
  color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.p-menu-item:not(.p-disabled):hover .p-menu-item-content) {
  background: rgba(0, 206, 144, 0.2) !important;
}

@media (max-width: 768px) {
  .event-name {
    font-size: 1.15rem;
  }

  .event-stats {
    gap: 0.5rem;
  }

  .stat-item {
    padding: 0.5rem 0.25rem;
  }

  .stat-icon {
    font-size: 1.25rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.65rem;
  }
}
</style>