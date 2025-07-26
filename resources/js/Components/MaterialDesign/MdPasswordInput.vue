<template>
    <div class="relative w-full my-3 px-1" data-md-input="true" ref="rootRef">
        <!-- Label -->
        <label
            v-if="label"
            :for="id"
            class="md-label"
            :class="[
                isFocused || internalValue
                    ? `text-[0.75rem] -top-2.5 scale-90 ${GetLabelColor(props.error)}`
                    : 'md-label--unfocused',
                iconClass ? 'md-label--with-icon' : 'md-label--no-icon',
            ]"
        >
            <IconAsterisk v-if="required && !internalValue && !errorText" />
            <IconCheck v-else-if="success && !errorText" />
            <IconError v-else-if="errorText" />
            {{ label }}
        </label>

        <!-- Icono izquierdo -->
        <IconInput v-if="iconClass" :icon-class="iconClass" :color="borderColor" />

        <!-- Input password -->
        <input
            :id="id"
            :type="isPasswordVisible ? 'text' : 'password'"
            :name="name"
            :value="internalValue"
            :disabled="disabled"
            :readonly="readonly"
            :minlength="minlength"
            :maxlength="maxlength"
            ref="inputRef"
            @focus="onFocus"
            @blur="onBlur"
            @input="updateValue($event.target.value)"
            :class="[
                'w-full h-10 border-2 rounded-xl text-gray-800 dark:text-gray-100 placeholder-white',
                'focus:outline-none transition-all duration-300 ease-in-out shadow-sm focus:shadow-md',
                inputPadding,
                {
                    'opacity-50 cursor-not-allowed': disabled || readonly,
                },
            ]"
            :style="{
                backgroundColor: 'var(--color-background)',
                borderColor,
                transition: 'border-color 0.3s ease, background-color 0.3s ease',
            }"
        />

        <!-- Toggle visibility -->
        <button
            type="button"
            class="absolute right-4 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            :style="{ top: errorText ? 'calc(1/2 * 47%)' : 'calc(1/2 * 67%)' }"
            @click="toggleVisibility"
            tabindex="-1"
        >
            <svg
                v-if="!isPasswordVisible"
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
            </svg>
            <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M3 3l18 18" />
                <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path
                    d="M12 5c-4.5 0-8.268 2.943-9.542 7 1.274 4.057 5.065 7 9.542 7 4.477 0 8.268-2.943 9.542-7A10.056 10.056 0 0 0 12 5Z"
                />
            </svg>
        </button>

        <!-- Error o ayuda -->
        <div class="flex items-center justify-between text-xs px-1 mt-1 leading-tight">
            <InputError :error-text="errorText" :helper="helper" />
        </div>
    </div>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import IconClear from '../Icons/IconClear.vue';
    import IconCheck from '../Icons/IconCheck.vue';
    import IconError from '../Icons/IconError.vue';
    import IconAsterisk from '../Icons/IconAsterisk.vue';
    import IconInput from '../Icons/IconInput.vue';
    import InputError from './InputError.vue';
    import {
        GetLabelColor,
        GetBorderColor,
        GetErrorText,
        GetValidationMessage,
    } from '@/Utils/InputUtils.js';

    const props = defineProps({
        id: String,
        name: String,
        modelValue: String,
        required: Boolean,
        label: String,
        disabled: Boolean,
        readonly: Boolean,
        error: [Boolean, String, Array],
        success: Boolean,
        iconClass: String,
        helper: String,
        minlength: Number,
        maxlength: Number,
    });

    const emit = defineEmits(['update:modelValue', 'focus', 'blur']);

    const isFocused = ref(false);
    const internalValue = ref(props.modelValue ?? '');
    const internalError = ref('');
    const inputRef = ref(null);
    const isPasswordVisible = ref(false);

    const inputPadding = computed(() => (props.iconClass ? 'pl-10 pr-10' : 'px-4 pr-10'));

    const borderColor = computed(() =>
        GetBorderColor({
            error: props.error,
            success: props.success,
            isFocused: isFocused.value,
            internalError: internalError.value,
        })
    );

    const errorText = computed(() =>
        GetErrorText({ error: props.error, internalError: internalError.value })
    );

    function updateValue(val) {
        if (val !== internalValue.value) {
            internalValue.value = val;
            emit('update:modelValue', val);
        }
    }

    function validate() {
        const result = GetValidationMessage({
            value: internalValue.value,
            required: props.required,
            minlength: props.minlength,
            maxlength: props.maxlength,
        });
        internalError.value = result;
        return result === '';
    }

    function onFocus(e) {
        isFocused.value = true;
        emit('focus', e);
    }

    function onBlur(e) {
        isFocused.value = false;
        validate();
        emit('blur', e);
    }

    function toggleVisibility() {
        isPasswordVisible.value = !isPasswordVisible.value;
    }
</script>
