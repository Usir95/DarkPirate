<template>
    <div ref="wrapperRef" class="relative w-full my-3 px-1" data-md-input="true">
        <!-- Label flotante -->
        <label v-if="label" :for="id" class="md-label"
        :class="[
            (isFocused || !isEmpty)
            ? `text-[0.75rem] -top-2.5 scale-90 ${GetLabelColor(errorText || internalError)}`
            : 'md-label--unfocused',
            iconClass ? 'md-label--with-icon' : 'md-label--no-icon'
        ]">
        <IconAsterisk v-if="required && isEmpty && !errorText" />
        <IconCheck v-else-if="success && !errorText && !internalError" />
        <IconError v-else-if="errorText || internalError" />
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

        <!-- Dropdown con búsqueda + virtualización -->
        <transition name="fade">
        <ul v-if="isOpen"
            ref="listRef"
            :id="`${id}-listbox`"
            role="listbox"
            :aria-multiselectable="!!multiple"
            @scroll="onListScroll"
            class="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-xl border bg-[var(--color-surface)] text-[var(--field-fg)] shadow-lg text-sm"
            :style="{ borderColor: 'var(--color-border)' }">

            <!-- Barra de búsqueda -->
            <li class="px-3 py-2 sticky top-0 bg-[var(--color-surface)] z-10">
            <input
                ref="searchRef"
                v-model="search"
                type="text"
                placeholder="Buscar..."
                class="w-full rounded-lg border px-3 py-1 text-sm
                    bg-[var(--field-bg)] text-[var(--field-fg)]
                    border-[var(--color-border)] focus:outline-none
                    focus:ring-1 focus:ring-[var(--color-primary)]"/>
            </li>

            <!-- Limpiar -->
            <li v-if="clearable && !isEmpty"
                role="option"
                :id="optionId(-1)"
                aria-selected="false"
                class="px-4 py-2 italic text-[var(--field-placeholder)] hover:bg-[var(--color-primary-light)]/15 cursor-pointer"
                @click.stop="clearSelection">
            — Limpiar selección —
            </li>

            <!-- Espaciador superior -->
            <li aria-hidden="true" :style="{ height: topPad + 'px' }"></li>

            <!-- Items visibles -->
            <li v-for="(option, i) in visibleOptions"
                :key="String(option.value ?? (startIndex + i))"
                :data-row="true"
                role="option"
                :id="optionId(startIndex + i)"
                :aria-selected="isSelected(option)"
                :aria-disabled="!!option.disabled"
                @click.stop="(e) => !option.disabled && selectOption(option, e)"
                class="px-4 py-2 cursor-pointer transition-colors"
                :class="[
                option.disabled ? 'opacity-50 cursor-not-allowed' :
                ( isSelected(option) ? 'bg-[var(--color-primary-light)]/25' : 'hover:bg-[var(--color-primary-light)]/15' ),
                activeIndex === (startIndex + i) ? 'outline-1 outline-[var(--color-primary)]' : ''
                ]">
            {{ option.label }}
            </li>

            <!-- Espaciador inferior -->
            <li aria-hidden="true" :style="{ height: bottomPad + 'px' }"></li>

            <!-- Vacío -->
            <li v-if="!filtered.length" class="px-4 py-2 text-[var(--field-placeholder)]">Sin resultados</li>
        </ul>
        </transition>

        <!-- Hidden inputs para formularios -->
        <input v-if="name && !multiple" type="hidden" :name="name" :value="submitValue">
        <template v-if="name && multiple">
        <input v-for="(v,i) in (modelValue || [])" :key="i" type="hidden" :name="`${name}[]`" :value="v">
        </template>

        <!-- Helper o error -->
        <div class="flex items-center justify-between text-xs px-1 mt-1 leading-tight">
        <div class="ml-1" :class="(errorText || internalError) ? 'text-[var(--color-complement-2)] text-sm' : 'text-[var(--field-placeholder)]'">
            {{ errorText || internalError || helper }}
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
    options: { type: Array, default: () => [] },
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
})
const emit = defineEmits(['update:modelValue'])

/* ===== State ===== */
const wrapperRef = ref(null)
const listRef = ref(null)
const searchRef = ref(null)
const isOpen = ref(false)
const isFocused = ref(false)
const internalError = ref('')
const activeIndex = ref(0)
const search = ref('')
const searchDeb = ref('')

/* simple debounce sin dependencias */
let searchTimer = null
watch(search, v => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => { searchDeb.value = v }, 120)
})

/* ===== Derived (selección) ===== */
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

/* ===== Theming / errores ===== */
const borderColor = computed(() =>
  GetBorderColor({
    error: props.error,
    success: props.success,
    isFocused: isFocused.value,
    internalError: internalError.value
  })
)
const errorText = computed(() => GetErrorText({ error: props.error, internalError: internalError.value }))

/* ===== Submit value ===== */
const submitValue = computed(() => {
  if (props.multiple) {
    const arr = Array.isArray(props.modelValue) ? props.modelValue : []
    return arr.join(',')
  }
  return props.modelValue ?? ''
})

/* ===== Normalización + filtro (O(n)) ===== */
const normalized = computed(() =>
  (props.options || []).map(o => ({
    value: o?.value,
    label: String(o?.label ?? ''),
    disabled: !!o?.disabled,
    _u: String(o?.label ?? '').toLocaleUpperCase(), // cache para búsqueda
  }))
)

const filtered = computed(() => {
  const q = String(searchDeb.value || '').trim().toLocaleUpperCase()
  if (!q) return normalized.value
  // incluye substring; cambia a startsWith si quieres "prefijo"
  return normalized.value.filter(o => o._u.includes(q))
})

/* ===== Virtualización ===== */
const itemHeight = ref(36)         // px (fallback)
const listHeight = ref(240)        // px (fallback)
const overscan = 8                 // render extra por arriba/abajo
const startIndex = ref(0)          // dentro de "filtered"
const endIndex = computed(() => Math.min(startIndex.value + visibleCount.value, filtered.value.length))
const visibleCount = computed(() => Math.ceil(listHeight.value / itemHeight.value) + overscan)
const visibleOptions = computed(() => filtered.value.slice(startIndex.value, endIndex.value))
const topPad = computed(() => startIndex.value * itemHeight.value)
const bottomPad = computed(() => Math.max(filtered.value.length - endIndex.value, 0) * itemHeight.value)

function measureList () {
  const el = listRef.value
  if (!el) return
  listHeight.value = el.clientHeight || listHeight.value
  const first = el.querySelector('li[data-row]')
  if (first) {
    const h = first.getBoundingClientRect().height
    if (h > 0) itemHeight.value = Math.round(h)
  }
}

function onListScroll () {
  const el = listRef.value
  if (!el || itemHeight.value <= 0) return
  const idx = Math.floor(el.scrollTop / itemHeight.value) - Math.floor(overscan / 2)
  startIndex.value = clamp(idx, 0, Math.max(filtered.value.length - 1, 0))
}

/* Ajusta startIndex y activeIndex cuando cambia el filtro */
watch(filtered, arr => {
  startIndex.value = 0
  activeIndex.value = clamp(activeIndex.value, 0, Math.max(arr.length - 1, 0))
})

/* ===== Apertura / cierre ===== */
function open () {
  if (props.disabled || props.readonly) return
  isOpen.value = true
  search.value = ''
  // posiciona activo sobre seleccionado
  const idx = filtered.value.findIndex(o => String(o.value) === String(props.modelValue))
  activeIndex.value = idx >= 0 ? idx : 0
  nextTick(() => {
    measureList()
    // asegura visibilidad del activo
    ensureVisible()
    searchRef.value?.focus()
  })
}
function close () { isOpen.value = false }

/* ===== Selección ===== */
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
    if (isPrintableKey(e)) { typeaheadFeed(e.key); const idx = findNextMatch(0, typeaheadBuffer.value); if (idx >= 0 && !props.multiple) { e.preventDefault(); selectOption(filtered.value[idx], e) } }
    return
  }

  const max = Math.max(filtered.value.length - 1, 0)
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex.value = clamp(activeIndex.value + 1, 0, max); ensureVisible() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex.value = clamp(activeIndex.value - 1, 0, max); ensureVisible() }
    else if (e.key === 'Home') { e.preventDefault(); activeIndex.value = 0; ensureVisible() }
    else if (e.key === 'End') { e.preventDefault(); activeIndex.value = max; ensureVisible() }
    else if (e.key === 'PageDown') { e.preventDefault(); activeIndex.value = clamp(activeIndex.value + visibleCount.value, 0, max); ensureVisible(true) }
    else if (e.key === 'PageUp') { e.preventDefault(); activeIndex.value = clamp(activeIndex.value - visibleCount.value, 0, max); ensureVisible(true) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const opt = filtered.value[activeIndex.value]; if (opt && !opt.disabled) selectOption(opt, e) }
    else if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (isPrintableKey(e)) { typeaheadFeed(e.key); typeaheadSearch() }
}

function ensureVisible (page = false) {
  const el = listRef.value
  if (!el || itemHeight.value <= 0) return
  const top = activeIndex.value * itemHeight.value
  const bottom = top + itemHeight.value
  const viewTop = el.scrollTop
  const viewBottom = viewTop + el.clientHeight
  if (top < viewTop) el.scrollTop = page ? top : top
  else if (bottom > viewBottom) el.scrollTop = page ? (bottom - el.clientHeight) : (bottom - el.clientHeight)
  // sincroniza ventana virtual
  onListScroll()
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
  const start = (activeIndex.value + 1) % Math.max(filtered.value.length, 1)
  const idx = findNextMatch(start, q)
  if (idx >= 0) { activeIndex.value = idx; ensureVisible() }
}
function findNextMatch (start, q) {
  if (!q) return -1
  const norm = s => String(s ?? '').toLocaleLowerCase()
  const L = filtered.value.length
  for (let n = 0; n < L; n++) {
    const i = (start + n) % L
    const o = filtered.value[i]
    if (!o || o.disabled) continue
    if (norm(o.label).startsWith(norm(q))) return i
  }
  return -1
}
function isPrintableKey (e) { return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey }

/* ===== Validación ===== */
function validate () {
  const empty = isEmpty.value
  internalError.value = props.required && empty ? 'Este campo es obligatorio' : ''
  return !internalError.value
}

/* ===== Effects ===== */
watch(() => props.modelValue, () => { if (props.required) validate() }, { immediate: true })
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
    validate,
    isOpen,
    selectedOptions,
    selectedLabel,
    isSelected,
    borderColor,
    submitValue,
    activeIndex,
    open,
    close,
    optionId
})
</script>

