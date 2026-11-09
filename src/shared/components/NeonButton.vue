<script setup>
defineProps({
  loading: Boolean,
  ghost: Boolean,
  beach: Boolean, // 海灘世界配色（天藍 / 白），其餘行為相同
  space: Boolean, // 宇宙世界配色（黑 / 紅），其餘行為相同
  type: { type: String, default: 'button' },
})
</script>

<template>
  <button
    :type="type"
    :disabled="loading"
    :aria-busy="loading"
    class="chamfer relative inline-flex items-center justify-center gap-[0.6em] overflow-hidden border font-display font-bold uppercase tracking-[0.28em] text-white indent-[0.28em] transition duration-200 before:absolute before:inset-0 before:-translate-x-[120%] before:bg-[linear-gradient(100deg,transparent_30%,rgb(255_255_255/0.45)_50%,transparent_70%)] hover:not-disabled:before:translate-x-[120%] hover:not-disabled:before:duration-700 active:not-disabled:translate-y-px active:not-disabled:scale-[0.985] active:not-disabled:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-[3px] disabled:cursor-progress disabled:saturate-80"
    :class="
      space
        ? 'border-space-neon bg-linear-to-br from-space-neon/25 to-space-crimson/15 px-[1.8em] py-[0.95em] text-sm shadow-space-glow focus-visible:outline-space-neon hover:not-disabled:-translate-y-px hover:not-disabled:from-space-crimson hover:not-disabled:to-[#8e1212] hover:not-disabled:shadow-space-glow-lg'
        : beach
        ? 'border-beach-neon focus-visible:outline-neon-cyan bg-linear-to-br from-beach-neon/25 to-beach-sea/15 px-[1.8em] py-[0.95em] text-sm shadow-beach-glow hover:not-disabled:-translate-y-px hover:not-disabled:from-beach-neon hover:not-disabled:to-beach-sea hover:not-disabled:shadow-beach-glow-lg'
        : ghost
        ? 'border-neon-magenta focus-visible:outline-neon-cyan bg-neon-magenta/10 px-[1.3em] py-[0.65em] text-xs shadow-neon-magenta hover:not-disabled:bg-linear-to-br hover:not-disabled:from-neon-magenta hover:not-disabled:to-neon-violet hover:not-disabled:shadow-neon-magenta-lg'
        : 'border-neon-violet focus-visible:outline-neon-cyan bg-linear-to-br from-neon-violet/25 to-neon-blue/10 px-[1.8em] py-[0.95em] text-sm shadow-neon-violet hover:not-disabled:-translate-y-px hover:not-disabled:from-neon-violet hover:not-disabled:to-neon-blue hover:not-disabled:shadow-neon-violet-lg'
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
