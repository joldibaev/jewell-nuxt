# Деплой в Coolify

Образ собирается корневым `Dockerfile` (Node 22 slim, pnpm через Corepack). Nitro-сборка самодостаточна, поэтому в финальном образе нет `node_modules`: только `.output` и `curl` для проверки здоровья Coolify.

## Настройки приложения

1. Build pack: **Dockerfile**, base directory `/`, Dockerfile `/Dockerfile`. Порт: **3000**.
2. Переменные окружения:
   - `NUXT_STRAPI_URL` — корень Strapi без `/api`. **Отметить как Build Variable**: `nuxt.config.ts` берёт из неё домен для IPX на этапе сборки, без неё картинки Strapi не оптимизируются. Нужна и в runtime.
   - `NUXT_STRAPI_TOKEN`, `NUXT_STRAPI_INQUIRY_TOKEN` — только runtime. **Build Variable не отмечать**: токены не должны попасть в образ.
3. Health check: включить, путь `/_health`, порт 3000. Маршрут не обращается к Strapi, поэтому недоступность CMS не откатывает деплой. Coolify игнорирует `HEALTHCHECK` из Dockerfile и проверяет через `curl` — он установлен в образе.
4. Домен и HTTPS — в Coolify. Если Strapi на другом домене, `NUXT_STRAPI_URL` должен совпадать с хостом, с которого отдаются картинки.
5. Кэш сборки включён; без причины не использовать Force deploy.
6. Watch paths (если используются): `Dockerfile`, `.dockerignore`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `package.json`, `nuxt.config.ts`, `app/`, `server/`, `shared/`, `public/`.

## Кэш и скорость

Слой зависимостей зависит только от `package.json`, `pnpm-lock.yaml` и `pnpm-workspace.yaml`; правки кода его не пересобирают. При смене зависимостей pnpm берёт пакеты из кэша `jewell-nuxt-pnpm`. Первый деплой на сервере всегда медленнее. Версию pnpm задаёт `ARG PNPM_VERSION`; лучше также добавить `packageManager` в `package.json`.

## Кэш картинок и API

- Готовые webp из `/_ipx` сохраняются на диск (`server/middleware/ipx-cache.ts`) и отдаются без sharp и без запроса в Strapi. Каталог `/app/ipx-cache` (`IPX_CACHE_DIR` задан в Dockerfile, принадлежит `node`). Чтобы кэш переживал деплой, в Coolify добавьте Persistent Storage (Volume Mount) с путём в контейнере `/app/ipx-cache`. Заголовок `x-ipx-cache: HIT|MISS` показывает, откуда пришёл ответ. Старые записи сами не удаляются; при необходимости каталог можно очистить.
- Ответы `/api/home`, `/api/catalog`, `/api/catalog-options`, `/api/site-settings`, `/api/about`, `/api/products/*` кэшируются в памяти на 60 с (`apiCache` в `server/utils/strapi.ts`): правки в Strapi появляются в течение минуты.

## Локальная проверка

```sh
docker build --build-arg NUXT_STRAPI_URL=http://host.docker.internal:1337 -t jewell-nuxt .
docker run --rm -p 3000:3000 -e NUXT_STRAPI_URL=http://host.docker.internal:1337 -e NUXT_STRAPI_TOKEN=... jewell-nuxt
```

Проверено локально: сборка без кэша ~40 с, процесс идёт от пользователя `node` (UID 1000), `/_health` и `/` отвечают 200, `/_ipx` отдаёт webp, статус контейнера `healthy`.

## Языки (ru / en / uz)

- Русский — основной и без префикса (`/catalogs`), английский и узбекский с префиксом (`/en/catalogs`, `/uz/catalogs`). Язык задаёт только адрес; по браузеру он не определяется.
- Тексты интерфейса лежат в `i18n/locales/*.json`. Контент приходит из Strapi: структура (связи, цена, наличие, фильтры) всегда читается с русских записей, а переводы `name`/`description` и др. запрашиваются отдельно (`locale=en|uz`, `server/utils/locale.ts`) и накладываются сверху. Нет перевода (или он не опубликован) — показывается русский текст.
- Ответы `/api/*` принимают `?locale=`; он входит в ключ кэша. Sitemap содержит все три языка с `hreflang`.
