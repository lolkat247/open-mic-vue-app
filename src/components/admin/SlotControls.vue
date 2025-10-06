<template>
  <div class="slot-controls">
    <!-- Mark as Up Next (queued -> up_next) -->
    <Button
      v-if="canMarkUpNext"
      label="Mark as Up Next"
      icon="pi pi-arrow-right"
      severity="info"
      :loading="isMarkingUpNext"
      :disabled="isLoading"
      @click="handleMarkUpNext"
      v-tooltip.top="'Mark this performer as up next in queue'"
      class="control-button"
    />

    <!-- Call to Stage (up_next -> setting_up) -->
    <Button
      v-if="canCallToStage"
      label="Call to Stage"
      icon="pi pi-microphone"
      severity="warning"
      :loading="isCallingToStage"
      :disabled="isLoading"
      @click="handleCallToStage"
      v-tooltip.top="'Call this performer to the stage to set up'"
      class="control-button"
    />

    <!-- Start Performance (setting_up -> performing) -->
    <Button
      v-if="canStart"
      label="Start Performance"
      icon="pi pi-play"
      severity="success"
      :loading="isStarting"
      :disabled="isLoading || hasCurrentPerformer"
      @click="handleStart"
      v-tooltip.top="hasCurrentPerformer ? 'Complete current performer first' : 'Start this performer\'s set'"
      class="control-button"
    />

    <!-- Complete Performance -->
    <Button
      v-if="canComplete"
      label="Finish Performance"
      icon="pi pi-check"
      severity="info"
      :loading="isCompleting"
      :disabled="isLoading"
      @click="handleComplete"
      v-tooltip.top="'Mark this performance as completed'"
      class="control-button"
    />

    <!-- Mark as No Show -->
    <Button
      v-if="canNoShow"
      label="Mark No Show"
      icon="pi pi-times"
      severity="danger"
      outlined
      :loading="isNoShowing"
      :disabled="isLoading"
      @click="confirmNoShow"
      v-tooltip.top="'Remove from queue (performer didn\'t show up)'"
      class="control-button"
    />

    <!-- Reinstate -->
    <Button
      v-if="canReinstate"
      label="Add Back to Queue"
      icon="pi pi-refresh"
      severity="warning"
      :loading="isReinstating"
      :disabled="isLoading"
      @click="handleReinstate"
      v-tooltip.top="'Restore this performer to the queue'"
      class="control-button"
    />
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
  'mark-up-next': [slotId: string]
  'call-to-stage': [slotId: string]
  start: [slotId: string]
  complete: [slotId: string]
  noShow: [slotId: string]
  reinstate: [slotId: string]
}>()

const confirm = useConfirm()

const isMarkingUpNext = ref(false)
const isCallingToStage = ref(false)
const isStarting = ref(false)
const isCompleting = ref(false)
const isNoShowing = ref(false)
const isReinstating = ref(false)

const isLoading = computed(() => {
  return isMarkingUpNext.value || isCallingToStage.value || isStarting.value || isCompleting.value || isNoShowing.value || isReinstating.value
})

const canMarkUpNext = computed(() => {
  return props.slot.status === 'queued'
})

const canCallToStage = computed(() => {
  return props.slot.status === 'up_next'
})

const canStart = computed(() => {
  return props.slot.status === 'setting_up'
})

const canComplete = computed(() => {
  return props.slot.status === 'performing'
})

const canNoShow = computed(() => {
  return props.slot.status === 'queued' || props.slot.status === 'up_next' || props.slot.status === 'setting_up' || props.slot.status === 'performing'
})

const canReinstate = computed(() => {
  return props.slot.status === 'no_show' || props.slot.status === 'completed'
})

async function handleMarkUpNext() {
  isMarkingUpNext.value = true
  try {
    emit('mark-up-next', props.slot.slot_id)
  } finally {
    setTimeout(() => {
      isMarkingUpNext.value = false
    }, 1000)
  }
}

async function handleCallToStage() {
  isCallingToStage.value = true
  try {
    emit('call-to-stage', props.slot.slot_id)
  } finally {
    setTimeout(() => {
      isCallingToStage.value = false
    }, 1000)
  }
}

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