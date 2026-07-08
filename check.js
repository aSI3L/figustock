// check.js — Monitorea stock en zonakids.com y avisa por Telegram.
// Corre una vez por ejecución (lo dispara GitHub Actions cada 5 min).
import { readFile, writeFile } from "node:fs/promises";

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const STATE_FILE = "state.json";

// 👇 Los productos a vigilar. Agregá o sacá los que quieras.
const PRODUCTS = [
  {
    name: "Combo 1: Álbum Gold + 100 sobres FIFA World Cup 2026",
    url: "https://zonakids.com/combo-1-album-gold-100-sobres-de-figuritas-fifa-world-cup-2026",
  },
  {
    name: "Pack x50 sobres FIFA World Cup 2026",
    url: "https://zonakids.com/pack-x-50-sobres-fifa-world-cup-2026",
  },
];

async function sendTelegram(text) {
  if (!TOKEN || !CHAT_ID) {
    throw new Error("Faltan las variables TELEGRAM_TOKEN o TELEGRAM_CHAT_ID");
  }
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`Telegram respondió ${res.status}: ${await res.text()}`);
  }
}

// Devuelve: true = hay stock | false = agotado | null = no se pudo determinar
async function checkStock(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept-Language": "es-AR,es;q=0.9",
    },
  });
  if (!res.ok) {
    console.warn(`⚠️  ${url} → HTTP ${res.status}`);
    return null;
  }
  const html = await res.text();
  // Marca robusta: dato estructurado schema.org embebido en el HTML.
  const m = html.match(
    /"availability"\s*:\s*"https?:\/\/schema\.org\/(InStock|OutOfStock)"/i
  );
  if (!m) {
    console.warn(`⚠️  No encontré la marca de stock en ${url} (¿cambió la página?)`);
    return null;
  }
  return m[1].toLowerCase() === "instock";
}

async function loadState() {
  try {
    return JSON.parse(await readFile(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function main() {
  const state = await loadState();
  let changed = false;

  for (const p of PRODUCTS) {
    let inStock;
    try {
      inStock = await checkStock(p.url);
    } catch (e) {
      console.error(`❌ Error revisando ${p.name}: ${e.message}`);
      continue;
    }
    if (inStock === null) continue; // no tocamos el estado si no pudimos leer

    const prevNotified = state[p.url]?.notified ?? false;
    console.log(`${inStock ? "🟢 STOCK  " : "⚪ agotado"} — ${p.name}`);

    if (inStock && !prevNotified) {
      // Pasó de agotado a disponible → avisar (una sola vez).
      await sendTelegram(
        `🟢 <b>¡HAY STOCK!</b>\n\n${p.name}\n\n👉 Comprá ya:\n${p.url}`
      );
      state[p.url] = { notified: true };
      changed = true;
    } else if (!inStock && prevNotified) {
      // Se agotó de nuevo → rearmar para el próximo restock.
      state[p.url] = { notified: false };
      changed = true;
    } else if (state[p.url] === undefined) {
      // Primera corrida: guardamos el estado inicial sin avisar.
      state[p.url] = { notified: inStock };
      changed = true;
    }
  }

  if (changed) {
    await writeFile(STATE_FILE, JSON.stringify(state, null, 2) + "\n");
    console.log("💾 Estado actualizado.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
