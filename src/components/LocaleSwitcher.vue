<script setup>
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n/index.js'

const { t, locale } = useI18n()

// 顯示文字固定（EN | 中），aria-label 用各語言的原生名稱，不隨目前語系翻譯
const options = [
  { code: 'en', text: 'EN', label: 'English', lang: 'en' },
  { code: 'zh-TW', text: '中', label: '繁體中文', lang: 'zh-TW' },
]
</script>

<template>
  <!--
    全域語系切換器（App 層級、在 :inert 包裝之外，所以轉場期間仍可點擊 / Tab）。
    z-index 10000 高於 DoorTransition 的 9999：轉場時浮在門板之上。
  -->
  <div
    class="locale-switcher fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-[10000] inline-flex items-stretch overflow-hidden rounded-sm border border-neon-violet/60 bg-[rgb(5_4_22/0.82)] font-display text-[0.72rem] font-bold tracking-[0.12em] shadow-neon-violet backdrop-blur-[6px]"
    role="group"
    :aria-label="t('switcher.group')"
  >
    <template v-for="(o, i) in options" :key="o.code">
      <span v-if="i > 0" class="w-px self-stretch bg-neon-violet/50" aria-hidden="true" />
      <button
        type="button"
        class="min-h-8 min-w-10 cursor-pointer border-0 bg-transparent px-2.5 py-1.5 text-dim transition-colors duration-150 hover:text-white focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neon-cyan pointer-coarse:min-h-11 pointer-coarse:min-w-11"
        :class="locale === o.code && 'text-neon-cyan! bg-neon-cyan/10 text-shadow-neon-cyan'"
        :aria-label="o.label"
        :aria-pressed="locale === o.code"
        :lang="o.lang"
        @click="setLocale(o.code)"
      >
        {{ o.text }}
      </button>
    </template>
  </div>
</template>
