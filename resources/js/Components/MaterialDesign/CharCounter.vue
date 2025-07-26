<!-- CharCounter.vue -->
<template>
    <div v-if="show" :class="color" class="text-xs transition-all duration-300 leading-tight">
        {{ length }} / {{ maxlength }}
    </div>
</template>

<script setup>
const props = defineProps({
    length: Number,
    maxlength: Number,
    color: String,
    show: Boolean,
})
</script>
