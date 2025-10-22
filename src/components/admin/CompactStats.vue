<template>
  <div class="compact-stats">
    <h3 class="stats-title">Event Stats</h3>
    <div class="stats-row">
      <div class="stat-badge primary">
        <i class="pi pi-users"></i>
        <div class="stat-data">
          <span class="stat-number">{{ queuedCount }}</span>
          <span class="stat-label">In Queue</span>
        </div>
      </div>
      <div class="stat-badge success">
        <i class="pi pi-check-circle"></i>
        <div class="stat-data">
          <span class="stat-number">{{ completedCount }}</span>
          <span class="stat-label">Completed</span>
        </div>
      </div>
      <div class="stat-badge danger">
        <i class="pi pi-times-circle"></i>
        <div class="stat-data">
          <span class="stat-number">{{ noShowCount }}</span>
          <span class="stat-label">No Shows</span>
        </div>
      </div>
      <div class="stat-badge info">
        <i class="pi pi-id-card"></i>
        <div class="stat-data">
          <span class="stat-number">{{ checkinCount }}</span>
          <span class="stat-label">Check-ins</span>
        </div>
        <Button
          icon="pi pi-download"
          text
          rounded
          size="small"
          @click="$emit('download-checkins')"
          v-tooltip.top="'Download check-ins CSV'"
          class="download-button"
          :disabled="checkinCount === 0"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'

interface Props {
  queuedCount: number
  completedCount: number
  noShowCount: number
  checkinCount: number
}

defineProps<Props>()

defineEmits<{
  'download-checkins': []
}>()
</script>

<style scoped>
.compact-stats {
  background: transparent;
  border-radius: 12px;
  padding: 0;
}

.stats-title {
  font-size: 1rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #00ce90 50%, #00ffa3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 1rem 0;
}

.stats-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.stat-badge.primary {
  border: 1px solid rgba(0, 206, 144, 0.5);
  border-left: 4px solid rgba(0, 206, 144, 1);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 12px rgba(0, 206, 144, 0.2);
}

.stat-badge.success {
  border: 1px solid rgba(34, 197, 94, 0.5);
  border-left: 4px solid rgba(34, 197, 94, 1);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 12px rgba(34, 197, 94, 0.2);
}

.stat-badge.danger {
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-left: 4px solid rgba(239, 68, 68, 1);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 12px rgba(239, 68, 68, 0.2);
}

.stat-badge.info {
  border: 1px solid rgba(14, 165, 233, 0.5);
  border-left: 4px solid rgba(14, 165, 233, 1);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 12px rgba(14, 165, 233, 0.2);
}

.stat-badge i {
  font-size: 1.75rem;
  flex-shrink: 0;
}

.stat-badge.primary i {
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 8px rgba(0, 206, 144, 0.5));
}

.stat-badge.success i {
  color: rgba(34, 197, 94, 1);
  filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.5));
}

.stat-badge.danger i {
  color: rgba(239, 68, 68, 1);
  filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.5));
}

.stat-badge.info i {
  color: rgba(14, 165, 233, 1);
  filter: drop-shadow(0 0 8px rgba(14, 165, 233, 0.5));
}

.stat-data {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.download-button {
  flex-shrink: 0;
  color: rgba(14, 165, 233, 1) !important;
  transition: all 0.2s ease;
}

.download-button:hover:not(:disabled) {
  background: rgba(14, 165, 233, 0.15) !important;
  transform: scale(1.1);
}

.download-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.stat-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .stats-row {
    flex-direction: row;
  }

  .stat-badge {
    flex: 1;
    flex-direction: column;
    text-align: center;
    padding: 0.75rem;
    border-left: 1px solid;
    border-top: 3px solid;
  }

  .stat-badge.primary {
    border-top-color: rgba(0, 206, 144, 1);
    border-left-color: rgba(0, 206, 144, 0.5);
  }

  .stat-badge.success {
    border-top-color: rgba(34, 197, 94, 1);
    border-left-color: rgba(34, 197, 94, 0.5);
  }

  .stat-badge.danger {
    border-top-color: rgba(239, 68, 68, 1);
    border-left-color: rgba(239, 68, 68, 0.5);
  }

  .stat-badge.info {
    border-top-color: rgba(14, 165, 233, 1);
    border-left-color: rgba(14, 165, 233, 0.5);
  }

  .stat-badge i {
    font-size: 1.5rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }
}
</style>
