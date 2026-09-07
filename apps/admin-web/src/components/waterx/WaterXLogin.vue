<script setup lang="ts">
import { ref, useId } from 'vue'
import WxButton from './WxButton.vue'
import WxField from './WxField.vue'
import WxInput from './WxInput.vue'

withDefaults(defineProps<{
  username: string
  password: string
  loading?: boolean
  error?: string
  previewNote?: string
}>(), { loading: false, error: '', previewNote: '' })
const emit = defineEmits<{
  'update:username': [value: string]
  'update:password': [value: string]
  submit: []
}>()
const showPassword = ref(false)
const loginId = useId()
</script>

<template>
  <main class="wx-login">
    <section class="wx-login-brand" aria-label="WaterX 智慧水务运营平台">
      <header class="wx-login-wordmark"><img src="/waterx-logo-on-dark.png" alt="WaterX"><span>智慧水务运营平台</span></header>
      <div class="wx-login-story">
        <p class="wx-login-kicker"><i aria-hidden="true"></i>市政污水处理 · 数字化运营</p>
        <h1>让水厂运营，<br>清晰而有据。</h1>
        <p class="wx-login-description">以工艺为脉络，以数据为依据。<br>连接现场运行与管理决策。</p>
      </div>
      <div class="wx-login-process" aria-hidden="true">
        <div class="wx-login-process-caption"><span>从一滴水，到一套运行体系</span><span>工艺意象</span></div>
        <svg viewBox="0 0 640 235" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g stroke="currentColor" stroke-width="1.1" opacity=".12"><path d="M0 51H640M0 185H640M122 20V207M365 20V207M523 20V207"/><path d="M0 28H640M0 208H640" stroke-dasharray="2 6"/></g>
          <g stroke="currentColor" stroke-width="1.5" opacity=".64" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 118H49M97 118H146M338 118H386M500 118H548M601 118H636"/>
            <path d="m25 114 5 4-5 4m90-8 5 4-5 4m243-8 5 4-5 4m167-8 5 4-5 4m88-8 5 4-5 4"/>
            <rect x="49" y="88" width="48" height="60" rx="3"/><path d="M60 95V141M69 95V141M78 95V141M87 95V141"/>
            <rect x="146" y="69" width="192" height="98" rx="3"/><path d="M192 70V154H238V82H286V154H337"/>
            <path d="M156 86h26m-26 9h26m-26 9h26M249 111h26m-26 10h26m-26 10h26M298 87h28m-28 10h28m-28 10h28" opacity=".42"/>
            <circle cx="443" cy="118" r="57"/><circle cx="443" cy="118" r="45" opacity=".5"/><circle cx="443" cy="118" r="6"/><path d="m406 81 33 33m8 8 33 33M443 61v20M386 118h20M480 118h20M443 155v20"/>
            <rect x="548" y="85" width="53" height="66" rx="3"/><path d="M558 93V143M570 93V143M582 93V143M594 93V143" opacity=".5"/>
            <path d="M443 175v18H216v-26" stroke-dasharray="4 5" opacity=".45"/>
          </g>
          <g fill="currentColor" opacity=".72" font-size="11" font-family="sans-serif" text-anchor="middle"><text x="73" y="178">预处理</text><text x="242" y="190">生物处理</text><text x="443" y="211">沉淀分离</text><text x="575" y="178">深度处理</text></g>
          <g fill="currentColor"><circle cx="146" cy="118" r="3"/><circle cx="443" cy="118" r="3"/><circle cx="601" cy="118" r="3"/></g>
        </svg>
      </div>
      <footer class="wx-login-brand-foot"><span>专业 · 克制 · 清晰 · 可信</span><span>WaterX</span></footer>
    </section>

    <section class="wx-login-access" aria-label="账号登录">
      <div class="wx-login-mobile-brand"><img src="/waterx-logo-on-light.png" alt="WaterX"><span>智慧水务运营平台</span></div>
      <form class="wx-login-form" @submit.prevent="!loading && emit('submit')">
        <div class="wx-login-welcome"><p>欢迎回来</p><h2>登录 <img src="/waterx-logo-on-light.png" alt="WaterX"></h2><span>进入你的水厂运营工作空间</span></div>
        <p v-if="previewNote" class="wx-login-preview-note" role="status">{{ previewNote }}</p>
        <WxField v-slot="{ controlProps }" label="用户名" layout="stacked" required><WxInput :model-value="username" v-bind="controlProps" name="username" autocomplete="username" placeholder="请输入账号" :disabled="loading" autocapitalize="none" spellcheck="false" @update:model-value="emit('update:username', $event)" /></WxField>
        <div class="wx-login-password-field">
          <label :for="`${loginId}-password`">密码<span aria-hidden="true">*</span></label>
          <div class="wx-login-password-control"><input :id="`${loginId}-password`" :value="password" name="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="请输入密码" :disabled="loading" required @input="emit('update:password', ($event.target as HTMLInputElement).value)"><button type="button" :aria-label="showPassword ? '隐藏密码' : '显示密码'" :aria-pressed="showPassword" :disabled="loading" @click="showPassword = !showPassword"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path v-if="showPassword" d="m4 3 16 18"/></svg></button></div>
        </div>
        <p v-if="error" class="wx-login-error" role="alert">{{ error }}</p>
        <WxButton class="wx-login-submit" type="submit" variant="primary" :loading="loading">{{ loading ? '正在登录…' : '登录' }}<svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></WxButton>
        <div class="wx-login-help"><span>使用管理员分配的账号登录</span><small>如需开通账号或重置密码，请联系项目管理员。</small></div>
      </form>
      <footer class="wx-login-access-foot">WaterX 智慧水务运营平台</footer>
    </section>
  </main>
</template>

<style scoped>
.wx-login,.wx-login *{box-sizing:border-box}
.wx-login{display:grid;grid-template-columns:minmax(0,61.8fr) minmax(0,38.2fr);min-height:100vh;min-height:100dvh;background:var(--wx-n0);color:var(--wx-n700);font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
.wx-login-brand{position:relative;display:flex;flex-direction:column;min-width:0;padding:48px clamp(40px,5.5vw,88px) 28px;background:var(--wx-deep-900);color:#e5f5fc;overflow:hidden}
.wx-login-brand::before{position:absolute;inset:0;content:"";pointer-events:none;background:radial-gradient(ellipse at 10% 78%,rgba(13,143,136,.16),transparent 62%)}
.wx-login-brand>*{position:relative}
.wx-login-wordmark{display:flex;align-items:center;gap:22px;flex-wrap:wrap}
.wx-login-wordmark img{display:block;width:132px;height:auto}.wx-login-wordmark>span{padding-left:22px;border-left:1px solid rgba(229,245,252,.24);font-size:15px;font-weight:600;letter-spacing:1px}
.wx-login-story{padding:clamp(66px,10vh,108px) 0 38px}
.wx-login-kicker{display:flex;align-items:center;gap:12px;margin:0 0 25px;color:#9bbfce;font-size:12px;letter-spacing:2px}
.wx-login-kicker i{display:inline-block;width:22px;height:2px;background:#ff681e}
.wx-login-story h1{margin:0;color:#e5f5fc;font-size:clamp(36px,3.8vw,58px);font-weight:600;letter-spacing:2px;line-height:1.35}
.wx-login-description{margin:24px 0 0;color:#a8c6d3;font-size:15px;line-height:1.9;letter-spacing:.5px}
.wx-login-process{margin-top:auto;padding-top:18px;color:#6db6cd;width:100%}
.wx-login-process-caption{display:flex;justify-content:space-between;gap:12px;border-top:1px solid rgba(229,245,252,.13);padding-top:17px;font-size:11px;color:#8aaebd;letter-spacing:1px}
.wx-login-process-caption span:last-child{font-size:10px;opacity:.7}.wx-login-process svg{display:block;width:100%;max-width:720px;height:auto;margin:6px auto 20px}
.wx-login-brand-foot{display:flex;justify-content:space-between;color:#789dab;font-size:10px;letter-spacing:1px}
.wx-login-access{display:flex;min-width:0;flex-direction:column;align-items:center;justify-content:center;padding:70px 48px 28px;background:var(--wx-n0)}
.wx-login-form{display:grid;gap:22px;width:min(100%,350px);margin:auto 0}
.wx-login-welcome{margin-bottom:12px}.wx-login-welcome>p{margin:0 0 8px;color:var(--wx-blue-700);font-size:12px;letter-spacing:2px}.wx-login-welcome h2{margin:0;color:var(--wx-n800);font-size:30px;font-weight:600;letter-spacing:.5px}.wx-login-welcome>span{display:block;margin-top:10px;font-size:13px;color:var(--wx-n500)}
.wx-login-form :deep(.wx-field){gap:8px}.wx-login-form :deep(.wx-input){height:46px;padding:0 14px;border-radius:6px;font-size:14px}
.wx-login-welcome h2{display:flex;align-items:center;gap:12px}.wx-login-welcome h2 img{display:block;height:.95em;width:auto;flex-shrink:0}
.wx-login-form :deep(.wx-field-label){font-size:12px}.wx-login-form input::placeholder,.wx-login-form :deep(input::placeholder){color:var(--wx-n400)}
.wx-login-password-field>label{display:block;margin-bottom:8px;font-size:12px;font-weight:500;color:var(--wx-n600)}.wx-login-password-field>label span{margin-left:2px;color:var(--wx-danger)}
.wx-login-password-control{display:flex;align-items:center;position:relative}
.wx-login-password-control input{min-width:0;width:100%;height:46px;padding:0 46px 0 14px;border:var(--wx-border-default);border-radius:6px;background:var(--wx-n0);color:var(--wx-n700);font:inherit;font-size:14px}
.wx-login-password-control input:hover{border-color:var(--wx-n300)}.wx-login-password-control input:focus-visible{outline:0;border-color:var(--wx-blue-600);box-shadow:var(--wx-focus-ring)}
.wx-login-password-control input:disabled{border-color:var(--wx-n100);background:var(--wx-n25);color:var(--wx-n400)}
.wx-login-password-control button{position:absolute;right:4px;display:grid;place-items:center;width:38px;height:38px;padding:0;border:0;border-radius:4px;background:transparent;color:var(--wx-n500);cursor:pointer}
.wx-login-password-control button:hover:not(:disabled){background:var(--wx-n25);color:var(--wx-blue-700)}.wx-login-password-control button:focus-visible{outline:2px solid var(--wx-blue-600);outline-offset:-2px}.wx-login-password-control button:disabled{color:var(--wx-n400);cursor:not-allowed}
.wx-login-password-control svg{width:19px;height:19px}
.wx-login-submit{width:100%;height:46px;justify-content:space-between;padding:0 16px;font-size:14px;border-radius:6px;margin-top:6px}.wx-login-submit svg{width:20px;height:20px}
.wx-login-submit[aria-busy="true"]{justify-content:center;gap:10px}
.wx-login-error{margin:0;color:var(--wx-danger-strong);font-size:12px;line-height:1.6;overflow-wrap:anywhere}
.wx-login-help{padding-top:20px;border-top:var(--wx-border-subtle);color:var(--wx-n500);font-size:11px}.wx-login-help small{display:block;margin-top:5px;font-size:11px;color:var(--wx-n500)}
.wx-login-access-foot{padding-top:40px;color:var(--wx-n400);font-size:10px;letter-spacing:1px}
.wx-login-mobile-brand{display:none}.wx-login-preview-note{margin:0;padding:10px 12px;border-left:2px solid var(--wx-blue-600);background:var(--wx-n25);font-size:11px;color:var(--wx-n500)}
@media(max-width:1050px){.wx-login-brand{padding:38px 32px 24px}.wx-login-wordmark{gap:14px}.wx-login-wordmark>span{padding-left:14px;font-size:12px}.wx-login-wordmark img{width:110px}.wx-login-access{padding:50px 32px 24px}.wx-login-story h1{font-size:38px}.wx-login-kicker{letter-spacing:.6px;font-size:11px}}
@media(min-width:761px) and (max-height:800px){.wx-login-brand{padding-top:32px;padding-bottom:22px}.wx-login-story{padding:44px 0 24px}.wx-login-story h1{font-size:42px}.wx-login-description{margin-top:18px;font-size:14px}.wx-login-process svg{max-height:168px;margin-bottom:12px}.wx-login-access{padding-top:36px}.wx-login-access-foot{padding-top:28px}}
@media(max-width:760px){.wx-login{display:block;min-height:100dvh}.wx-login-brand{display:none}.wx-login-access{min-height:100vh;min-height:100dvh;padding:32px 26px 22px}.wx-login-mobile-brand{display:flex;align-items:center;gap:15px;margin-bottom:48px;align-self:flex-start}.wx-login-mobile-brand img{width:96px;height:auto}.wx-login-mobile-brand>span{font-size:12px;color:var(--wx-n600);border-left:var(--wx-border-default);padding-left:15px}.wx-login-form{width:min(100%,350px);gap:20px}.wx-login-welcome h2{font-size:28px}.wx-login-access-foot{padding-top:42px}}
</style>
