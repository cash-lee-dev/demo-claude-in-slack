<script setup>
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import NeonBackdrop from '../shared/components/NeonBackdrop.vue'
import GlitchText from '../shared/components/GlitchText.vue'
import Typewriter from '../shared/components/Typewriter.vue'
import NeonButton from '../shared/components/NeonButton.vue'
import { login, isAuthConfigured } from '../shared/auth.js'

const router = useRouter()

const username = ref('')
const password = ref('')
const showPw = ref(false)
const loading = ref(false)
const granted = ref(false)
const error = ref('')
const shake = ref(false)

const configured = isAuthConfigured()
const canSubmit = computed(() => configured && username.value.trim() && password.value)

// 輸入框共用樣式（Tailwind utilities）
const inputCls =
  'w-full rounded-sm border border-neon-violet/45 bg-[rgb(5_4_22/0.7)] px-3.5 py-[13px] font-mono text-[1.05rem] tracking-[0.06em] text-white caret-neon-cyan outline-none transition duration-200 placeholder:text-dim hover:not-disabled:border-neon-violet focus:border-neon-cyan focus:bg-[rgb(8_6_34/0.85)] focus:shadow-neon-focus disabled:opacity-60 autofill:shadow-[inset_0_0_0_100px_#0a0828] autofill:[-webkit-text-fill-color:#fff]'
const labelCls = 'font-display text-[0.72rem] tracking-[0.25em] text-neon-violet text-shadow-neon-label'

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
    router.replace('/home')
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

  <main class="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 pt-[72px] pb-8">
    <header class="fixed inset-x-0 top-0 flex justify-between px-4 py-3.5 font-display text-[0.7rem] font-bold tracking-[0.3em] sm:px-6 sm:py-[18px] sm:text-[0.8rem]">
      <span class="text-neon-cyan text-shadow-neon-cyan">NEON//GRID</span>
      <span class="hidden font-mono font-normal tracking-[0.15em] text-dim sm:inline">SEC-NODE 07 · v3.0</span>
    </header>

    <section class="relative w-full max-w-[440px]">
      <div class="absolute -inset-1.5 animate-spin-angle rounded-[18px] bg-neon-conic opacity-55 blur-[26px]" aria-hidden="true" />
      <form
        class="neon-frame relative flex flex-col gap-[18px] rounded-2xl bg-glass px-5 pt-7 pb-[22px] shadow-neon-card backdrop-blur-[18px] backdrop-saturate-[140%] sm:px-8 sm:pt-9 sm:pb-7"
        :class="shake && 'animate-shake'"
        novalidate
        @submit.prevent="onSubmit"
        @animationend="shake = false"
      >
        <h1 class="m-0 text-center font-display text-[clamp(1.5rem,6.4vw,2rem)] leading-[1.1] font-black tracking-[0.12em]">
          <GlitchText class="animate-flicker text-neon-white text-shadow-neon-violet" text="ACCESS TERMINAL" />
        </h1>
        <p class="-mt-1.5 mb-1 min-h-[1.6em] text-center font-mono text-[0.92rem] text-neon-cyan text-shadow-neon-cyan">
          <span class="mr-[0.4em] text-neon-magenta">&gt;</span>
          <Typewriter
            :lines="['establishing secure uplink...', 'neural handshake pending...', 'authenticate to enter the grid', '請登入以進入系統']"
          />
        </p>

        <div v-if="!configured" class="border border-neon-danger bg-neon-danger/10 px-3 py-2.5 font-mono text-[0.82rem] text-[#ff8fa9]" role="alert">
          AUTH NOT CONFIGURED // 尚未設定 VITE_AUTH_HASH_KEY / VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD_HASH
        </div>

        <label class="flex flex-col gap-2">
          <span :class="labelCls">USERNAME <small class="ml-1.5 font-sans tracking-[0.08em] text-dim text-shadow-none">使用者名稱</small></span>
          <input
            v-model="username"
            :class="inputCls"
            name="username"
            type="text"
            autocomplete="username"
            autocapitalize="off"
            spellcheck="false"
            :disabled="loading"
            required
          />
        </label>

        <label class="flex flex-col gap-2">
          <span :class="labelCls">PASSWORD <small class="ml-1.5 font-sans tracking-[0.08em] text-dim text-shadow-none">密碼</small></span>
          <span class="relative block">
            <input
              v-model="password"
              :class="[inputCls, 'pr-[70px]']"
              name="password"
              :type="showPw ? 'text' : 'password'"
              autocomplete="current-password"
              :disabled="loading"
              required
            />
            <button
              type="button"
              class="absolute top-1/2 right-2 -translate-y-1/2 border-0 bg-transparent px-2 py-1.5 font-display text-[0.62rem] tracking-[0.15em] text-neon-cyan text-shadow-neon-cyan hover:not-disabled:text-white focus-visible:outline-2 focus-visible:outline-neon-cyan"
              :aria-pressed="showPw"
              :disabled="loading"
              @click="showPw = !showPw"
            >
              {{ showPw ? 'HIDE' : 'SHOW' }}
            </button>
          </span>
        </label>

        <p class="-my-1 min-h-[1.5em] text-center font-mono text-[0.95rem] tracking-[0.06em] text-neon-danger text-shadow-neon-danger" role="alert" aria-live="assertive">
          <GlitchText v-if="error" :text="error" fast />
        </p>

        <NeonButton
          type="submit"
          :loading="loading || granted"
          class="mt-1 w-full"
          :class="granted && 'border-neon-cyan! from-neon-cyan/50! to-neon-violet/50! shadow-neon-cyan-lg!'"
        >
          {{ granted ? 'ACCESS GRANTED' : loading ? 'HASHING...' : 'JACK IN' }}
        </NeonButton>

        <footer class="text-center font-mono text-[0.72rem] tracking-[0.18em] text-dim">
          <span class="mr-1.5 inline-block size-[7px] animate-pulse-soft rounded-full bg-neon-green shadow-[0_0_8px_var(--color-neon-green)]" />
          LINK SECURE · HMAC-SHA256
        </footer>
      </form>
    </section>
  </main>
</template>
