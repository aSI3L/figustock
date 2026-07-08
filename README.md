# zonakids-stock-bot 🟢

Bot que vigila productos de **zonakids.com** y avisa por **Telegram** apenas
haya stock. Corre solo en **GitHub Actions** (gratis, sin tu PC prendida),
chequea cada 5 minutos.

## Cómo funciona

- `check.js` mira las URLs de `PRODUCTS`, lee el dato estructurado
  `schema.org/InStock` vs `OutOfStock` del HTML y, si algo pasa a disponible,
  te manda un mensaje por Telegram.
- `state.json` recuerda qué ya te avisó, para no spamearte cada 5 min. Se
  commitea solo desde la Action.
- `.github/workflows/monitor.yml` es el cron que dispara todo.

---

## Puesta en marcha (una sola vez, ~10 min)

### 1. Crear el bot de Telegram

1. En Telegram abrí **@BotFather** → `/newbot` → seguí los pasos.
2. Te da un **token** tipo `123456789:AAE...`. Guardalo.
3. **Mandale un mensaje** cualquiera a tu bot nuevo (ej: "hola"). Esto es
   necesario para que el bot pueda escribirte.

### 2. Conseguir tu chat_id

Opción fácil: en Telegram hablale a **@userinfobot**, te dice tu ID.

Opción manual: abrí en el navegador
`https://api.telegram.org/bot<TU_TOKEN>/getUpdates` y buscá `"chat":{"id":...}`.

### 3. Subir el proyecto a GitHub

Creá un repo **público** (para que Actions sea 100% gratis) y subí estos
archivos:

```bash
git init
git add .
git commit -m "monitor de stock zonakids"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/zonakids-stock-bot.git
git push -u origin main
```

### 4. Cargar los secrets

En el repo → **Settings → Secrets and variables → Actions → New repository
secret**. Creá dos:

| Nombre             | Valor                          |
| ------------------ | ------------------------------ |
| `TELEGRAM_TOKEN`   | el token de BotFather          |
| `TELEGRAM_CHAT_ID` | tu chat_id                     |

### 5. Activar y probar

1. Pestaña **Actions** → si pide habilitar workflows, aceptá.
2. Entrá a **Monitor stock zonakids** → botón **Run workflow** para probarlo
   ya mismo (no esperes los 5 min).
3. Mirá el log: debería decir `⚪ agotado` para ambos (hoy están sin stock).
   Cuando alguno tenga stock, te llega el Telegram. ✅

---

## Personalizar

- **Otros productos:** editá el array `PRODUCTS` en `check.js`.
- **Otra frecuencia:** cambiá el `cron` en `monitor.yml`
  (`*/10 * * * *` = cada 10 min). Mínimo real de GitHub: 5 min.
- **Probar local** (opcional, necesitás Node 20+):
  ```bash
  TELEGRAM_TOKEN=xxx TELEGRAM_CHAT_ID=yyy npm run check
  ```

## Notas

- El cron de GitHub Actions puede atrasarse unos minutos en horas pico: es
  normal y gratis, no es un error.
- Si `check.js` avisa `No encontré la marca de stock`, es que la página
  cambió su estructura; hay que reajustar el `match()`.
