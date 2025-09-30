<template>
  <div class="loading-state">
    <ProgressSpinner />
    <p v-if="message" class="loading-message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import ProgressSpinner from 'primevue/progressspinner'

interface Props {
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: 'Loading...'
})
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 200px;
}

.loading-message {
  margin-top: 1rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}
</style>