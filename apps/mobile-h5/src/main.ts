import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'
import './risk.css'
import './permit.css'
// Share the existing frozen tokens; only the current safety workflow uses the new page styles.
import '../../admin-web/src/design-tokens.css'
import './safety-current.css'
document.documentElement.dataset.waterxBuild = '2026-08-15-h5-route'
createApp(App).mount('#app')
