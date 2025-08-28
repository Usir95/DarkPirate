<template>
    <div class="w-72 rounded-xl shadow-lg p-4 select-none
                bg-[var(--color-surface)] text-[var(--color-foreground)] border border-[var(--color-border)]">

        <!-- Encabezado -->
        <div class="flex items-center justify-between mb-3">
        <button @click="prevMonth"
                class="opacity-80 text-[var(--color-foreground)] hover:text-[var(--color-primary)]">
            <i class="fas fa-chevron-left"></i>
        </button>

        <span class="font-semibold text-sm text-[var(--color-foreground)]">
            {{ meses[mes] }} {{ anio }}
        </span>

        <button @click="nextMonth"
                class="opacity-80 text-[var(--color-foreground)] hover:text-[var(--color-primary)]">
            <i class="fas fa-chevron-right"></i>
        </button>
        </div>

        <!-- Días de la semana -->
        <div class="grid grid-cols-7 text-xs font-semibold text-center text-[var(--field-placeholder)] mb-1">
        <div v-for="d in dias" :key="d">{{ d }}</div>
        </div>

        <!-- Días del mes -->
        <div class="grid grid-cols-7 text-sm text-center">
        <div v-for="(d, index) in diasCalendario" :key="index" class="py-1.5">
            <!-- Día válido -->
            <button
            v-if="d && !estaDeshabilitado(d)"
            @click="seleccionarDia(d)"
            :class="[
                'w-8 h-8 rounded-full flex items-center justify-center transition duration-200',
                esSeleccionado(d)
                ? 'bg-[var(--color-primary)] text-white font-semibold ring-2 ring-[var(--color-surface)]'
                : 'hover:bg-[color:color-mix(in_srgb,var(--color-primary-light)_20%,transparent)]',
                esHoy(d) && !esSeleccionado(d) ? 'text-[var(--color-primary)] font-bold' : ''
            ]"
            >
            {{ d }}
            </button>

            <!-- Día deshabilitado -->
            <span v-else-if="d"
                class="w-8 h-8 flex items-center justify-center text-[var(--field-placeholder)] opacity-40 cursor-not-allowed">
            {{ d }}
            </span>

            <!-- Vacío -->
            <span v-else></span>
        </div>
        </div>

        <!-- Limpiar -->
        <div class="mt-4 flex justify-end">
        <button @click="$emit('clear')"
                class="text-xs text-[var(--field-placeholder)] hover:text-[var(--color-complement-2)]">
            Limpiar
        </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
    modelValue: String,
    minDate: String,
    maxDate: String,
    disabledDates: Array,
    disabledWeekdays: Array
})

const emit = defineEmits(['update:modelValue', 'close', 'clear'])

const hoy = dayjs()
const fechaActual = props.modelValue ? dayjs(props.modelValue) : hoy

const anio = ref(fechaActual.year())
const mes = ref(fechaActual.month()) // 0-indexed
const diaSeleccionado = ref(fechaActual.date())

const dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

const diasCalendario = computed(() => {
    const inicioMes = dayjs(`${anio.value}-${mes.value + 1}-01`)
    const totalDias = inicioMes.daysInMonth()
    const primerDiaSemana = inicioMes.day()

    const diasArray = []

    for (let i = 0; i < primerDiaSemana; i++) {
        diasArray.push(null)
    }

    for (let d = 1; d <= totalDias; d++) {
        diasArray.push(d)
    }

    return diasArray
})

function esHoy(d) {
    return hoy.date() === d && hoy.month() === mes.value && hoy.year() === anio.value
}

function esSeleccionado(d) {
    const actual = dayjs(props.modelValue)
    return (
        actual.date() === Number(d) &&
        actual.month() === mes.value &&
        actual.year() === anio.value
    )
}

function seleccionarDia(d) {
    diaSeleccionado.value = d
    const fechaSeleccionada = dayjs().year(anio.value).month(mes.value).date(d).format('YYYY-MM-DD')
    emit('update:modelValue', fechaSeleccionada)
    emit('close')
}

function estaDeshabilitado(d) {
    const fecha = dayjs().year(anio.value).month(mes.value).date(d)

    if (props.minDate && fecha.isBefore(dayjs(props.minDate), 'day')) return true
    if (props.maxDate && fecha.isAfter(dayjs(props.maxDate), 'day')) return true
    if (Array.isArray(props.disabledDates) && props.disabledDates.some(fd => dayjs(fd).isSame(fecha, 'day'))) return true
    if (Array.isArray(props.disabledWeekdays) && props.disabledWeekdays.includes(fecha.day())) return true

    return false
}

function prevMonth() {
    const newDate = dayjs().year(anio.value).month(mes.value).date(1).subtract(1, 'month')
    anio.value = newDate.year()
    mes.value = newDate.month()
}

function nextMonth() {
    const newDate = dayjs().year(anio.value).month(mes.value).date(1).add(1, 'month')
    anio.value = newDate.year()
    mes.value = newDate.month()
}
</script>
