<template>
    <div class="absolute left-4 h-10 flex items-center pointer-events-none" :style="{ color }">
        <i :class="iconClass" class="text-base leading-none"></i>
    </div>
</template>

<script setup>
const props = defineProps({
    iconClass: String,
    color: String,
})
</script>
