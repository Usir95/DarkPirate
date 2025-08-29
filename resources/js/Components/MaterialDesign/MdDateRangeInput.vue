<template>
    <div class="relative w-full my-3 px-1" data-md-input="true">
        <!-- Label -->
        <label v-if="label" :for="id" class="md-label" :class="[
            isFocused || (internalValue?.start && internalValue?.end)
                ? `text-[0.75rem] -top-2.5 scale-90 ${GetLabelColor(props.error)}`
                : 'md-label--unfocused',
            iconClass ? 'md-label--with-icon' : 'md-label--no-icon'
        ]">
            <IconAsterisk v-if="required && !(internalValue?.start && internalValue?.end) && !errorText" />
            <IconCheck v-else-if="success && !errorText" />
            <IconError v-else-if="errorText" />
            {{ label }}
        </label>

        <!-- Icono -->
        <IconInput v-if="iconClass" :icon-class="iconClass" :color="borderColor" />

        <!-- Input -->
        <input
            :id="id"
            type="text"
            :name="name"
            ref="inputRef"
            :value="formattedValue"
            :disabled="disabled"
            :readonly="readonly"
            @click="toggleCalendar"
            @keydown="onKeydown"
            @focus="onFocus"
            @blur="onBlur"
            class="w-full h-10 rounded-xl border-2
                bg-[var(--md-bg)] border-[var(--md-border)]
                text-[var(--field-fg)] placeholder-[var(--field-placeholder)]
                focus:outline-none focus:ring-2 transition-all duration-300 shadow-sm focus:shadow-md"
            :class="{
                'opacity-50 cursor-not-allowed': disabled || readonly,
                'pl-10 pr-4': hasIcon,
                'px-4': !hasIcon,
                'ring-1 ring-inset': success
            }"
            :style="{ '--md-bg': 'var(--field-bg)', '--md-border': borderColor, '--tw-ring-color': borderColor }"
        />

        <!-- Calendario -->
        <div v-if="showCalendar" class="absolute z-50 mt-2">
            <MdDateRangeCalendar
                :modelValue="internalValue"
                :min-date="minDate"
                :max-date="maxDate"
                :disabled-dates="disabledDates"
                :disabled-weekdays="disabledWeekdays"
                @update:modelValue="updateValue"
                @close="closeCalendar"
                @clear="() => updateValue({ start: '', end: '' })"
                />
        </div>

        <!-- Mensaje -->
        <div class="flex items-center justify-between text-xs px-1 mt-1 leading-tight">
            <div class="ml-1"
                :class="errorText ? 'text-[var(--color-complement-2)] text-sm' : 'text-[var(--field-placeholder)]'">
                {{ errorText || helper }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import MdDateRangeCalendar from './MdDateRangeCalendar.vue'
import { GetLabelColor, GetBorderColor, GetErrorText } from '@/Utils/InputUtils.js'

const props = defineProps({
    modelValue: { type: Object, default: () => ({ start: '', end: '' }) },
    required: Boolean, label: String, placeholder: String, name: String, id: String,
    disabled: Boolean, readonly: Boolean, error: [Boolean, String, Array],
    success: { type: Boolean, default: false }, iconClass: { type: String, default: '' },
    helper: { type: String, default: '' }, minDate: String, maxDate: String,
    disabledDates: Array, disabledWeekdays: Array
})
const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

const showCalendar = ref(false)
const isFocused = ref(false)
const internalError = ref('')
const inputRef = ref(null)

const internalValue = ref(
  props.modelValue && typeof props.modelValue === 'object'
    ? props.modelValue
    : { start: '', end: '' }
)

// sync-in
watch(() => props.modelValue, (v) => {
  internalValue.value = v && typeof v === 'object' ? v : { start: '', end: '' }
})

const hasIcon = computed(() => !!props.iconClass)

const borderColor = computed(() =>
  GetBorderColor({ error: props.error, success: props.success, isFocused: isFocused.value, internalError: internalError.value })
)

const errorText = computed(() =>
    GetErrorText({ error: props.error, internalError: internalError.value })
)

const formattedValue = computed(() => {
    const fmt = s => {
        if (!s) return ''
        const [y,m,d] = s.split('-')
        return (y && m && d) ? `${d}/${m}/${y}` : ''
    }
    const s = fmt(internalValue.value.start)
    const e = fmt(internalValue.value.end)
    return s && e ? `${s} - ${e}` : ''
})

function toggleCalendar(){ if (!props.disabled && !props.readonly) showCalendar.value = !showCalendar.value }
function closeCalendar(){ showCalendar.value = false }

function updateValue(v){
    internalValue.value = v
    internalError.value = props.required && !(v?.start && v?.end) ? 'Este campo es obligatorio' : ''
    emit('update:modelValue', v)
}

function onFocus(e){
    isFocused.value = true; emit('focus', e)
}

function onBlur(e){
    isFocused.value = false
    if (props.required && !(internalValue.value.start && internalValue.value.end)) internalError.value = 'Este campo es obligatorio'
    emit('blur', e)
}

function onKeydown(e){
    if (e.key === 'Tab' && props.required && !(internalValue.value.start && internalValue.value.end)) e.preventDefault()
}

defineExpose({
    validate: () => !(props.required && !(internalValue.value.start && internalValue.value.end))
})
</script>
