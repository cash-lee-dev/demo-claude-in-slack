<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import NeonBackdrop from '../../shared/components/NeonBackdrop.vue'
import GlitchText from '../../shared/components/GlitchText.vue'
import Typewriter from '../../shared/components/Typewriter.vue'
import NeonButton from '../../shared/components/NeonButton.vue'
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

  <div class="layout">
    <header class="top">
      <div class="brand neon-cyan">NEON//GRID</div>
      <div class="clock" aria-label="Local time">
        <span class="time neon-text">{{ clock }}</span>
        <span class="date">{{ dateStr }}</span>
      </div>
      <NeonButton ghost class="logout" @click="logout">LOGOUT</NeonButton>
    </header>

    <main class="hero">
      <p class="welcome">
        <span class="neon-magenta">// WELCOME BACK,</span>
        <span class="neon-cyan user">{{ userName }}</span>
      </p>
      <h1 class="headline">
        <GlitchText class="neon-text glitch-skew" text="This is Your World!" />
      </h1>
      <p class="sub">
        <span class="prompt">&gt;</span>
        <Typewriter :lines="['the grid never sleeps.', 'all systems nominal. jack in deeper.', '這裡是你的世界。']" />
      </p>
    </main>

    <section class="hud" aria-label="System status">
      <article class="card">
        <h2>SYSTEM</h2>
        <p class="big online"><span class="dot" />ONLINE</p>
        <p class="meta">UPTIME T+{{ uptime }}</p>
      </article>

      <article class="card">
        <h2>OPERATOR</h2>
        <p class="big neon-cyan">{{ userName }}</p>
        <p class="meta">CLEARANCE: {{ session.role.toUpperCase() }}</p>
      </article>

      <article class="card">
        <h2>SESSION EXPIRES</h2>
        <p class="big neon-magenta">{{ remaining }}</p>
        <p class="meta">AT {{ expiresAt }}</p>
      </article>

      <article class="card">
        <h2>GRID SYNC</h2>
        <div class="bars" aria-hidden="true">
          <i v-for="(b, i) in bars" :key="i" :style="{ height: b + '%' }" />
        </div>
        <p class="meta">LATENCY {{ ping }} ms</p>
      </article>
    </section>
  </div>
</template>

<style scoped>
.layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 0 clamp(16px, 4vw, 48px) clamp(16px, 3vw, 32px);
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 0;
}
.brand {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: 0.3em;
  font-size: 0.85rem;
}
.clock {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
}
.time {
  font-family: var(--font-mono);
  font-size: clamp(1.3rem, 3.2vw, 1.9rem);
  letter-spacing: 0.12em;
}
.date {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.3em;
  color: var(--muted);
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px 0 8px;
  text-align: center;
}
.welcome {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6em;
  margin: 0;
  padding: 6px 16px;
  background: rgba(7, 6, 26, 0.6);
  border: 1px solid rgba(123, 97, 255, 0.35);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  font-family: var(--font-display);
  font-size: clamp(0.8rem, 2.2vw, 1.05rem);
  letter-spacing: 0.3em;
}
.headline {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(2.6rem, 10.5vw, 9rem);
  line-height: 1.02;
  letter-spacing: 0.02em;
  text-wrap: balance;
  animation: float 7s ease-in-out infinite;
}
@keyframes float {
  50% { transform: translateY(-8px); }
}
.sub {
  margin: 0;
  min-height: 1.6em;
  font-family: var(--font-mono);
  padding: 2px 12px;
  background: rgba(7, 6, 26, 0.55);
  font-size: clamp(0.9rem, 2vw, 1.15rem);
  color: var(--cyan);
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.55);
}
.prompt { color: var(--magenta); margin-right: 0.4em; }

.hud {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.card {
  position: relative;
  padding: 16px 18px 14px;
  background: rgba(10, 8, 40, 0.62);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
  box-shadow: inset 0 0 24px rgba(123, 97, 255, 0.14);
  transition: border-color 0.25s, transform 0.25s;
}
.card::before,
.card::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid var(--cyan);
  filter: drop-shadow(0 0 4px var(--cyan));
}
.card::before { top: 0; left: 0; border-right: 0; border-bottom: 0; }
.card::after { bottom: 0; right: 0; border-left: 0; border-top: 0; }
.card:hover { border-color: var(--cyan); transform: translateY(-3px); }
.card h2 {
  margin: 0 0 8px;
  font-family: var(--font-display);
  font-size: 0.68rem;
  letter-spacing: 0.28em;
  color: var(--violet);
  text-shadow: 0 0 8px rgba(123, 97, 255, 0.7);
}
.big {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.1rem, 2.2vw, 1.5rem);
  letter-spacing: 0.1em;
  overflow-wrap: anywhere;
}
.online {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #35ff9f;
  text-shadow: 0 0 10px rgba(53, 255, 159, 0.7);
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #35ff9f;
  box-shadow: 0 0 10px #35ff9f, 0 0 22px #35ff9f;
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse { 50% { opacity: 0.3; transform: scale(0.8); } }
.meta {
  margin: 8px 0 0;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  color: var(--muted);
}
.bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 28px;
}
.bars i {
  flex: 1;
  background: linear-gradient(180deg, var(--cyan), var(--violet));
  box-shadow: 0 0 6px rgba(0, 229, 255, 0.6);
  transition: height 0.9s ease;
}

@media (max-width: 900px) {
  .hud { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 560px) {
  .brand { display: none; }
  .top { justify-content: space-between; }
  .hud { gap: 10px; }
  .card { padding: 12px 12px 10px; }
  .meta { font-size: 0.68rem; letter-spacing: 0.06em; }
}
</style>
