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
            @click="toggleCalendar"
            @keydown="onKeydown"
            @focus="onFocus"
            @blur="onBlur"
            @input="onUserInput"
            :placeholder="placeholder || 'dd/mm/aaaa'"
            :aria-invalid="!!errorText" :aria-required="required || undefined"
            :aria-expanded="showCalendar" :aria-controls="`cal-${id}`"
            :aria-describedby="`${id}-help`"
            :value="formattedValue"
            :disabled="disabled" :readonly="readonly" :required="required"
            autocomplete="off" autocapitalize="off" spellcheck="false"
            inputmode="numeric" maxlength="10" pattern="^\\d{2}/\\d{2}/\\d{4}$"
            :style="{
                backgroundColor: 'var(--color-background)',
                '--md-border': borderColor, '--tw-ring-color': borderColor
                }"
            class="w-full h-10 rounded-xl border-2 bg-[var(--md-bg)] border-[var(--md-border)]
                    text-[var(--field-fg)] placeholder-[var(--field-placeholder)]
                    focus:outline-none focus:ring-2 shadow-sm focus:shadow-md"
            :class="{
                'opacity-50 cursor-not-allowed': disabled || readonly,
                'pl-10 pr-4': !!iconClass,
                'px-4': !iconClass,
                'ring-1 ring-inset': success
            }"
        />

        <!-- Mensaje -->
        <div class="flex items-center justify-between text-xs px-1 mt-1 leading-tight">
        <div class="ml-1" :class="errorText ? 'text-[var(--color-complement-2)] text-sm' : 'text-[var(--field-placeholder)]'">
            {{ errorText || helper }}
        </div>
        </div>

        <!-- Calendario -->
        <transition name="calendar-fade">
            <div v-if="showCalendar" ref="calendarRef" :id="`cal-${id}`" class="absolute z-50 mt-2 left-0 top-full">
                <MdDateCalendar
                    v-model="internalValue"
                    @close="closeCalendar"
                    @clear="() => updateValue('')"
                    :minDate="props.minDate"
                    :maxDate="props.maxDate"
                    :disabledDates="props.disabledDates"
                    :disabledWeekdays="props.disabledWeekdays"
                />
            </div>
        </transition>
    </div>
</template>


<script setup>
import { ref, watch, computed, useSlots, onMounted, onBeforeUnmount } from 'vue'
import MdDateCalendar from './MdDateCalendar.vue'
import IconCheck from '../Icons/IconCheck.vue'
import IconError from '../Icons/IconError.vue'
import IconAsterisk from '../Icons/IconAsterisk.vue'
import IconInput from '../Icons/IconInput.vue'
import dayjs from 'dayjs'
import { GetLabelColor,
    GetBorderColor,
    GetErrorText,
 } from '@/Utils/InputUtils.js'

/* ======================= Props ========================== */
const props = defineProps({
  modelValue: String,
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

/* ======================= Emits ========================== */
const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

/* ======================= State/Refs ====================== */
const showCalendar = ref(false)
const isFocused = ref(false)
const internalValue = ref(props.modelValue ?? '')
const internalError = ref('')
const slots = useSlots()
const inputRef = ref(null)
const calendarRef = ref(null)

/* ======================= Sync externa ==================== */
watch(() => props.modelValue, v => { internalValue.value = v ?? '' })

/* ======================= Reacciones ====================== */
watch(internalValue, (val) => {
    internalError.value = props.required && !val ? 'Este campo es obligatorio' : ''
    emit('update:modelValue', val)
})

/* ======================= Computed ======================== */
const iconLeft = computed(() => !!slots.iconLeft) // si mantienes el slot; si no, quedará false
const backgroundColor = computed(() => 'var(--field-bg)')

const borderColor = computed(() =>
    GetBorderColor({error: props.error, success: props.success, isFocused: isFocused.value,internalError: internalError.value})
)

const labelColor = computed(() => GetLabelColor(props.error))

const errorText = computed(() =>
    GetErrorText({ error: props.error, internalError: internalError.value})
)

const formattedValue = computed(() => {
    const [yyyy, mm, dd] = internalValue.value?.split('-') || []
    return dd && mm && yyyy ? `${dd}/${mm}/${yyyy}` : ''
})

/* ======================= Helpers ========================= */
function isDateDisabled(date) {
    if (!date.isValid()) return true
    if (props.minDate && date.isBefore(dayjs(props.minDate), 'day')) return true
    if (props.maxDate && date.isAfter(dayjs(props.maxDate), 'day')) return true
    if (props.disabledDates?.some(fd => dayjs(fd).isSame(date, 'day'))) return true
    if (props.disabledWeekdays?.includes(date.day())) return true
    return false
    }

    /* ======================= I/O ============================= */
    function onUserInput(e) {
    // máscara dd/mm/aaaa
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
    let formatted = ''
    if (raw.length >= 1) formatted += raw.slice(0, 2)
    if (raw.length >= 3) formatted += '/' + raw.slice(2, 4)
    if (raw.length >= 5) formatted += '/' + raw.slice(4)
    e.target.value = formatted

    if (raw.length === 8) {
        const dd = raw.slice(0, 2)
        const mm = raw.slice(2, 4)
        const yyyy = raw.slice(4)
        const iso = `${yyyy}-${mm}-${dd}`
        const d = dayjs(iso)
        if (isDateDisabled(d)) {
        internalError.value = 'Fecha no permitida'
        return // no cambies el modelo si es inválida
        }
        updateValue(iso)
    }
}

function onKeydown(event) {
    if (event.key === 'Tab') {
        if (!validate()) event.preventDefault()
    }
}

function toggleCalendar() {
    if (!props.disabled && !props.readonly) showCalendar.value = !showCalendar.value
}

function handleOutside(ev) {
    const t = ev.target
    if (calendarRef.value && !calendarRef.value.contains(t) && inputRef.value && !inputRef.value.contains(t)) {
        showCalendar.value = false
    }
}

function closeCalendar() { showCalendar.value = false }

function updateValue(val) {
    internalValue.value = val // watcher emite al padre
}

function onFocus(e) {
    isFocused.value = true
    emit('focus', e)
}

function onBlur(e) {
    isFocused.value = false
    // si quedó parcial, restaura lo que marca el modelo
    const v = inputRef.value?.value || ''
    if (v && v.replace(/\D/g, '').length !== 8) {
        if (props.required && !internalValue.value) internalError.value = 'Este campo es obligatorio'
        // re-render del placeholder actual del modelo
        inputRef.value.value = formattedValue.value
    }
    emit('blur', e)
}

function validate() {
    const msg = props.required && !internalValue.value ? 'Este campo es obligatorio' : ''
    internalError.value = msg
    return msg === ''
}

defineExpose({ validate })

/* ======================= Lifecycle ======================= */
onMounted(() => {
  document.addEventListener('pointerdown', handleOutside, { passive: true })
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleOutside)
})
</script>

<style scoped>
.calendar-fade-enter-active,
.calendar-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.calendar-fade-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.calendar-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

</style>
