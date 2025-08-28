<template>
    <div class="relative w-full my-3 px-1" data-md-input="true">
        <!-- Label flotante -->
        <label v-if="label" :for="id" class="md-label"
            :class="[
                isFocused || modelValue ? `text-[0.75rem] -top-2.5 scale-90 ${GetLabelColor(props.error)}` : 'md-label--unfocused',
                iconClass ? 'md-label--with-icon' : 'md-label--no-icon'
            ]"
        >
            <IconAsterisk v-if="required && !modelValue && !errorText" />
            <IconCheck v-else-if="success && !errorText" />
            <IconError v-else-if="errorText" />
            {{ label }}
        </label>

        <!-- Icono izquierdo (slot o clase) -->
        <IconInput v-if="iconClass" :icon-class="iconClass" :color="borderColor" />

        <!-- Campo de visualización y botón -->
        <div
            class="flex items-center border-2 rounded-xl h-10 transition-all duration-300 ease-in-out shadow-sm relative"
            :class="inputPadding"
            :style="{ borderColor, backgroundColor: 'var(--color-primary)' }"
        >
            <!-- Ícono izquierdo opcional -->
            <i v-if="iconClass" :class="iconClass" class="absolute left-3 text-base text-[var(--color-primary-light)]"></i>

            <!-- Texto de color (copiable) -->
            <span
                class="w-full text-gray-800 dark:text-gray-100 text-sm truncate cursor-pointer pl-2"
                @click="copiarHex"
                v-tooltip="tooltipText"
            >
                {{ modelValue }}
            </span>

            <!-- Botón selector -->
            <button
                type="button"
                class="absolute right-3 w-32 h-6 rounded-full flex items-center justify-center text-sky-500 shadow-xl"
                :style="{ backgroundColor: modelValue ? modelValue : 'var(--color-primary-light)' }"
                @click.prevent="abrirSelector"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" :stroke="modelValue" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.341A8 8 0 118.66 4.573l10.769 10.768z" />
                </svg>
            </button>

            <input
                ref="colorInput"
                type="color"
                class="hidden"
                :value="modelValue"
                @input="actualizarColor($event.target.value)"
            />
        </div>

        <!-- Helper -->
        <div v-if="helper" class="text-xs text-gray-400 px-1 mt-1 leading-tight">
            {{ helper }}
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import IconClear from '../Icons/IconClear.vue'
import IconCheck from '../Icons/IconCheck.vue'
import IconError from '../Icons/IconError.vue'
import IconAsterisk from '../Icons/IconAsterisk.vue'
import IconInput from '../Icons/IconInput.vue'
import InputError from './InputError.vue'
import { GetLabelColor, GetBorderColor, GetErrorText } from '@/Utils/InputUtils.js'

const props = defineProps({
    id: String,
    name: String,
    modelValue: { type: String, default: '#991b1b' },
    required: Boolean,
    label: String,
    disabled: Boolean,
    readonly: Boolean,
    error: [Boolean, String, Array],
    success: Boolean,
    iconClass: String,
    helper: String,
})

const emit = defineEmits(['update:modelValue'])

const isFocused = ref(false)
const colorInput = ref(null)
const tooltipText = ref('Copiar color')


const borderColor = computed(() =>
    GetBorderColor({ error: props.error, success: props.success, isFocused: isFocused.value })
)

const errorText = computed(() =>
    GetErrorText({ error: props.error })
)

const inputPadding = computed(() => (props.iconClass ? 'pl-10 pr-4' : 'px-4'))

function abrirSelector() {
    colorInput.value?.click()
}

function actualizarColor(hex) {
    emit('update:modelValue', hex)
}

function copiarHex() {
    if (!props.modelValue) return
    navigator.clipboard.writeText(props.modelValue)
    tooltipText.value = '¡Copiado!'
    setTimeout(() => {
        tooltipText.value = 'Copiar color'
    }, 1500)
}
</script>
