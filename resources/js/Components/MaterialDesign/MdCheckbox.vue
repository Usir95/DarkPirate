<template>
    <div class="my-3 px-1" data-md-input="true" ref="rootRef">
        <!-- Template: usa idAttr en label e input -->
        <label :for="idAttr" class="flex items-start gap-3 cursor-pointer select-none" :class="{ 'opacity-60 pointer-events-none': disabled }">
        <span class="relative w-5 h-5 flex items-center justify-center border-2 rounded transition-all duration-150"
                :class="isFocused ? 'ring-2 ring-inset' : ''"
                :style="{ borderColor, backgroundColor: checked ? 'var(--color-primary)' : 'transparent', color: checked ? 'white' : 'transparent', '--tw-ring-color': borderColor }">
            <svg v-if="checked" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            <input
            :id="idAttr"
            ref="inputRef"
            type="checkbox"
            class="absolute inset-0 opacity-0 cursor-pointer"
            :checked="checked"
            :disabled="disabled"
            :aria-invalid="!!visibleError"
            :aria-describedby="describedBy"
            @change="onChange"
            @focus="onFocus"
            @blur="onBlur"
            />
        </span>

        <div class="text-sm leading-snug">
            <div class="font-medium" :class="labelColorClass">
            <slot>{{ label }}</slot>
            <span v-if="required && !checked" class="ml-1 align-middle" style="color:var(--color-complement-2)">*</span>
            </div>
            <p v-if="helper && !visibleError" :id="helperId" class="text-xs mt-1" style="color:var(--field-placeholder)">{{ helper }}</p>
            <p v-if="visibleError" :id="errorId" class="text-xs mt-1" style="color:var(--color-complement-2)">{{ visibleError }}</p>
        </div>
        </label>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { GetBorderColor } from '@/Utils/InputUtils.js'

const props = defineProps({
  id: String,                      // sin default aquí
  modelValue: { type: Boolean, default: false },
  label: String,
  required: Boolean,
  helper: { type: String, default: '' },
  errorText: String,
  disabled: Boolean,
  validateOnMount: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

/* id único por instancia */
const uid = `md-checkbox-${Math.random().toString(36).slice(2)}`
const idAttr = computed(() => props.id || uid)

const inputRef = ref(null)
const isFocused = ref(false)
const touched = ref(false)

const checked = computed({
  get: () => !!props.modelValue,
  set: v => emit('update:modelValue', !!v)
})

const internalError = ref('')
function syncError(){ internalError.value = props.required && !checked.value ? 'Este campo es obligatorio' : '' }

watch(() => [props.modelValue, props.required], () => {
  if (props.validateOnMount || touched.value) syncError()
})

const visibleError = computed(() =>
  props.errorText ? props.errorText : ((props.validateOnMount || touched.value) ? internalError.value : '')
)

const borderColor = computed(() =>
  GetBorderColor({ error: !!visibleError.value, success: false, isFocused: isFocused.value, internalError: visibleError.value })
)
const labelColorClass = computed(() => visibleError.value ? 'text-[var(--color-complement-2)]' : 'text-[var(--field-fg)]')
const helperId = computed(() => `${idAttr.value}-help`)
const errorId  = computed(() => `${idAttr.value}-err`)
const describedBy = computed(() => visibleError.value ? errorId.value : (props.helper ? helperId.value : undefined))

function onChange(e){
  if (props.disabled) return
  touched.value = true
  checked.value = e.target.checked        // ← lee el valor real del input
  syncError()
}
function onFocus(e){ isFocused.value = true; emit('focus', e) }
function onBlur(e){ isFocused.value = false; touched.value = true; syncError(); emit('blur', e) }
function validate(){ touched.value = true; syncError(); return !visibleError.value }

defineExpose({ validate })
</script>
