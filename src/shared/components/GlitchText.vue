<script setup>
defineProps({
  text: { type: String, required: true },
  tag: { type: String, default: 'span' },
  fast: Boolean,
})
</script>

<template>
  <component :is="tag" class="glitch" :class="{ '[--glitch-dur:1.6s]': fast }" :data-text="text">{{ text }}</component>
</template>
