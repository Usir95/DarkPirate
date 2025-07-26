<template>
    <button
        class="absolute right-3 transform -translate-y-1/2 cursor-pointer flex items-center justify-center transition-colors duration-200 text-[var(--color-primary)] hover:text-[var(--color-primary-light)]"
        :style="{ top }"
        @click.prevent="$emit('click')"
        tabindex="-1"
    >
        <BaseIcon classList="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </BaseIcon>
    </button>
</template>

<script setup>
    import BaseIcon from './BaseIcon.vue';
    defineProps({ top: { type: String, required: true } });
    defineEmits(['click']);
</script>
