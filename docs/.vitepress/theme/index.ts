import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import LivePlayground from './components/LivePlayground.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LivePlayground', LivePlayground);
  },
} satisfies Theme;
