<script setup>
import { computed, nextTick, ref } from 'vue'
import NeonBackdrop from '../../shared/components/NeonBackdrop.vue'
import GlitchText from '../../shared/components/GlitchText.vue'
import Typewriter from '../../shared/components/Typewriter.vue'
import NeonButton from '../../shared/components/NeonButton.vue'
import { login, isAuthConfigured } from '../../shared/auth.js'
import { goTo } from '../../shared/nav.js'

const username = ref('')
const password = ref('')
const showPw = ref(false)
const loading = ref(false)
const granted = ref(false)
const error = ref('')
const shake = ref(false)
const userInput = ref(null)

const configured = isAuthConfigured()
const canSubmit = computed(() => configured && username.value.trim() && password.value)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function triggerShake() {
  shake.value = false
  await nextTick()
  // 強制 reflow 以重播動畫
  void document.body.offsetWidth
  shake.value = true
}

async function onSubmit() {
  if (!canSubmit.value || loading.value) return
  loading.value = true
  error.value = ''
  try {
    // 至少停留一下，讓「雜湊中」的動畫看得到
    const [session] = await Promise.all([login(username.value, password.value), sleep(700)])
    if (!session) {
      error.value = 'ACCESS DENIED // 帳號或密碼錯誤'
      password.value = ''
      triggerShake()
      return
    }
    granted.value = true
    await sleep(650)
    goTo('home')
  } catch (e) {
    console.error(e)
    error.value = 'SYSTEM FAULT // 無法完成驗證'
    triggerShake()
  } finally {
    if (!granted.value) loading.value = false
  }
}
</script>

<template>
  <NeonBackdrop />

  <main class="stage">
    <header class="brand">
      <span class="neon-cyan">NEON//GRID</span>
      <span class="ver">SEC-NODE 07 · v3.0</span>
    </header>

    <section class="card-wrap">
      <div class="card-glow" aria-hidden="true" />
      <form class="card" :class="{ shake, granted }" novalidate @submit.prevent="onSubmit" @animationend="shake = false">
        <h1 class="title">
          <GlitchText class="neon-text flicker" text="ACCESS TERMINAL" />
        </h1>
        <p class="sub">
          <span class="prompt">&gt;</span>
          <Typewriter
            :lines="['establishing secure uplink...', 'neural handshake pending...', 'authenticate to enter the grid', '請登入以進入系統']"
          />
        </p>

        <div v-if="!configured" class="alert" role="alert">
          AUTH NOT CONFIGURED // 尚未設定 VITE_AUTH_HASH_KEY / VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD
        </div>

        <label class="field">
          <span class="label">USERNAME <small>使用者名稱</small></span>
          <input
            ref="userInput"
            v-model="username"
            class="input"
            name="username"
            type="text"
            autocomplete="username"
            autocapitalize="off"
            spellcheck="false"
            :disabled="loading"
            required
          />
        </label>

        <label class="field">
          <span class="label">PASSWORD <small>密碼</small></span>
          <span class="pw">
            <input
              v-model="password"
              class="input"
              name="password"
              :type="showPw ? 'text' : 'password'"
              autocomplete="current-password"
              :disabled="loading"
              required
            />
            <button type="button" class="toggle" :aria-pressed="showPw" :disabled="loading" @click="showPw = !showPw">
              {{ showPw ? 'HIDE' : 'SHOW' }}
            </button>
          </span>
        </label>

        <p class="error" role="alert" aria-live="assertive">
          <GlitchText v-if="error" :text="error" fast />
        </p>

        <NeonButton type="submit" :loading="loading || granted" class="submit" :class="{ ok: granted }">
          {{ granted ? 'ACCESS GRANTED' : loading ? 'HASHING...' : 'JACK IN' }}
        </NeonButton>

        <footer class="foot">
          <span class="dot" /> LINK SECURE · HMAC-SHA256
        </footer>
      </form>
    </section>
  </main>
</template>

<style scoped>
.stage {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 72px 16px 32px;
}

.brand {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 18px 24px;
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: 0.3em;
  font-size: 0.8rem;
}
.ver {
  color: var(--muted);
  font-family: var(--font-mono);
  letter-spacing: 0.15em;
  font-weight: 400;
}

.card-wrap {
  position: relative;
  width: min(440px, 100%);
}

.card-glow {
  position: absolute;
  inset: -6px;
  border-radius: 18px;
  background: conic-gradient(from var(--angle, 0deg), var(--cyan), var(--violet), var(--magenta), var(--violet), var(--cyan));
  filter: blur(26px);
  opacity: 0.55;
  animation: spin 6s linear infinite;
}

@keyframes spin {
  to { --angle: 360deg; }
}

.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 36px 32px 28px;
  border-radius: 16px;
  background: var(--glass);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  backdrop-filter: blur(18px) saturate(140%);
  box-shadow: inset 0 0 40px rgba(123, 97, 255, 0.12);
}
/* 流動漸層邊框 */
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 2px;
  border-radius: inherit;
  background: conic-gradient(from var(--angle, 0deg), var(--cyan), var(--violet), var(--magenta), var(--violet), var(--cyan));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  animation: spin 6s linear infinite;
  pointer-events: none;
}

.card.shake {
  animation: shake 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
@keyframes shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(5px); }
  30%, 50%, 70% { transform: translateX(-9px); }
  40%, 60% { transform: translateX(9px); }
}

.title {
  margin: 0;
  text-align: center;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(1.5rem, 6.4vw, 2rem);
  letter-spacing: 0.12em;
  line-height: 1.1;
}

.sub {
  margin: -6px 0 4px;
  min-height: 1.6em;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.92rem;
  color: var(--cyan);
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.55);
}
.prompt {
  color: var(--magenta);
  margin-right: 0.4em;
}

.alert {
  padding: 10px 12px;
  border: 1px solid var(--danger);
  background: rgba(255, 59, 107, 0.1);
  color: #ff8fa9;
  font-family: var(--font-mono);
  font-size: 0.82rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.label {
  font-family: var(--font-display);
  font-size: 0.72rem;
  letter-spacing: 0.25em;
  color: var(--violet);
  text-shadow: 0 0 8px rgba(123, 97, 255, 0.7);
}
.label small {
  margin-left: 6px;
  font-family: var(--font-body);
  letter-spacing: 0.08em;
  color: var(--muted);
  text-shadow: none;
}

.input {
  width: 100%;
  padding: 13px 14px;
  border: 1px solid rgba(123, 97, 255, 0.45);
  border-radius: 4px;
  background: rgba(5, 4, 22, 0.7);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 1.05rem;
  letter-spacing: 0.06em;
  caret-color: var(--cyan);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.input::placeholder { color: var(--muted); }
.input:hover:not(:disabled) { border-color: var(--violet); }
.input:focus {
  border-color: var(--cyan);
  background: rgba(8, 6, 34, 0.85);
  box-shadow: 0 0 0 1px var(--cyan), 0 0 18px rgba(0, 229, 255, 0.45), inset 0 0 14px rgba(0, 229, 255, 0.12);
}
.input:disabled { opacity: 0.6; }
.input:-webkit-autofill {
  -webkit-text-fill-color: #fff;
  box-shadow: 0 0 0 100px #0a0828 inset;
}

.pw { position: relative; display: block; }
.pw .input { padding-right: 70px; }
.toggle {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  padding: 6px 8px;
  border: 0;
  background: transparent;
  color: var(--cyan);
  font-family: var(--font-display);
  font-size: 0.62rem;
  letter-spacing: 0.15em;
  cursor: pointer;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.6);
}
.toggle:hover:not(:disabled) { color: #fff; }
.toggle:focus-visible { outline: 2px solid var(--cyan); }

.error {
  margin: -4px 0;
  min-height: 1.5em;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.95rem;
  letter-spacing: 0.06em;
  color: var(--danger);
  text-shadow: 0 0 10px rgba(255, 59, 107, 0.8);
}

.submit { margin-top: 4px; width: 100%; }
.submit.ok {
  --btn-color: var(--cyan);
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.5), rgba(123, 97, 255, 0.5));
  box-shadow: 0 0 34px var(--cyan), inset 0 0 20px rgba(255, 255, 255, 0.3);
}

.card.granted .input { border-color: var(--cyan); }

.foot {
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  color: var(--muted);
}
.dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 6px;
  border-radius: 50%;
  background: #35ff9f;
  box-shadow: 0 0 8px #35ff9f;
  animation: pulse 1.6s ease-in-out infinite;
}
@keyframes pulse {
  50% { opacity: 0.3; }
}

@media (max-width: 480px) {
  .card { padding: 28px 20px 22px; }
  .brand { padding: 14px 16px; font-size: 0.7rem; }
  .ver { display: none; }
}
</style>
