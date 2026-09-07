<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  label: string
  placement?: 'center' | 'right'
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
}>(), { placement: 'center', closeOnBackdrop: true, closeOnEscape: true })
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
let returnFocus: HTMLElement | null = null
let previousOverflow: string | null = null
let backdropPointerDown = false

function releasePage() {
  if (previousOverflow !== null) document.body.style.overflow = previousOverflow
  previousOverflow = null
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
  returnFocus = null
}

function syncOpen() {
  const element = dialog.value
  if (!element) return
  if (props.open && !element.open) {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    element.showModal()
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else if (!props.open && element.open) {
    element.close()
    releasePage()
  }
}

function cancel(event: Event) {
  event.preventDefault()
  if (props.closeOnEscape) emit('close')
}

function backdropClick(event: MouseEvent) {
  // Dragging selected text out of the panel must not dismiss the dialog.
  if (props.closeOnBackdrop && backdropPointerDown && event.target === dialog.value) emit('close')
  backdropPointerDown = false
}

function nativeClose() {
  releasePage()
  if (props.open) emit('close')
}

function keepFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab' || !dialog.value) return
  const targets = [...dialog.value.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
    .filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0)
  const first = targets[0]
  const last = targets[targets.length - 1]
  if (!first) { event.preventDefault(); dialog.value.focus(); return }
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}

watch(() => props.open, syncOpen, { flush: 'post' })
onMounted(syncOpen)
onBeforeUnmount(() => { dialog.value?.close(); releasePage() })
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" :class="['wx-dialog', `is-${placement}`]" :aria-label="label" tabindex="-1"
      @cancel="cancel" @close="nativeClose"
      @keydown="keepFocus"
      @pointerdown="backdropPointerDown = $event.target === dialog"
      @click="backdropClick">
      <slot />
    </dialog>
  </Teleport>
</template>
