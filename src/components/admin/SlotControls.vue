<template>
  <div class="slot-controls">
    <!-- Start Performance -->
    <Button
      v-if="canStart"
      label="Start"
      icon="pi pi-play"
      severity="success"
      :loading="isStarting"
      :disabled="isLoading || hasCurrentPerformer"
      @click="handleStart"
      class="control-button"
    />

    <!-- Complete Performance -->
    <Button
      v-if="canComplete"
      label="Complete"
      icon="pi pi-check"
      severity="info"
      :loading="isCompleting"
      :disabled="isLoading"
      @click="handleComplete"
      class="control-button"
    />

    <!-- Mark as No Show -->
    <Button
      v-if="canNoShow"
      label="No Show"
      icon="pi pi-times"
      severity="danger"
      outlined
      :loading="isNoShowing"
      :disabled="isLoading"
      @click="confirmNoShow"
      class="control-button"
    />

    <!-- Reinstate -->
    <Button
      v-if="canReinstate"
      label="Reinstate"
      icon="pi pi-refresh"
      severity="warning"
      :loading="isReinstating"
      :disabled="isLoading"
      @click="handleReinstate"
      class="control-button"
    />

    <!-- Help tooltip for disabled start -->
    <small v-if="canStart && hasCurrentPerformer" class="help-text">
      <i class="pi pi-info-circle"></i>
      Complete current performer first
    </small>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import type { Slot } from '../../types/api'

interface Props {
  slot: Slot
  hasCurrentPerformer?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasCurrentPerformer: false
})

const emit = defineEmits<{
  start: [slotId: string]
  complete: [slotId: string]
  noShow: [slotId: string]
  reinstate: [slotId: string]
}>()

const confirm = useConfirm()

const isStarting = ref(false)
const isCompleting = ref(false)
const isNoShowing = ref(false)
const isReinstating = ref(false)

const isLoading = computed(() => {
  return isStarting.value || isCompleting.value || isNoShowing.value || isReinstating.value
})

const canStart = computed(() => {
  return props.slot.status === 'queued'
})

const canComplete = computed(() => {
  return props.slot.status === 'performing'
})

const canNoShow = computed(() => {
  return props.slot.status === 'queued' || props.slot.status === 'performing'
})

const canReinstate = computed(() => {
  return props.slot.status === 'no_show' || props.slot.status === 'completed'
})

async function handleStart() {
  if (props.hasCurrentPerformer) {
    return
  }

  isStarting.value = true
  try {
    emit('start', props.slot.slot_id)
  } finally {
    // Keep loading state until parent handles it
    setTimeout(() => {
      isStarting.value = false
    }, 1000)
  }
}

async function handleComplete() {
  isCompleting.value = true
  try {
    emit('complete', props.slot.slot_id)
  } finally {
    setTimeout(() => {
      isCompleting.value = false
    }, 1000)
  }
}

function confirmNoShow() {
  confirm.require({
    message: `Mark ${props.slot.stage_name} as no-show? This will remove them from the queue.`,
    header: 'Confirm No Show',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Mark No Show',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-danger',
    accept: () => {
      handleNoShow()
    }
  })
}

async function handleNoShow() {
  isNoShowing.value = true
  try {
    emit('noShow', props.slot.slot_id)
  } finally {
    setTimeout(() => {
      isNoShowing.value = false
    }, 1000)
  }
}

async function handleReinstate() {
  isReinstating.value = true
  try {
    emit('reinstate', props.slot.slot_id)
  } finally {
    setTimeout(() => {
      isReinstating.value = false
    }, 1000)
  }
}
</script>

<style scoped>
.slot-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.control-button {
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}

.help-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.help-text i {
  color: var(--orange-500);
}

@media (max-width: 768px) {
  .slot-controls {
    flex-direction: column;
    width: 100%;
  }

  .control-button {
    width: 100%;
  }
}
</style>