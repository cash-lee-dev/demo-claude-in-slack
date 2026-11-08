<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import NeonBackdrop from '../../shared/components/NeonBackdrop.vue'
import GlitchText from '../../shared/components/GlitchText.vue'
import Typewriter from '../../shared/components/Typewriter.vue'
import NeonButton from '../../shared/components/NeonButton.vue'
import HudCard from './HudCard.vue'
import { logout, getSession, onSessionStorageChange } from '../../shared/auth.js'
import { goTo } from '../../shared/nav.js'

const props = defineProps({
  session: { type: Object, required: true },
})

const now = ref(Date.now())
const ping = ref(12)
const bars = ref(Array.from({ length: 16 }, () => 30 + Math.random() * 70))
let timer = 0
let stopStorage = () => {}

const pad = (n) => String(n).padStart(2, '0')
const fmtDuration = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

const clock = computed(() => {
  const d = new Date(now.value)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})
const dateStr = computed(() => {
  const d = new Date(now.value)
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
})
const remaining = computed(() => fmtDuration(props.session.exp - now.value))
const uptime = computed(() => fmtDuration(now.value - props.session.iat))
const expiresAt = computed(() => {
  const d = new Date(props.session.exp)
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
})
const bigCls = 'm-0 font-display text-[clamp(1.1rem,2.2vw,1.5rem)] font-bold tracking-[0.1em] break-words'
const metaCls = 'm-0 mt-2 font-mono text-[0.68rem] tracking-[0.06em] text-dim sm:text-[0.78rem] sm:tracking-[0.12em]'
const userName = computed(() => props.session.u.toUpperCase())

async function checkSession() {
  // 過期或其他分頁已登出 -> 回登入頁
  if (!(await getSession())) goTo('login')
}

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
    if (now.value % 3 === 0 || Math.random() > 0.6) {
      ping.value = 8 + Math.floor(Math.random() * 22)
      bars.value = bars.value.map(() => 25 + Math.random() * 75)
    }
    if (now.value >= props.session.exp) checkSession()
  }, 1000)
  stopStorage = onSessionStorageChange(checkSession)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  stopStorage()
})
</script>

<template>
  <NeonBackdrop sun skyline />

  <div class="relative z-10 grid min-h-dvh grid-rows-[auto_1fr_auto] px-[clamp(16px,4vw,48px)] pb-[clamp(16px,3vw,32px)]">
    <header class="flex items-center justify-between gap-4 py-[18px]">
      <div class="hidden font-display text-[0.85rem] font-bold tracking-[0.3em] text-neon-cyan text-shadow-neon-cyan sm:block">NEON//GRID</div>
      <div class="flex flex-col items-center leading-[1.1]" aria-label="Local time">
        <span class="font-mono text-[clamp(1.3rem,3.2vw,1.9rem)] tracking-[0.12em] text-neon-white text-shadow-neon-violet">{{ clock }}</span>
        <span class="font-mono text-xs tracking-[0.3em] text-dim">{{ dateStr }}</span>
      </div>
      <NeonButton ghost @click="logout">LOGOUT</NeonButton>
    </header>

    <main class="flex flex-col items-center justify-center gap-4 pt-6 pb-2 text-center">
      <p class="m-0 flex flex-wrap justify-center gap-[0.6em] border border-neon-violet/35 bg-ink/60 px-4 py-1.5 font-display text-[clamp(0.8rem,2.2vw,1.05rem)] tracking-[0.3em] backdrop-blur-[6px]">
        <span class="text-neon-magenta text-shadow-neon-magenta">// WELCOME BACK,</span>
        <span class="text-neon-cyan text-shadow-neon-cyan">{{ userName }}</span>
      </p>
      <h1 class="m-0 animate-float font-display text-[clamp(2.6rem,10.5vw,9rem)] leading-[1.02] font-black tracking-[0.02em] text-balance">
        <GlitchText class="animate-glitch-skew text-neon-white text-shadow-neon-violet" text="This is Your World!" />
      </h1>
      <p class="m-0 min-h-[1.6em] bg-ink/55 px-3 py-0.5 font-mono text-[clamp(0.9rem,2vw,1.15rem)] text-neon-cyan text-shadow-neon-cyan">
        <span class="mr-[0.4em] text-neon-magenta">&gt;</span>
        <Typewriter :lines="['the grid never sleeps.', 'all systems nominal. jack in deeper.', '這裡是你的世界。']" />
      </p>
    </main>

    <section class="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4" aria-label="System status">
      <HudCard title="SYSTEM">
        <p class="m-0 flex items-center gap-2.5 font-display text-[clamp(1.1rem,2.2vw,1.5rem)] font-bold tracking-[0.1em] text-neon-green text-shadow-neon-green">
          <span class="size-2.5 animate-pulse-dot rounded-full bg-neon-green shadow-[0_0_10px_var(--color-neon-green),0_0_22px_var(--color-neon-green)]" />ONLINE
        </p>
        <p :class="metaCls">UPTIME T+{{ uptime }}</p>
      </HudCard>

      <HudCard title="OPERATOR">
        <p :class="[bigCls, 'text-neon-cyan text-shadow-neon-cyan']">{{ userName }}</p>
        <p :class="metaCls">CLEARANCE: {{ session.role.toUpperCase() }}</p>
      </HudCard>

      <HudCard title="SESSION EXPIRES">
        <p :class="[bigCls, 'text-neon-magenta text-shadow-neon-magenta']">{{ remaining }}</p>
        <p :class="metaCls">AT {{ expiresAt }}</p>
      </HudCard>

      <HudCard title="GRID SYNC">
        <div class="flex h-7 items-end gap-[3px]" aria-hidden="true">
          <i
            v-for="(b, i) in bars"
            :key="i"
            class="flex-1 bg-linear-to-b from-neon-cyan to-neon-violet shadow-[0_0_6px_rgb(0_229_255/0.6)] transition-[height] duration-[900ms] ease-in-out"
            :style="{ height: b + '%' }"
          />
        </div>
        <p :class="metaCls">LATENCY {{ ping }} ms</p>
      </HudCard>
    </section>
  </div>
</template>
