<script setup>
import router from './router/index.js'
import DoorTransition from './components/DoorTransition.vue'
import { doorState, routeAnnouncement, useRouteDoorTransition } from './composables/useDoorTransition.js'
import { useSessionWatcher } from './composables/useSession.js'

// 畫面顯示的路由與 URL 路由分離：門合上時才切換（見 useDoorTransition.js）
const displayRoute = useRouteDoorTransition(router)
useSessionWatcher(router)
</script>

<template>
  <!-- 轉場期間 inert：連鍵盤也無法操作底下的畫面 -->
  <div :inert="doorState.active.value">
    <router-view :route="displayRoute" />
  </div>
  <DoorTransition />
  <!-- 螢幕閱讀器：換畫面後念出新頁面標題 -->
  <div class="sr-only" role="status" aria-live="polite">{{ routeAnnouncement }}</div>
</template>
