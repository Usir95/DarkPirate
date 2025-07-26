<script setup>
import { ref } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import ApplicationMark from '@/Components/ApplicationMark.vue'
import Dropdown from '@/Components/Dropdown.vue'
import DropdownLink from '@/Components/DropdownLink.vue'
import NavLink from '@/Components/NavLink.vue'

const props = defineProps({
    user: Object,
    hasTeamFeatures: Boolean,
    canCreateTeams: Boolean,
})

const showingNavigationDropdown = ref(false)
const isDark = ref(localStorage.getItem('theme') == 'dark')

const toggleDark = () => {
    const html = document.documentElement
    isDark.value = !isDark.value

    if (isDark.value) {
        html.classList.add('dark')
        localStorage.setItem('theme', 'dark')
    } else {
        html.classList.remove('dark')
        localStorage.setItem('theme', 'light')
    }
}

const switchToTeam = (team) => {
    router.put(route('current-team.update'), {
        team_id: team.id,
    }, {
        preserveState: false,
    })
}

const logout = () => {
    router.post(route('logout'))
}
</script>

<template>
    <header class="bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <!-- Logo -->
                <div class="flex items-center space-x-4">
                    <Link :href="route('dashboard')">
                        <ApplicationMark class="h-8 w-auto" />
                    </Link>

                    <!-- Navigation Links -->
                    <NavLink :href="route('dashboard')" :active="route().current('dashboard')">
                        Dashboard
                    </NavLink>
                </div>

                <!-- Right Section -->
                <div class="flex items-center space-x-4">
                    <!-- Dark Mode Toggle -->
                    <button class="inline-flex items-center px-3 py-1 text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600" @click="toggleDark">
                        {{ isDark ? '🌙 Oscuro' : '☀️ Claro' }}
                    </button>

                    <!-- Teams Dropdown -->
                    <Dropdown v-if="hasTeamFeatures" align="right" width="60">
                        <template #trigger>
                            <button
                                class="inline-flex items-center text-sm px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                                {{ user.current_team.name }}
                                <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </template>

                        <template #content>
                            <div class="px-4 py-2 text-xs text-gray-500 dark:text-gray-300">
                                Manage Team
                            </div>
                            <DropdownLink :href="route('teams.show', user.current_team)">Team Settings</DropdownLink>
                            <DropdownLink v-if="canCreateTeams" :href="route('teams.create')">Create New Team
                            </DropdownLink>
                            <div v-if="user.all_teams.length > 1"
                                class="border-t border-gray-200 dark:border-gray-700 mt-2"></div>
                            <div v-if="user.all_teams.length > 1"
                                class="px-4 py-2 text-xs text-gray-500 dark:text-gray-300">Switch Teams</div>
                            <template v-for="team in user.all_teams" :key="team.id">
                                <form @submit.prevent="switchToTeam(team)">
                                    <DropdownLink as="button">
                                        <div class="flex items-center">
                                            <svg v-if="team.id === user.current_team_id"
                                                class="text-green-500 h-4 w-4 mr-2" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M5 13l4 4L19 7" />
                                            </svg>
                                            {{ team.name }}
                                        </div>
                                    </DropdownLink>
                                </form>
                            </template>
                        </template>
                    </Dropdown>

                    <!-- User Dropdown -->
                    <Dropdown align="right" width="48">
                        <template #trigger>
                            <button class="flex items-center text-sm rounded-full focus:outline-none">
                                <img v-if="$page.props.jetstream.managesProfilePhotos" :src="user.profile_photo_url"
                                    alt="" class="h-8 w-8 rounded-full" />
                                <span v-else
                                    class="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-700 dark:text-white">
                                    {{ user.nombre }}
                                    <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 9l-7 7-7-7" />
                                    </svg>
                                </span>
                            </button>
                        </template>

                        <template #content>
                            <div class="px-4 py-2 text-xs text-gray-500 dark:text-gray-300">
                                Manage Account
                            </div>
                            <DropdownLink :href="route('profile.show')">Profile</DropdownLink>
                            <DropdownLink v-if="$page.props.jetstream.hasApiFeatures" :href="route('api-tokens.index')">
                                API Tokens
                            </DropdownLink>
                            <div class="border-t border-gray-200 dark:border-gray-700 mt-2"></div>
                            <form @submit.prevent="logout">
                                <DropdownLink as="button">Log Out</DropdownLink>
                            </form>
                        </template>
                    </Dropdown>
                </div>

                <!-- Hamburger Menu (Mobile) -->
                <div class="sm:hidden">
                    <button @click="showingNavigationDropdown = !showingNavigationDropdown">
                        <svg class="h-6 w-6 text-gray-600 dark:text-white" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path v-if="!showingNavigationDropdown" stroke-linecap="round" stroke-linejoin="round"
                                stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </header>
</template>
