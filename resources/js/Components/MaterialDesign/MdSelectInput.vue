<template>
    <div ref="wrapperRef" class="relative w-full my-3 px-1" data-md-input="true">
        <!-- Label flotante -->
        <label v-if="label" :for="id" class="md-label"
            :class="[
                (isFocused || !isEmpty)
                ? `text-[0.75rem] -top-2.5 scale-90 ${GetLabelColor(uiError)}`
                : 'md-label--unfocused',
                iconClass ? 'md-label--with-icon' : 'md-label--no-icon'
            ]">
            <IconAsterisk v-if="required && isEmpty && !uiError" />
            <IconCheck v-else-if="success && !uiError" />
            <IconError v-else-if="uiError" />
            {{ label }}
        </label>

        <!-- Icono izquierdo -->
        <IconInput v-if="iconClass" :icon-class="iconClass" :color="borderColor" />

        <!-- Input visual (combobox) -->
        <div
        :id="id"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-controls="`${id}-listbox`"
        aria-haspopup="listbox"
        :aria-required="required || undefined"
        :aria-activedescendant="isOpen ? optionId(activeIndex) : undefined"
        :aria-invalid="!!uiError"
        :tabindex="disabled || readonly ? -1 : 0"
        class="w-full min-h-10 rounded-xl text-sm flex flex-wrap items-center gap-1 cursor-pointer transition-all duration-300 ease-in-out shadow-sm ring-1 ring-inset text-[var(--field-fg)]"
        :class="[ iconClass ? 'pl-10 pr-9' : 'px-4', { 'opacity-50 cursor-not-allowed': disabled || readonly } ]"
        @keydown="onKeydown"
        @click="open"
        @focus="isFocused = true"
        @blur="isFocused = false"
        :style="{ backgroundColor: 'var(--field-bg)', borderColor, '--tw-ring-color': borderColor, borderWidth: '1px' }"
        >
        <template v-if="multiple">
            <span v-for="option in selectedOptions" :key="String(option.value)"
            class="bg-[var(--color-primary)] text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
            {{ option.label }}
            <button type="button" class="ml-1 text-xs px-1 cursor-pointer" @click.stop="removeOption(option)">×</button>
            </span>
            <span v-if="!selectedOptions.length" class="opacity-50 text-[var(--field-placeholder)]">{{ placeholder }}</span>
        </template>

        <template v-else>
            <span class="truncate select-none text-[var(--field-fg)]"
                :class="{ 'opacity-50 text-[var(--field-placeholder)]': isEmpty }">
            {{ selectedLabel || '' }}
            </span>
        </template>
        </div>

        <!-- Dropdown -->
        <transition name="fade">
        <ul v-if="isOpen"
            ref="listRef"
            :id="`${id}-listbox`"
            role="listbox"
            :aria-multiselectable="!!multiple"
            class="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-xl border border-[var(--color-border)]
                    bg-[var(--color-surface)] text-[var(--field-fg)] shadow-lg text-sm">
            <li v-if="clearable && !isEmpty"
                role="option"
                :id="optionId(-1)"
                aria-selected="false"
                class="px-4 py-2 italic text-[var(--field-placeholder)] hover:bg-[var(--color-primary-light)]/15 cursor-pointer"
                @click.stop="clearSelection">
            — Limpiar selección —
            </li>

            <li v-for="(option, index) in options" :key="String(option?.value ?? index)"
                role="option"
                :id="optionId(index)"
                :aria-selected="isSelected(option)"
                :aria-disabled="!!option.disabled"
                @click.stop="(e) => !option.disabled && selectOption(option, e)"
                class="px-4 py-2 cursor-pointer transition-colors"
                :class="[
                option.disabled ? 'opacity-50 cursor-not-allowed' :
                ( isSelected(option) ? 'bg-[var(--color-primary-light)]/25' : 'hover:bg-[var(--color-primary-light)]/15' ),
                activeIndex === index ? 'outline-1 outline-[var(--color-primary)]' : ''
                ]">
            {{ option.label }}
            </li>
        </ul>
        </transition>

        <!-- Hidden inputs para formularios -->
        <input v-if="name && !multiple" type="hidden" :name="name" :value="submitValue">
        <template v-if="name && multiple">
        <input v-for="(v,i) in (modelValue || [])" :key="i" type="hidden" :name="`${name}[]`" :value="v">
        </template>

        <!-- Helper o error -->
        <div class="flex items-center justify-between text-xs px-1 mt-1 leading-tight">
        <div class="ml-1" :class="uiError ? 'text-[var(--color-complement-2)] text-sm' : 'text-[var(--field-placeholder)]'">
            {{ uiError || helper }}
        </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { onClickOutside } from '@vueuse/core'
import IconCheck from '../Icons/IconCheck.vue'
import IconError from '../Icons/IconError.vue'
import IconAsterisk from '../Icons/IconAsterisk.vue'
import IconInput from '../Icons/IconInput.vue'
import { GetBorderColor, GetErrorText, GetLabelColor } from '@/Utils/InputUtils.js'

/* ===== Props / Emits ===== */
const props = defineProps({
    id: { type: String, default: 'md-select-' + Math.random().toString(36).slice(2) },
    name: { type: String, default: '' },
    modelValue: [String, Number, Object, Array, null],
    options: { type: Array, default: () => [] }, // [{ value, label, disabled? }]
    label: { type: String, default: 'Selecciona una opción' },
    placeholder: { type: String, default: 'Selecciona una opción' },
    iconClass: { type: String, default: '' },
    error: [Boolean, String, Array],
    success: Boolean,
    required: Boolean,
    helper: String,
    multiple: Boolean,
    clearable: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    validateOnMount: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

/* ===== State ===== */
const wrapperRef = ref(null)
const listRef = ref(null)
const isOpen = ref(false)
const isFocused = ref(false)
const activeIndex = ref(0)
const touched = ref(false)

/* ===== Derived ===== */
const isEmpty = computed(() =>
  props.multiple
    ? !(Array.isArray(props.modelValue) && props.modelValue.length)
    : (props.modelValue === '' || props.modelValue == null)
)

const optionMap = computed(() => {
  const m = new Map()
  for (const o of props.options) m.set(String(o?.value), o)
  return m
})

const selectedSet = computed(() => {
  if (props.multiple) {
    const arr = Array.isArray(props.modelValue) ? props.modelValue : []
    return new Set(arr.map(v => String(v)))
  }
  return new Set(props.modelValue == null ? [] : [String(props.modelValue)])
})

const selectedOptions = computed(() => {
  if (!props.multiple) return []
  const out = []
  for (const v of selectedSet.value) {
    const o = optionMap.value.get(v)
    if (o) out.push(o)
  }
  return out
})

const selectedLabel = computed(() =>
  props.multiple ? '' : (optionMap.value.get(String(props.modelValue))?.label || '')
)

/* ===== Errores / estilos ===== */
const externalError = computed(() => GetErrorText({ error: props.error, internalError: '' }))
const internalRequiredError = computed(() =>
  props.required && isEmpty.value ? 'Este campo es obligatorio' : ''
)
// visible: externo siempre; interno solo tras interacción o validateOnMount
const uiError = computed(() =>
  externalError.value || ((props.validateOnMount || touched.value) ? internalRequiredError.value : '')
)

const borderColor = computed(() =>
  GetBorderColor({
    error: !!uiError.value,
    success: props.success,
    isFocused: isFocused.value,
    internalError: uiError.value
  })
)

/* ===== Form submit value ===== */
const submitValue = computed(() => {
  if (props.multiple) {
    const arr = Array.isArray(props.modelValue) ? props.modelValue : []
    return arr.join(',')
  }
  return props.modelValue ?? ''
})

/* ===== Open/Close helpers ===== */
function open () {
  if (props.disabled || props.readonly) return
  isOpen.value = true
  const idx = props.options.findIndex(o => String(o?.value) === String(props.modelValue))
  activeIndex.value = clamp(idx >= 0 ? idx : 0, 0, Math.max(props.options.length - 1, 0))
  nextTick(scrollActiveIntoView)
}
function close () { isOpen.value = false }

/* ===== Selection ===== */
function isOptionDisabled (i) { return !!props.options[i]?.disabled }
function isSelected (option) { return selectedSet.value.has(String(option.value)) }

function selectOption (option, event) {
  if (props.multiple) {
    const arr = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const key = String(option.value)
    const i = arr.findIndex(v => String(v) === key)
    if (i >= 0) arr.splice(i, 1)
    else arr.push(option.value)
    emit('update:modelValue', arr)
    if (!(event?.ctrlKey || event?.metaKey)) close()
  } else {
    emit('update:modelValue', option.value)
    close()
  }
  validate()
}

function clearSelection () {
  emit('update:modelValue', props.multiple ? [] : null)
  validate()
  close()
}

function removeOption (option) {
  if (!props.multiple) return
  const arr = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  const key = String(option.value)
  emit('update:modelValue', arr.filter(v => String(v) !== key))
  validate()
}

/* ===== Teclado ===== */
function onKeydown (e) {
  if (props.disabled || props.readonly) return

  if (!isOpen.value) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); open(); return
    }
    if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); open(); return }
    if (isPrintableKey(e)) {
      typeaheadFeed(e.key)
      const idx = findNextMatch(0, typeaheadBuffer.value)
      if (idx >= 0 && !props.multiple) { e.preventDefault(); selectOption(props.options[idx], e) }
    }
    return
  }

  const max = Math.max(props.options.length - 1, 0)
  if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
  else if (e.key === 'Home') { e.preventDefault(); moveTo(0) }
  else if (e.key === 'End') { e.preventDefault(); moveTo(max) }
  else if (e.key === 'PageDown') { e.preventDefault(); move(10) }
  else if (e.key === 'PageUp') { e.preventDefault(); move(-10) }
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commitActive(e) }
  else if (e.key === 'Escape') { e.preventDefault(); close() }
  else if (isPrintableKey(e)) { typeaheadFeed(e.key); typeaheadSearch() }
}

function move (delta) {
  if (!props.options.length) return
  let i = activeIndex.value
  const max = props.options.length - 1
  do {
    i = clamp(i + delta, 0, max)
  } while (isOptionDisabled(i) && i !== activeIndex.value)
  activeIndex.value = i
  nextTick(scrollActiveIntoView)
}
function moveTo (i) {
  activeIndex.value = clamp(i, 0, Math.max(props.options.length - 1, 0))
  if (isOptionDisabled(activeIndex.value)) move(1)
  nextTick(scrollActiveIntoView)
}
function commitActive (e) {
  const opt = props.options[activeIndex.value]
  if (!opt || opt.disabled) return
  selectOption(opt, e)
}
function scrollActiveIntoView () {
  const ul = listRef.value
  const idx = activeIndex.value
  if (!ul || idx < 0) return
  const li = ul.querySelector(`#${optionId(idx)}`)
  if (li) {
    const cTop = ul.scrollTop
    const cBottom = cTop + ul.clientHeight
    const eTop = li.offsetTop
    const eBottom = eTop + li.offsetHeight
    if (eTop < cTop) ul.scrollTop = eTop
    else if (eBottom > cBottom) ul.scrollTop = eBottom - ul.clientHeight
  }
}

/* ===== Typeahead ===== */
const typeaheadBuffer = ref('')
let typeTimer = null
function typeaheadFeed (ch) {
  clearTimeout(typeTimer)
  typeaheadBuffer.value += ch
  typeTimer = setTimeout(() => { typeaheadBuffer.value = '' }, 700)
}
function typeaheadSearch () {
    const q = typeaheadBuffer.value
    const start = (activeIndex.value + 1) % props.options.length
    const idx = findNextMatch(start, q)
    if (idx >= 0) { activeIndex.value = idx; nextTick(scrollActiveIntoView) }
}
function findNextMatch (start, q) {
    if (!q) return -1
    const norm = s => String(s ?? '').toLocaleLowerCase()
    const L = props.options.length
    for (let n = 0; n < L; n++) {
        const i = (start + n) % L
        const o = props.options[i]
        if (!o || o.disabled) continue
        if (norm(o.label).startsWith(norm(q))) return i
    }
    return -1
}
function isPrintableKey (e) { return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey }

/* ===== Validación ===== */
function validate () {
  touched.value = true
  return !uiError.value
}

/* ===== Effects ===== */
onClickOutside(wrapperRef, () => { close(); isFocused.value = false })
onMounted(() => {
  const onKey = (e) => { if (e.key === 'Escape') close() }
  window.addEventListener('keydown', onKey)
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
})

/* ===== Utils / expose ===== */
function optionId (i) { return `${props.id}-opt-${i}` }
function clamp (n, lo, hi) { return Math.min(Math.max(n, lo), hi) }

defineExpose({
    validate, isOpen, selectedOptions, selectedLabel, isSelected,
    borderColor, submitValue, activeIndex, open, close, optionId
})
</script>
