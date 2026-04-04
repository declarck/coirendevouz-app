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

Admin uygulamasında `src/lib/axios.ts` tabanı **`CONFIG.serverUrl`** (`VITE_SERVER_URL`) üzerinden alır. Site uygulamasında **`CONFIG.apiBaseUrl`** (`VITE_API_BASE_URL`) kullanılır (Faz 2+ ile axios/fetch bağlanacak).

**CORS:** Backend’de `django-cors-headers` kullanılır; varsayılan origin’ler `8080` (admin) ve `8001` (site). Özelleştirmek için `backend/.env` içinde `DJANGO_CORS_ALLOWED_ORIGINS` (virgülle ayrı tam URL’ler).

### İşletme paneli girişi (Minimal JWT)

Şablondaki `demo@minimals.cc` **Django veritabanınızda yoktur**; giriş için **`createsuperuser`** veya `role: business_admin` olan bir kullanıcı kullanın (e-posta + şifre). İstekler `VITE_SERVER_URL` (örn. `http://127.0.0.1:8000/api/v1`) üzerinden `POST /auth/token/` ve `GET /users/me/` ile gider.

## Şablon güncellemesi

`templates/` içindeki zip çıktıları güncellenirse, değişen `vite-ts` klasörlerini isteğe bağlı yeniden `apps/` altına kopyalayın; **önce yedek** alın — `apps/` içinde yapılan Coirendevouz özelleştirmeleri üzerine yazılır.

## Dokümantasyon

- API sözleşmesi: [`documentation/API-CONTRACT.md`](../documentation/API-CONTRACT.md)
- Yol haritası: [`documentation/ROADMAP.md`](../documentation/ROADMAP.md) — Faz 2
