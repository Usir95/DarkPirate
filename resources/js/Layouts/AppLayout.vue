<script setup>
    import { Head } from '@inertiajs/vue3';
    import Banner from '@/Components/Banner.vue';
    import Header from '@/Components/Header.vue';

    defineProps({
        title: String,
    });
</script>

<template>
    <div>
        <Head :title="title" />
        <Banner />

        <div class="min-h-screen bg-[var(--color-background)]">
            <Header
                :user="$page.props.auth.user"
                :has-team-features="$page.props.jetstream.hasTeamFeatures"
                :can-create-teams="$page.props.jetstream.canCreateTeams"
            />

            <!-- Page Heading -->
                <header
                    v-if="$slots.header || $slots['header-left'] || $slots['header-right']"
                    class="mb-4 bg-[var(--color-surface)] border-b border-[var(--color-border)]"
                >
                <div class="px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <!-- Filtros u opciones -->
                    <div class="flex flex-wrap items-center gap-2">
                        <slot name="header-left" />
                    </div>

                    <!-- Botón principal -->
                    <div class="flex items-center">
                        <slot name="header-right" />
                    </div>
                </div>
            </header>


            <main>
                <slot />
            </main>
        </div>
    </div>
</template>
