import { createApp } from 'vue'
import UiLab from './UiLab.vue'
import '../styles.css'
import '../design-tokens.css'
import '../waterx-components.css'
import '../risk.css'
import '../platform.css'
import '../diagnosis.css'
import '../typography.css'
import '../dashboard.css'
import '../module-shell.css'
import './ui-lab.css'

// Same global styles as the product; no business API, session or navigation.
createApp(UiLab).mount('#app')
