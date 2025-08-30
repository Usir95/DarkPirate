<template>
    <div class="w-full my-3 px-1" data-md-input="true" ref="rootRef">
        <!-- Zona de drop -->
        <div
            class="flex flex-col items-center justify-center w-full h-24 px-4 py-6
                    border-2 border-[var(--color-primary)] border-dashed rounded-lg
                    transition-colors duration-300 cursor-pointer hover:bg-[var(--color-primary-light)]/10"
            :class="[ dragging ? 'bg-[var(--color-primary-light)]/10' : 'bg-[var(--field-bg)]' ]"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="handleDrop"
            @click="triggerInput"
        >

        <div v-if="!fileNames && typeof modelValue !== 'string'">
            <i :class="iconClass" class="text-3xl" style="color: var(--color-primary)"></i>
        </div>
        <div v-else>
            <i class="text-3xl fa-solid fa-file-arrow-down"
            :style="{ color: errorText ? 'var(--color-complement-2)' : 'var(--color-primary)' }"></i>
        </div>

        <p class="text-sm font-medium text-center mt-1 text-[var(--field-fg)]">
            {{ placeholderTitle }}
        </p>

        <p class="text-xs text-center mt-1 text-[var(--field-placeholder)]">
            <template v-if="typeof modelValue === 'string' && modelValue">
            {{ modelValue }}
            </template>
            <template v-else>
            {{ fileNames || placeholderSub }}
            </template>
        </p>

        <input
            ref="inputRef"
            type="file"
            class="hidden"
            :accept="accept"
            :multiple="multiple"
            @change="handleInput"
        />
    </div>

        <!-- Texto de error -->
        <div class="flex items-center justify-between text-xs px-1 mt-1 leading-tight">
            <div class="ml-1" :class="errorText ? 'text-[var(--color-complement-2)] text-sm' : 'text-[var(--field-placeholder)]'">
                {{ errorText || helper }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: [File, Array, String, null],
  helper: { type: String, default: '' },
  accept: { type: String, default: '.png,.jpg,.jpeg,.svg,.gif' },
  iconClass: { type: String, default: 'fa fa-upload' },
  multiple: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  errorText: String,
  success: Boolean,
  placeholderTitle: { type: String, default: 'Subir archivo' },
  placeholderSub: { type: String, default: 'Arrastra y suelta tu archivo aquí o haz clic para seleccionarlo.' },
})

const emit = defineEmits(['update:modelValue'])

const fileList = ref([])
const inputRef = ref(null)
const dragging = ref(false)
const internalError = ref('')

watch(() => props.modelValue, (v) => {
  if (v == null) fileList.value = []
  else fileList.value = props.multiple ? v : [v]
}, { immediate: true })

const fileNames = computed(() =>
  fileList.value.length ? fileList.value.map(f => f.name).join(', ') : props.placeholderSub
)

const hasFile = computed(() =>
  props.multiple ? Array.isArray(props.modelValue) && props.modelValue.length > 0
                 : props.modelValue != null
)

const errorText = computed(() => internalError.value || (typeof props.errorText === 'string' ? props.errorText : null))

/* Borde con variables de tema */
const borderColor = computed(() => {
  if (errorText.value) return 'var(--color-complement-2)'
  if (hasFile.value && fileNames.value) return 'var(--color-primary)'
  return 'var(--color-border)'
})

function validate(files = fileList.value) {
  internalError.value = ''
  const accepted = props.accept.split(',').map(t => t.trim().toLowerCase())
  const validFiles = files.filter(file => {
    if (!file || !file.name) return false
    const ext = `.${file.name.split('.').pop().toLowerCase()}`
    return accepted.includes(ext)
  })

  if (validFiles.length !== files.length) internalError.value = 'Tipo de archivo no permitido'
  else if (props.required && validFiles.length === 0) internalError.value = 'Este campo es obligatorio'
  else internalError.value = ''

  fileList.value = files
  emit('update:modelValue', props.multiple ? files : files[0])

  return validFiles.length === files.length
}

function handleDrop(e) {
  dragging.value = false
  const files = Array.from(e.dataTransfer.files)
  if (validate(files)) internalError.value = ''
}

function handleInput(e) {
  const files = Array.from(e.target.files)
  if (validate(files)) internalError.value = ''
}

function triggerInput() { inputRef.value?.click() }

defineExpose({ validate })
</script>
