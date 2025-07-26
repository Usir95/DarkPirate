<!-- BaseIcon.vue -->
<template>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        :viewBox="viewBox"
        :class="['transition-all duration-300 transform scale-100', classList]"
        :style="customStyle"
        :stroke-width="strokeWidth"
        stroke="currentColor"
    >
        <slot />
    </svg>
</template>

<script setup>
    defineProps({
        classList: { type: String, default: 'w-4 h-4' },
        strokeWidth: { type: [String, Number], default: 2 },
        viewBox: { type: String, default: '0 0 24 24' },
        customStyle: { type: Object, default: () => ({}) },
    });
</script>
