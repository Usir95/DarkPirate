<template>
    <div class="relative w-full my-3 px-1" data-md-input="true" ref="rootRef">
        <!-- Label flotante -->
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

        <!-- Icono izquierdo (slot o clase) -->
        <IconInput v-if="iconClass" :icon-class="iconClass" :color="borderColor" />

        <!-- Input principal -->
        <input
            :id="id"
            type="email"
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

        <!-- Error o ayuda + contador -->
        <div class="flex items-center justify-between text-xs px-1 mt-1 leading-tight">
            <InputError :error-text="errorText" :helper="helper" />
            <CharCounter
                v-if="showCharCounter"
                :length="internalValue.length"
                :maxlength="maxlength"
                :color="charCountColor"
                :show="showCharCounter"
            />
        </div>

        <IconClear
            v-if="internalValue && !readonly && !disabled"
            :top="errorText ? 'calc(1/2 * 55%)' : 'calc(1/2 * 73%)'"
            @click="limpiar"
        />
    </div>
</template>

<script setup>
    import { ref, watch, computed, onBeforeUnmount } from 'vue';
    import debounce from 'lodash.debounce';
    import IconClear from '../Icons/IconClear.vue';
    import IconCheck from '../Icons/IconCheck.vue';
    import IconError from '../Icons/IconError.vue';
    import IconAsterisk from '../Icons/IconAsterisk.vue';
    import IconInput from '../Icons/IconInput.vue';
    import InputError from './InputError.vue';
    import CharCounter from './CharCounter.vue';
    import {
        GetValidationMessage,
        GetLabelColor,
        GetBorderColor,
        GetCharCountColor,
        GetErrorText,
    } from '@/Utils/InputUtils.js';

    const props = defineProps({
        id: String,
        name: String,
        modelValue: { type: String, default: '' },
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
    const showCharCounter =
        typeof props.maxlength === 'number' && !props.readonly && !props.disabled;

    watch(
        () => props.modelValue,
        (val) => {
            internalValue.value = val;
        }
    );

    const inputPadding = computed(() => (props.iconClass ? 'pl-10 pr-4' : 'px-4'));

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

    const charCountColor = computed(() =>
        GetCharCountColor(internalValue.value?.length, props.maxlength)
    );

    const debouncedEmit = debounce((val) => {
        emit('update:modelValue', val);
    }, 250);

    function updateValue(val) {
        if (val !== internalValue.value) {
            internalValue.value = val;
            debouncedEmit(val);
        }
    }

    function RunValidation() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const result = GetValidationMessage({
            value: internalValue.value,
            required: props.required,
            minlength: props.minlength,
            maxlength: props.maxlength,
            regex: emailRegex,
        });
        internalError.value = result;
        return result === '';
    }

    function validate() {
        return RunValidation();
    }

    function onBlur(e) {
        isFocused.value = false;
        RunValidation();
        emit('blur', e);
    }

    function onFocus(e) {
        isFocused.value = true;
        emit('focus', e);
    }

    function limpiar() {
        internalValue.value = '';
        emit('update:modelValue', '');
    }

    onBeforeUnmount(() => {
        debouncedEmit.cancel();
    });

    defineExpose({ validate });
</script>
