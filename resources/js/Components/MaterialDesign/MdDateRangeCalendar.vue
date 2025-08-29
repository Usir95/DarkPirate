<template>
    <transition name="mdcal" appear>
        <div v-show="isShown" class="w-72 bg-[var(--color-surface)] rounded-xl shadow-lg p-4 select-none">
        <!-- Encabezado -->
        <div class="flex items-center justify-between mb-3">
            <button type="button" @click="prevMonth" class="text-gray-600 dark:text-gray-300 hover:text-primary">
            <i class="fas fa-chevron-left"></i>
            </button>
            <span class="font-semibold text-sm text-gray-800 dark:text-gray-100">
            {{ meses[mes] }} {{ anio }}
            </span>
            <button type="button" @click="nextMonth" class="text-gray-600 dark:text-gray-300 hover:text-primary">
            <i class="fas fa-chevron-right"></i>
            </button>
        </div>

        <!-- Días de la semana -->
        <div class="grid grid-cols-7 text-xs font-semibold text-center text-gray-500 dark:text-gray-400 mb-1">
            <div v-for="d in dias" :key="d">{{ d }}</div>
        </div>

        <!-- 6 filas x 7 columnas -->
        <div class="grid grid-cols-7 text-sm text-center">
            <div v-for="c in cells" :key="c.key" class="py-1.5">
            <!-- Habilitado -->
            <button
                v-if="!isDisabledDate(c.date)"
                type="button"
                @click="pick(c.date)"
                :class="[
                'w-8 h-8 rounded-full flex items-center justify-center transition duration-150',
                c.inRange ? 'bg-[var(--color-primary)] text-white font-semibold' : '',
                !c.inRange ? 'hover:bg-[var(--color-primary-light)]/20' : '',
                c.isToday && !c.inRange ? 'text-[var(--color-primary)] font-bold' : '',
                c.otherMonth ? 'text-[var(--field-placeholder)]/70' : ''
                ]"
            >
                {{ c.date.date() }}
            </button>

            <!-- Deshabilitado -->
            <span
                v-else
                class="w-8 h-8 flex items-center justify-center opacity-40 cursor-not-allowed text-[var(--field-placeholder)]"
                :class="c.otherMonth ? 'text-[var(--field-placeholder)]/70' : ''"
            >
                {{ c.date.date() }}
            </span>
            </div>
        </div>

        <div class="mt-4 flex justify-end">
            <button type="button" @click="$emit('clear')" class="text-xs text-gray-500 hover:text-red-500">
            Limpiar
            </button>
        </div>
        </div>
    </transition>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
    modelValue: { type: Object, default: () => ({ start: '', end: '' }) },
    minDate: String,
    maxDate: String,
    disabledDates: Array,
    disabledWeekdays: Array,
    autoCloseDelay: { type: Number, default: 3500 }
})
const emit = defineEmits(['update:modelValue', 'close', 'clear'])

const isShown = ref(true)
let closeTimer

const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const dias  = ['dom','lun','mar','mié','jue','vie','sáb']

const today = dayjs()
const init  = props.modelValue.start ? dayjs(props.modelValue.start) : today
const anio  = ref(init.year())
const mes   = ref(init.month())

const seleccion = ref({ ...props.modelValue })
watch(() => props.modelValue, v => { seleccion.value = { ...(v || { start:'', end:'' }) } })

const start = computed(() => seleccion.value.start ? dayjs(seleccion.value.start) : null)
const end   = computed(() => seleccion.value.end   ? dayjs(seleccion.value.end)   : null)
const startMinus1 = computed(() => start.value ? start.value.subtract(1,'day') : null)
const endPlus1    = computed(() => end.value   ? end.value.add(1,'day')        : null)

const minD = computed(() => props.minDate ? dayjs(props.minDate) : null)
const maxD = computed(() => props.maxDate ? dayjs(props.maxDate) : null)
const disabledSet = computed(() => new Set((props.disabledDates || []).map(d => dayjs(d).format('YYYY-MM-DD'))))

const monthStart = computed(() => dayjs(new Date(anio.value, mes.value, 1)))
const weekPad    = computed(() => monthStart.value.day())
const gridStart  = computed(() => monthStart.value.subtract(weekPad.value, 'day'))

const cells = computed(() => {
    const arr = []
    for (let i = 0; i < 42; i++) {
        const date = gridStart.value.add(i, 'day')
        arr.push({
        key: date.format('YYYY-MM-DD'),
        date,
        otherMonth: date.month() !== mes.value || date.year() !== anio.value,
        isToday: date.isSame(today, 'day'),
        inRange: inRangeDate(date)
        })
    }
    return arr
})

function inRangeDate(d) {
    if (start.value && !end.value) return d.isSame(start.value, 'day')
    if (start.value && end.value)
        return d.isAfter(startMinus1.value, 'day') && d.isBefore(endPlus1.value, 'day')
    return false
}

function isDisabledDate(d) {
    if (minD.value && d.isBefore(minD.value, 'day')) return true
    if (maxD.value && d.isAfter(maxD.value, 'day')) return true
    if ((props.disabledWeekdays || []).includes(d.day())) return true
    if (disabledSet.value.has(d.format('YYYY-MM-DD'))) return true
    return false
}

function prevMonth(){ const m = monthStart.value.subtract(1,'month'); anio.value = m.year(); mes.value = m.month() }
function nextMonth(){ const m = monthStart.value.add(1,'month');       anio.value = m.year(); mes.value = m.month() }

function pick(d){
    if (!seleccion.value.start || seleccion.value.end){
        seleccion.value = { start: d.format('YYYY-MM-DD'), end: '' }
    } else {
        const s = start.value
        if (d.isBefore(s, 'day')) {
            seleccion.value = { start: d.format('YYYY-MM-DD'), end: s.format('YYYY-MM-DD') }
        } else {
            seleccion.value.end = d.format('YYYY-MM-DD')
        }
        emit('update:modelValue', { ...seleccion.value })
        // fade-out + cierre diferido
        isShown.value = false
        if (closeTimer) clearTimeout(closeTimer)
        closeTimer = setTimeout(() => emit('close'), props.autoCloseDelay)
    }
}

onBeforeUnmount(() => { if (closeTimer) clearTimeout(closeTimer) })
</script>

<style scoped>
.mdcal-enter-active,
.mdcal-leave-active { transition: opacity .85s ease, transform .93s ease; }
.mdcal-enter-from,
.mdcal-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }
</style>
