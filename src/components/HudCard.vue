<script setup>
defineProps({
  title: { type: String, required: true },
  beach: Boolean, // 海灘世界配色（天藍 / 白）
})
</script>

<template>
  <article
    class="chamfer-hud relative border px-3 pt-3 pb-2.5 backdrop-blur-[10px] transition duration-200 before:absolute before:top-0 before:left-0 before:size-3.5 before:border-2 before:border-r-0 before:border-b-0 before:border-neon-cyan before:drop-shadow-[0_0_4px_var(--color-neon-cyan)] after:absolute after:right-0 after:bottom-0 after:size-3.5 after:border-2 after:border-t-0 after:border-l-0 after:border-neon-cyan after:drop-shadow-[0_0_4px_var(--color-neon-cyan)] hover:-translate-y-[3px] hover:border-neon-cyan sm:px-[18px] sm:pt-4 sm:pb-3.5"
    :class="beach ? 'border-beach-neon/40 bg-[rgb(1_11_38/0.6)] shadow-beach-hud' : 'border-neon-violet/35 bg-[rgb(10_8_40/0.62)] shadow-neon-hud'"
  >
    <h2
      class="m-0 mb-2 font-display text-[0.68rem] tracking-[0.28em]"
      :class="beach ? 'text-beach-neon text-shadow-beach-sm' : 'text-neon-violet text-shadow-neon-label'"
    >{{ title }}</h2>
    <slot />
  </article>
</template>
