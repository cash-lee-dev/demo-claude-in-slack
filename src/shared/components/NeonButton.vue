<script setup>
defineProps({
  loading: Boolean,
  ghost: Boolean,
  type: { type: String, default: 'button' },
})
</script>

<template>
  <button class="neon-btn" :class="{ 'is-ghost': ghost, 'is-loading': loading }" :type="type" :disabled="loading" :aria-busy="loading">
    <slot />
    <span v-if="loading" class="bar" aria-hidden="true" />
  </button>
</template>

<style scoped>
.bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 40%;
  background: linear-gradient(90deg, transparent, var(--cyan), transparent);
  box-shadow: 0 0 10px var(--cyan);
  animation: load 0.9s ease-in-out infinite;
}
@keyframes load {
  from { transform: translateX(-100%); }
  to { transform: translateX(250%); }
}
</style>
