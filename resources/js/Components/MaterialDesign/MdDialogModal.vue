<script setup>
import Modal from './MdModal.vue'

const emit = defineEmits(['close'])

defineProps({
    show: { type: Boolean, default: false },
    maxWidth: { type: String, default: '2xl' },
    closeable: { type: Boolean, default: true },
})

const close = () => emit('close')
</script>

<template>
    <Modal
        :show="show"
        :max-width="maxWidth"
        :closeable="closeable"
        @close="close"
    >
        <div class="max-h-[90vh] flex flex-col relative bg-[var(--color-surface)] text-[var(--color-foreground)]">
        <!-- Botón cerrar -->
        <button
            @click="close"
            class="absolute top-4 right-4 z-20 cursor-pointer
                text-[var(--field-placeholder)] hover:text-[var(--color-complement-2)] transition"
            aria-label="Cerrar"
            role="button"
            title="Cerrar"
        >✕</button>

        <!-- Header fijo -->
        <div class="sticky top-0 z-10 px-6 py-4 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
            <div class="text-lg font-medium text-[var(--color-foreground)]">
                <slot name="title" />
            </div>
        </div>

        <!-- Contenido con scroll -->
        <div class="overflow-y-auto px-6 pt-4 pb-6 text-sm text-[var(--color-foreground)] opacity-90 custom-scrollbar">
            <slot name="content" />
        </div>

        <!-- Footer fijo -->
        <div class="sticky bottom-0 z-10 px-6 py-4 flex justify-end
                    bg-[var(--color-surface)] border-t border-[var(--color-border)]">
            <slot name="footer" />
        </div>
        </div>
    </Modal>
</template>
