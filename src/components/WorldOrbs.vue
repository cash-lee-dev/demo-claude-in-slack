<script setup>
import WorldOrb from './WorldOrb.vue'
</script>

<template>
  <nav class="flex flex-wrap items-start justify-center gap-x-[clamp(1.25rem,5vw,3.5rem)] gap-y-6" aria-label="世界入口">
    <!-- 海灘：天藍 + 白 -->
    <WorldOrb to="/beach" label="海灘" sub="BEACH" aria-label="進入海灘世界" accent="#4FC3F7" deep="#0288D1">
      <svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="size-full">
        <circle cx="24" cy="15" r="7" fill="#fff" fill-opacity="0.35" />
        <path d="M24 3v3M10 8l2 2M38 8l-2 2M4 15h3M41 15h3" />
        <path d="M4 31c4-5 8-5 10 0s6 5 10 0 8-5 10 0 6 5 10 0" />
        <path d="M4 40c4-5 8-5 10 0s6 5 10 0 8-5 10 0 6 5 10 0" />
      </svg>
    </WorldOrb>

    <!-- 宇宙：黑 + 紅 -->
    <WorldOrb to="/space" label="宇宙" sub="SPACE" aria-label="進入宇宙世界" accent="#FF1744" deep="#B71C1C" base="#0a0000">
      <svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="size-full">
        <circle cx="24" cy="24" r="10" fill="#FF1744" fill-opacity="0.45" />
        <ellipse cx="24" cy="24" rx="20" ry="6.5" transform="rotate(-20 24 24)" />
        <path d="M40 8l1.2 2.8L44 12l-2.8 1.2L40 16l-1.2-2.8L36 12l2.8-1.2z" fill="#fff" stroke="none" />
        <circle cx="8" cy="38" r="1.5" fill="#fff" stroke="none" />
      </svg>
    </WorldOrb>

    <!-- 森林：草綠深淺兩階 -->
    <WorldOrb to="/forest" label="森林" sub="FOREST" aria-label="進入森林世界" accent="#7CB342" deep="#1B5E20">
      <svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="size-full">
        <path d="M24 3L12 19h7L9 33h30L29 19h7z" fill="#7CB342" fill-opacity="0.55" />
        <path d="M24 33v12" />
      </svg>
    </WorldOrb>
  </nav>
</template>
