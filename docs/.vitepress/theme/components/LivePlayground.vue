<template>
  <div class="playground">
    <div class="controls">
      <label>
        Seed
        <input v-model="seed" type="text" placeholder="e.g. 7 or 011" />
      </label>
      <label>
        Count
        <input v-model.number="count" type="number" min="1" max="25" />
      </label>
      <label>
        State
        <input v-model="state" type="text" placeholder="e.g. Maharashtra (blank = any)" />
      </label>
      <label>
        Gender
        <select v-model="gender">
          <option value="">Any</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label>
        Religion
        <select v-model="religion">
          <option value="">Any</option>
          <option>Hindu</option>
          <option>Muslim</option>
          <option>Christian</option>
          <option>Sikh</option>
          <option>Buddhist</option>
          <option>Jain</option>
        </select>
      </label>
      <label class="checkbox">
        <input v-model="family" type="checkbox" />
        Family (household)
      </label>
      <button :disabled="loading" @click="run">{{ loading ? 'Generating…' : 'Generate' }}</button>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <pre class="output">{{ activeTab === 'ts' ? tsOutput : pythonOutput }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { generate, generateFamily, type DemographicProfile } from '@abhay557/indian-fakedata';

const seed = ref('');
const count = ref(1);
const state = ref('');
const gender = ref('');
const religion = ref('');
const family = ref(false);
const loading = ref(false);
const error = ref('');
const tsOutput = ref('Press Generate to create a profile.');
const activeTab = ref<'ts' | 'py'>('ts');
const pythonBySeed = ref<Record<string, unknown>>({});

const tabs = [
  { id: 'ts', label: 'TypeScript (live)' },
  { id: 'py', label: 'Python (pre-computed)' },
];

const pythonOutput = computed(() => {
  const key = seed.value.trim() || '7';
  const data = pythonBySeed.value[key];
  return data ? JSON.stringify(data, null, 2) : `No pre-computed Python sample for seed "${key}".\nAvailable: 7, 11, 13 — try one of those.`;
});

async function run() {
  loading.value = true;
  error.value = '';
  try {
    const seedValue = seed.value.trim();
    const constraints: Record<string, string> = {};
    if (state.value.trim()) constraints.state = state.value.trim();
    if (gender.value) constraints.gender = gender.value;
    if (religion.value) constraints.religion = religion.value;

    if (family.value) {
      const fam = generateFamily({
        seed: seedValue || undefined,
        constraints,
      });
      tsOutput.value = JSON.stringify(fam, null, 2);
    } else {
      const profiles = generate({
        count: Math.max(1, Math.min(count.value, 25)),
        seed: seedValue || undefined,
        constraints,
      }) as DemographicProfile[];
      tsOutput.value = JSON.stringify(profiles, null, 2);
    }
    activeTab.value = 'ts';
  } catch (e) {
    error.value = String(e instanceof Error ? e.message : e);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  for (const s of ['7', '11', '13']) {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}sample-python-${s}.json`);
      pythonBySeed.value[s] = await res.json();
    } catch {
      pythonBySeed.value[s] = null;
    }
  }
});
</script>

<style scoped>
.playground {
  margin-top: 1rem;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}
.controls label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}
.controls input,
.controls select {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  min-width: 140px;
}
.controls .checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
}
.controls button {
  padding: 0.45rem 1.2rem;
  border: none;
  border-radius: 6px;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.controls button:disabled {
  opacity: 0.6;
  cursor: wait;
}
.tabs {
  display: flex;
  gap: 0.25rem;
  margin: 1rem 0 0;
}
.tabs button {
  padding: 0.4rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.tabs button.active {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.output {
  margin: 0;
  padding: 1rem;
  max-height: 480px;
  overflow: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0 6px 6px 6px;
  background: var(--vp-c-bg-soft);
  font-size: 0.85rem;
  line-height: 1.5;
}
.error {
  margin-top: 0.75rem;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  background: #fee2e2;
  color: #b91c1c;
}
</style>
