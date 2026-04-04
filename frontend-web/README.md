# Coirendevouz — Web (frontend)

İki ayrı **Vite + React + TypeScript** uygulaması; tasarım dilleri roadmap Faz 2 ile uyumludur:

| Uygulama | Kaynak şablon | Rol | Geliştirme portu |
|----------|----------------|-----|------------------|
| **`apps/admin`** | Minimal (`vite-ts`) | İşletme yönetimi (panel) | **8080** |
| **`apps/site`** | Zone (`vite-ts`) | Müşteri / genel site | **8001** |

Kaynak şablonlar referans için **`templates/`** altında durmaya devam eder; çalışan proje **`apps/`** içindedir.

## Önkoşullar

- **Node.js ≥ 20** (şablon `engines` ile uyumlu)
- **Yarn 1.x** veya **npm** (şablonda `packageManager: yarn@1.22.22` belirtilmiş; npm de çalışır)

## Kurulum (her uygulama ayrı)

### İşletme paneli (`admin`)

```powershell
cd frontend-web/apps/admin
copy .env.example .env
yarn install
yarn dev
```

Tarayıcı: `http://localhost:8080`

### Müşteri sitesi (`site`)

```powershell
cd frontend-web/apps/site
copy .env.example .env
yarn install
yarn dev
```

Tarayıcı: `http://localhost:8001`

## Backend ile birlikte

1. `backend` içinde `python manage.py runserver` → API genelde `http://127.0.0.1:8000`
2. `.env` dosyalarında API adresi: `http://127.0.0.1:8000/api/v1` (örnek dosyalarda varsayılan)

Admin uygulamasında **`src/lib/axios.ts`** tabanı **`CONFIG.serverUrl`** (`VITE_SERVER_URL`) üzerinden alır; **Faz 2 (`2-FE-01`)** ile: her istekte `sessionStorage` access token → `Authorization: Bearer`, **401** yanıtında `POST /auth/token/refresh/` ile yenileme ve isteğin tekrarı, Django uyumlu hata metni (`api-errors.ts`). Refresh token `jwt_refresh_token` anahtarında saklanır. Site uygulamasında **`CONFIG.apiBaseUrl`** (`VITE_API_BASE_URL`) kullanılır; panel ile aynı desen ileride eşlenebilir.

**Faz 2 (`2-FE-02`):** İşletme panelinde Minimals demo menü ve rotaları kaldırıldı; **`paths.dashboard.coirendevouz`** altında özet, hizmetler, personel, ajanda ve manuel randevu yolları, **`nav-config-dashboard`** ile i18n menü, **`/dashboard/user/account`** altında hesap sekmeleri korundu. Kök adres **`/`** panele yönlendirir (`/dashboard`). Eski **`/dashboard/appointments`** kökü ajandaya yönlendirilir; randevu detayı ve manuel form **`/dashboard/appointments/:id`** ve **`/dashboard/appointments/manual`** altında kalır.

**Faz 2 (`2-FE-03`):** Panel **`GET /api/v1/businesses/mine/`** ile işletme listesini yükler; **`BusinessProvider`** + **`BusinessAccessGuard`** (müşteri token’ı 403, boş liste, API hatası); seçim **`coirendevouz_selected_business_id`** ile kalıcı; üst başlıkta **`BusinessWorkspacePopover`** (tek işletmede yalnızca ad).

**Faz 2 (`2-FE-04`):** **Hizmetler** — `src/api/business-services.ts` (liste sayfaları birleştirilir), **`/dashboard/services`**, **`/services/new`**, **`/services/:id/edit`**; pasifleştirme onaylı; fiyat **₺** formatı (`tr-TR`).

**Faz 2 (`2-FE-05`):** **Personel** — `src/api/business-staff.ts`, **`/dashboard/staff`**, **`/staff/new`**, **`/staff/:id/edit`**; düzenlemede **hizmet ataması** (`PUT .../staff/{id}/services/`); isteğe bağlı kullanıcı PK ile hesap bağlama.

**Faz 2 (`2-FE-06`):** **Ajanda** — `GET /businesses/{id}/schedule/?from=&to=` (zorunlu `YYYY-MM-DD`, İstanbul); isteğe bağlı `status`; isteğe bağlı **`staff_id`** (aynı ada tekrarlayan query veya virgülle liste — API sözleşmesi §5.1). İstemci: `src/api/business-schedule.ts` içindeki `fetchSchedule` → `staffIds` dizisi `staff_id` parametrelerine çevrilir. **`/dashboard/schedule`**; gün/hafta, önceki/sonraki, **Bugün**, durum filtresi, personel filtresi, liste/takvim.

**Faz 2 (`2-FE-07`):** **Manuel randevu** — `GET /appointments/available-slots/` (personel + hizmet + tarih), `POST /businesses/{id}/appointments/manual/`; **`/dashboard/appointments/manual`**; personel/hizmet seçimi, slot düğmeleri veya saat alanı, müşteri kullanıcı PK, iç not; başarıda ajandaya yönlendirme.

**Faz 2 (`2-FE-08`):** **Randevu detay / durum** — `GET`/`PATCH /appointments/{id}/` (durum, işletme içi not); **`/dashboard/appointments/:id`** (ajanda satırından veya doğrudan); hızlı eylemler (tamamlandı, iptal, gelmedi, onaylandı).

**Faz 2 (`2-FE-09`):** **İşletme yöneticisi kaydı** — **`/auth/jwt/business-sign-up`**; `auth/context/jwt/action.ts` içinde `registerAccount` (`full_name`, `phone`, `role`) + `signInWithPassword`; giriş sayfasından link; MVP: işletme (`Business`) kaydı kullanıcıdan bağımsız; davet akışı yok.

**Faz 2 (`2-FE-10`):** **Smoke test** — [`documentation/SMOKE-TEST-ADMIN-PANEL.md`](../documentation/SMOKE-TEST-ADMIN-PANEL.md) (manuel); Playwright: `apps/admin` içinde `npm run test:e2e:install` (bir kez), `npm run test:e2e` (Vite 8080’de `reuseExistingServer`).

**CORS:** Backend’de `django-cors-headers` kullanılır; varsayılan origin’ler `8080` (admin) ve `8001` (site). Özelleştirmek için `backend/.env` içinde `DJANGO_CORS_ALLOWED_ORIGINS` (virgülle ayrı tam URL’ler).

### İşletme paneli girişi (Minimal JWT)

Şablondaki `demo@minimals.cc` **Django veritabanınızda yoktur**; giriş için **`createsuperuser`** veya `role: business_admin` olan bir kullanıcı kullanın (e-posta + şifre). İstekler `VITE_SERVER_URL` (örn. `http://127.0.0.1:8000/api/v1`) üzerinden `POST /auth/token/` ve `GET /users/me/` ile gider.

## Şablon güncellemesi

`templates/` içindeki zip çıktıları güncellenirse, değişen `vite-ts` klasörlerini isteğe bağlı yeniden `apps/` altına kopyalayın; **önce yedek** alın — `apps/` içinde yapılan Coirendevouz özelleştirmeleri üzerine yazılır.

## Dokümantasyon

- API sözleşmesi: [`documentation/API-CONTRACT.md`](../documentation/API-CONTRACT.md)
- Yol haritası: [`documentation/ROADMAP.md`](../documentation/ROADMAP.md) — Faz 2
