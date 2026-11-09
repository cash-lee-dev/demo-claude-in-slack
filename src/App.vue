<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import router from './router/index.js'
import DoorTransition from './components/DoorTransition.vue'
import LocaleSwitcher from './components/LocaleSwitcher.vue'
import { doorState, routeAnnouncement, useRouteDoorTransition } from './composables/useDoorTransition.js'
import { useSessionWatcher } from './composables/useSession.js'
import { onLocaleStorageChange } from './i18n/index.js'

// 畫面顯示的路由與 URL 路由分離：門合上時才切換（見 useDoorTransition.js）
const displayRoute = useRouteDoorTransition(router)
useSessionWatcher(router)

// 跨分頁同步語系（只處理 neon.locale.v1，不會被 auth 的 neon.session.v1 觸發）
let stopLocaleSync = () => {}
onMounted(() => {
  stopLocaleSync = onLocaleStorageChange()
})
onBeforeUnmount(() => stopLocaleSync())
</script>

<template>
  <!-- 轉場期間 inert：連鍵盤也無法操作底下的畫面 -->
  <div :inert="doorState.active.value">
    <router-view :route="displayRoute" />
  </div>
  <DoorTransition />
  <!-- 語系切換器：刻意放在 :inert 包裝之外，每個頁面、轉場期間都可操作 -->
  <LocaleSwitcher />
  <!-- 螢幕閱讀器：換畫面後念出新頁面標題 -->
  <div class="sr-only" role="status" aria-live="polite">{{ routeAnnouncement }}</div>
</template>
