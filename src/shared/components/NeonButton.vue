<script setup>
defineProps({
  loading: Boolean,
  ghost: Boolean,
  type: { type: String, default: 'button' },
})
</script>

<template>
  <button
    :type="type"
    :disabled="loading"
    :aria-busy="loading"
    class="chamfer relative inline-flex items-center justify-center gap-[0.6em] overflow-hidden border font-display font-bold uppercase tracking-[0.28em] text-white indent-[0.28em] transition duration-200 before:absolute before:inset-0 before:-translate-x-[120%] before:bg-[linear-gradient(100deg,transparent_30%,rgb(255_255_255/0.45)_50%,transparent_70%)] hover:not-disabled:before:translate-x-[120%] hover:not-disabled:before:duration-700 active:not-disabled:translate-y-px active:not-disabled:scale-[0.985] active:not-disabled:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-neon-cyan disabled:cursor-progress disabled:saturate-80"
    :class="
      ghost
        ? 'border-neon-magenta bg-neon-magenta/10 px-[1.3em] py-[0.65em] text-xs shadow-neon-magenta hover:not-disabled:bg-linear-to-br hover:not-disabled:from-neon-magenta hover:not-disabled:to-neon-violet hover:not-disabled:shadow-neon-magenta-lg'
        : 'border-neon-violet bg-linear-to-br from-neon-violet/25 to-neon-blue/10 px-[1.8em] py-[0.95em] text-sm shadow-neon-violet hover:not-disabled:-translate-y-px hover:not-disabled:from-neon-violet hover:not-disabled:to-neon-blue hover:not-disabled:shadow-neon-violet-lg'
    "
  >
    <slot />
    <span
      v-if="loading"
      class="absolute bottom-0 left-0 h-[3px] w-2/5 animate-load bg-linear-to-r from-transparent via-neon-cyan to-transparent shadow-[0_0_10px_var(--color-neon-cyan)]"
      aria-hidden="true"
    />
  </button>
</template>
