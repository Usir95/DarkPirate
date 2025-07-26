<!-- InputError.vue -->
<template>
    <div
        class="ml-1 text-xs leading-tight"
        :class="errorText ? 'text-[var(--color-complement-2)] text-sm' : 'text-gray-400'"
    >
        {{ errorText || helper }}
    </div>
</template>

<script setup>
    const props = defineProps({
        errorText: String,
        helper: String,
    });
</script>
