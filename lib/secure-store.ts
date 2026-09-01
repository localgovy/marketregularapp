import * as SecureStore from "expo-secure-store";

/** iOS SecureStore values cap at 2048 bytes; a Supabase session JSON often exceeds that. */
const CHUNK = 1800;

async function deleteQuiet(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* already gone */
  }
}

export const LargeSecureStore = {
  async getItem(key: string) {
    const chunks = await SecureStore.getItemAsync(`${key}_chunks`);
    if (!chunks) return SecureStore.getItemAsync(key);
    const count = Number(chunks);
    if (!Number.isFinite(count) || count < 1) return null;
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${key}_${i}`);
      if (part == null) return null;
      parts.push(part);
    }
    return parts.join("");
  },

  async setItem(key: string, value: string) {
    await LargeSecureStore.removeItem(key);
    if (value.length <= CHUNK) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const count = Math.ceil(value.length / CHUNK);
    await SecureStore.setItemAsync(`${key}_chunks`, String(count));
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(`${key}_${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    }
  },

  async removeItem(key: string) {
    const chunks = await SecureStore.getItemAsync(`${key}_chunks`);
    const count = chunks ? Number(chunks) : 0;
    await deleteQuiet(key);
    await deleteQuiet(`${key}_chunks`);
    const n = Number.isFinite(count) ? count : 0;
    for (let i = 0; i < n; i++) {
      await deleteQuiet(`${key}_${i}`);
    }
  },
};
