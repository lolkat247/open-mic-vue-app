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
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  queuedCount: number
  completedCount: number
  noShowCount: number
}

defineProps<Props>()
</script>

<style scoped>
.compact-stats {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stats-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
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
  padding: 0.875rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.stat-badge.primary {
  background: var(--primary-50);
  border-left: 4px solid var(--primary-500);
}

.stat-badge.success {
  background: var(--green-50);
  border-left: 4px solid var(--green-500);
}

.stat-badge.danger {
  background: var(--red-50);
  border-left: 4px solid var(--red-500);
}

.stat-badge i {
  font-size: 1.75rem;
  flex-shrink: 0;
}

.stat-badge.primary i {
  color: var(--primary-500);
}

.stat-badge.success i {
  color: var(--green-500);
}

.stat-badge.danger i {
  color: var(--red-500);
}

.stat-data {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
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
    border-left: none;
    border-top: 3px solid;
  }

  .stat-badge.primary {
    border-top-color: var(--primary-500);
  }

  .stat-badge.success {
    border-top-color: var(--green-500);
  }

  .stat-badge.danger {
    border-top-color: var(--red-500);
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
