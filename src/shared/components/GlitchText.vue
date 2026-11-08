<script setup>
defineProps({
  text: { type: String, required: true },
  tag: { type: String, default: 'span' },
  fast: Boolean,
})
</script>

<template>
  <component :is="tag" class="glitch" :class="{ 'glitch-fast': fast }" :data-text="text">{{ text }}</component>
</template>
