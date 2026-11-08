<script setup>
import WorldOrb from './WorldOrb.vue'

// 資料驅動：每個世界一個獨立物件（路徑、標籤、配色、圖示），新增 / 調整世界只動自己那一段。
// icon 為內嵌 SVG 圖形片段（viewBox 48x48，白色線條由 WorldOrb 提供），皆為此檔內寫死的常數字串，非使用者輸入。
const worlds = [
  {
    // 海灘：天藍 + 白
    to: '/beach',
    label: '海灘',
    sub: 'BEACH',
    accent: '#4FC3F7',
    base: '#014B73',
    icon: `<circle cx="24" cy="15" r="7" fill="#fff" fill-opacity="0.35" />
      <path d="M24 3v3M10 8l2 2M38 8l-2 2M4 15h3M41 15h3" />
      <path d="M4 31c4-5 8-5 10 0s6 5 10 0 8-5 10 0 6 5 10 0" />
      <path d="M4 40c4-5 8-5 10 0s6 5 10 0 8-5 10 0 6 5 10 0" />`,
  },
  {
    // 宇宙：黑 + 紅
    to: '/space',
    label: '宇宙',
    sub: 'SPACE',
    accent: '#FF1744',
    base: '#0a0000',
    icon: `<circle cx="24" cy="24" r="10" fill="#FF1744" fill-opacity="0.45" />
      <ellipse cx="24" cy="24" rx="20" ry="6.5" transform="rotate(-20 24 24)" />
      <path d="M40 8l1.2 2.8L44 12l-2.8 1.2L40 16l-1.2-2.8L36 12l2.8-1.2z" fill="#fff" stroke="none" />
      <circle cx="8" cy="38" r="1.5" fill="#fff" stroke="none" />`,
  },
  {
    // 森林：草綠深淺兩階
    to: '/forest',
    label: '森林',
    sub: 'FOREST',
    accent: '#7CB342',
    base: '#0F3412',
    icon: `<path d="M24 3L12 19h7L9 33h30L29 19h7z" fill="#7CB342" fill-opacity="0.55" />
      <path d="M24 33v12" />`,
  },
]
</script>

<template>
  <nav class="flex flex-wrap items-start justify-center gap-x-[clamp(1.25rem,5vw,3.5rem)] gap-y-6" aria-label="世界入口">
    <WorldOrb
      v-for="w in worlds"
      :key="w.to"
      :to="w.to"
      :label="w.label"
      :sub="w.sub"
      :accent="w.accent"
      :base="w.base"
      :aria-label="`進入${w.label}世界`"
    >
      <g v-html="w.icon" />
    </WorldOrb>
  </nav>
</template>
