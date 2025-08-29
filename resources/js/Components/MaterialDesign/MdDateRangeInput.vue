<template>
    <div class="relative w-full my-3 px-1" data-md-input="true" ref="rootRef">
        <!-- Label flotante -->
        <label v-if="label" :for="id" class="md-label"
            :class="[
                isFocused || internalValue ? `text-[0.75rem] -top-2.5 scale-90 ${GetLabelColor(props.error)}` : 'md-label--unfocused',
                iconClass ? 'md-label--with-icon' : 'md-label--no-icon'
            ]"
        >
        <IconAsterisk v-if="required && !internalValue && !errorText" />
        <IconCheck v-else-if="success && !errorText" />
        <IconError v-else-if="errorText" />

            {{ label }}
        </label>

        <!-- Icono izquierdo (slot o clase) -->
        <IconInput v-if="iconClass" :icon-class="iconClass" :color="borderColor"></IconInput>

        <!-- Input -->
        <input
        :id="id"
        type="text"
        :name="name"
        ref="inputRef"
        :value="formattedValue" :disabled="disabled" :readonly="readonly"
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
            'pl-10 pr-4': iconLeft || iconClass,
            'px-4': !iconLeft && !iconClass,
            'ring-1 ring-inset': success
        }"
        :style="{ '--md-bg': 'var(--field-bg)', '--md-border': borderColor, '--tw-ring-color': borderColor }"
        />

        <!-- Calendario -->
        <div v-if="showCalendar" ref="calendarRef" class="absolute z-50 mt-2">
            <MdDateRangeCalendar
                v-model="internalValue"
                :min-date="minDate"
                :max-date="maxDate"
                :disabled-dates="disabledDates"
                :disabled-weekdays="disabledWeekdays"
                @update:modelValue="updateValue"
                @close="closeCalendar"
                @clear="() => updateValue({ start: '', end: '' })"
            />
        </div>

        <!-- Mensaje de error o ayuda -->
        <div class="flex items-center justify-between text-xs px-1 mt-1 leading-tight">
            <div class="ml-1" :class="errorText ? 'text-[var(--color-complement-2)] text-sm' : 'text-gray-400'">
                {{ errorText || helper }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed, useSlots, onMounted, onBeforeUnmount } from 'vue'
import MdDateRangeCalendar from './MdDateRangeCalendar.vue';
import dayjs from 'dayjs';
import { GetLabelColor,
    GetBorderColor,
    GetErrorText,
 } from '@/Utils/InputUtils.js'

const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({ start: '', end: '' })
    },
    required: Boolean,
    label: String,
    placeholder: String,
    name: String,
    id: String,
    disabled: Boolean,
    readonly: Boolean,
    error: [Boolean, String, Array],
    success: { type: Boolean, default: false },
    iconClass: { type: String, default: '' },
    helper: { type: String, default: '' },
    minDate: String,
    maxDate: String,
    disabledDates: Array,
    disabledWeekdays: Array
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

const showCalendar = ref(false)
const isFocused = ref(false)
const internalError = ref('')
const isDark = ref(false)
const slots = useSlots()
const inputRef = ref(null)
const calendarRef = ref(null)

const internalValue = ref(
    props.modelValue && typeof props.modelValue === 'object'
        ? props.modelValue
        : { start: '', end: '' }
)

watch(() => props.modelValue, (val) => {
    if (val?.start && val?.end) {
        internalValue.value = val
    }
})

watch(internalValue, (val) => {
    internalError.value = ''

    if (props.required && (!val.start || !val.end)) {
        internalError.value = 'Este campo es obligatorio'
    }
})

const iconLeft = computed(() => !!slots.iconLeft)

const backgroundColor = computed(() => 'var(--field-bg)')

const borderColor = computed(() =>
    GetBorderColor({error: props.error, success: props.success, isFocused: isFocused.value,internalError: internalError.value})
)

const labelColor = computed(() => GetLabelColor(props.error))

const errorText = computed(() => {
    if (internalError.value) return internalError.value
    if (Array.isArray(props.error)) return props.error[0]
    if (typeof props.error === 'string') return props.error
    return null
})

const formattedValue = computed(() => {
    const format = (dateStr) => {
        if (!dateStr || typeof dateStr !== 'string') return ''
        const [yyyy, mm, dd] = dateStr.split('-')
        return dd && mm && yyyy ? `${dd}/${mm}/${yyyy}` : ''
    }
    const start = format(internalValue.value.start)
    const end = format(internalValue.value.end)
    return start && end ? `${start} - ${end}` : ''
})

function toggleCalendar() {
    if (!props.disabled && !props.readonly) {
        showCalendar.value = !showCalendar.value
    }
}

function handleClickOutside(event) {
    if (
        calendarRef.value &&
        !calendarRef.value.contains(event.target) &&
        inputRef.value &&
        !inputRef.value.contains(event.target)
    ) {
        showCalendar.value = false
    }
}

function closeCalendar() {
    showCalendar.value = false
}

function updateValue(val) {
    internalValue.value = val
    emit('update:modelValue', val)
}

function onFocus(e) {
    isFocused.value = true
    emit('focus', e)
}

function onBlur(e) {
    isFocused.value = false
    if (props.required && (!internalValue.value.start || !internalValue.value.end)) {
        internalError.value = 'Este campo es obligatorio'
    }
    emit('blur', e)
}

function onKeydown(event) {
    if (event.key === 'Tab') {
        const valid = validate()
        if (!valid) {
            event.preventDefault()
        }
    }
}

function validate() {
    let message = ''
    if (props.required && (!internalValue.value.start || !internalValue.value.end)) {
        message = 'Este campo es obligatorio'
    }
    internalError.value = message
    return message === ''
}

defineExpose({ validate })

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>
