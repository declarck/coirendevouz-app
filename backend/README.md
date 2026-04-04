# Coirendevouz — Backend (Django)

Django tabanlı API projesi.

- **Faz 1.1:** proje iskeleti, ortam değişkenleri, PostgreSQL bağlantısı.
- **Faz 1.2:** özel kullanıcı modeli (`users.User`), e-posta ile giriş, roller (`customer`, `business_admin`, `staff`), Django admin entegrasyonu.
- **Faz 1.3:** işletme, hizmet, personel, personel–hizmet (`business` uygulaması); admin’de yönetilebilir.
- **Faz 1.4:** randevu modeli (`appointments`), iptal dışı çakışma kontrolü, kayıtta personel satır kilidi.
- **Faz 1.5:** çalışma saatleri JSON şeması (`DATA-MODEL.md` §4) — `validate_business_working_hours` / `validate_staff_working_hours`, etkin saatler için `resolve_effective_working_hours` / `Staff.get_effective_working_hours()`.
- **Faz 1.6:** Django REST Framework + SimpleJWT — REST API öneki **`/api/v1/`** (bkz. [`documentation/API-CONTRACT.md`](../documentation/API-CONTRACT.md)).

## REST API (Faz 1.6)

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/api/v1/auth/register/` | Kayıt (`role`: `customer` vb.) |
| POST | `/api/v1/auth/token/` | JWT (gövde: `email`, `password`) |
| POST | `/api/v1/auth/token/refresh/` | Access token yenileme |
| GET | `/api/v1/businesses/` | İşletme listesi (`category`, `q`, `lat`+`lng`+`radius_km`) |
| GET | `/api/v1/businesses/{id}/` | İşletme detayı (hizmetler, personel) |
| GET | `/api/v1/appointments/available-slots/` | Müsait slotlar (`staff_id`, `service_id`, `date`, isteğe bağlı `slot_minutes`) |
| POST | `/api/v1/appointments/` | Randevu oluşturma (Bearer; müşteri) |
| GET | `/api/v1/appointments/me/` | Oturumdaki müşterinin randevuları (`status` filtresi) |

## Önkoşullar

- Python 3.12+ (3.14 ile uyumluluk test edildi)
- Üretim ve yerel geliştirme için **PostgreSQL** (önerilen)

## Kurulum

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

`.env` dosyasını düzenleyin:

- **PostgreSQL:** `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT` alanlarını doldurun; veya tek satır **`DATABASE_URL=postgresql://...`** kullanın.
- **Sadece hızlı deneme:** `USE_SQLITE=1` ile geçici SQLite (üretimde kullanmayın).

## Veritabanı

PostgreSQL’de veritabanı ve kullanıcı oluşturduktan sonra:

```powershell
.\.venv\Scripts\python.exe manage.py migrate
```

### Özel kullanıcı modeli (Faz 1.2)

`AUTH_USER_MODEL = users.User` — giriş **e-posta** ile; alanlar: `full_name`, `phone`, `role`, `created_at`.

**Önemli:** Daha önce varsayılan `auth.User` ile migrate edilmiş bir veritabanınız varsa, `AUTH_USER_MODEL` değişikliğinden sonra şema uyumsuz olur. Geliştirme ortamında veritabanını silip `migrate` ile sıfırdan kurun (PostgreSQL’de DB’yi yeniden oluşturun veya `DROP` + `CREATE`).

### Süper kullanıcı

Etkileşimli:

```powershell
.\.venv\Scripts\python.exe manage.py createsuperuser
```

Otomasyon (`--noinput`):

```powershell
$env:DJANGO_SUPERUSER_PASSWORD="güvenli-parola"
$env:DJANGO_SUPERUSER_FULL_NAME="Ad Soyad"
.\.venv\Scripts\python.exe manage.py createsuperuser --noinput --email admin@example.com
```

## Çalıştırma

```powershell
.\.venv\Scripts\python.exe manage.py runserver
```

Tarayıcıda **`http://127.0.0.1:8000/`** kök adresinde kısa bir karşılama sayfası (API ve admin bağlantıları) görünür; JSON API uçları **`/api/v1/...`** altındadır.

### Hızlı smoke test (PowerShell)

Sunucu `http://127.0.0.1:8000` iken; PowerShell’de gerçek `curl` için **`curl.exe`** kullanın (aksi halde `curl` `Invoke-WebRequest` alias’ına gidebilir).

**1) Müşteri kaydı**

```powershell
curl.exe -s -X POST "http://127.0.0.1:8000/api/v1/auth/register/" `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"musteri@ornek.com\",\"password\":\"parola12345\",\"full_name\":\"Test Musteri\",\"phone\":\"+905551112233\",\"role\":\"customer\"}"
```

**2) JWT al (gövde alanı: `email`, `password`)**

```powershell
curl.exe -s -X POST "http://127.0.0.1:8000/api/v1/auth/token/" `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"musteri@ornek.com\",\"password\":\"parola12345\"}"
```

Yanıttaki `access` değerini bir değişkene alıp sonraki isteklerde kullanın:

```powershell
$token = "<access_jwt_buraya>"
```

**3) İşletme listesi / detay**

```powershell
curl.exe -s "http://127.0.0.1:8000/api/v1/businesses/"
curl.exe -s "http://127.0.0.1:8000/api/v1/businesses/1/"
```

**4) Müsait slotlar** — Admin’de veya detay yanıtından geçerli `staff_id`, `service_id` ve `YYYY-MM-DD` tarihi kullanın:

```powershell
curl.exe -s "http://127.0.0.1:8000/api/v1/appointments/available-slots/?staff_id=1&service_id=1&date=2026-04-15"
```

**5) Randevu oluştur** — `starts_at` ISO 8601 (timezone ile); `business`, `staff`, `service` ilgili işletmeye ait PK’lar olmalı:

```powershell
curl.exe -s -X POST "http://127.0.0.1:8000/api/v1/appointments/" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d "{\"business\":1,\"staff\":1,\"service\":1,\"starts_at\":\"2026-04-15T09:00:00+03:00\",\"customer_note\":\"Test\"}"
```

**6) Kendi randevularım**

```powershell
curl.exe -s "http://127.0.0.1:8000/api/v1/appointments/me/" `
  -H "Authorization: Bearer $token"
```

Slot ve randevu adımları için veritabanında en az bir işletme, hizmet, personel, personel–hizmet eşlemesi ve geçerli `working_hours` gerekir; yoksa önce **`/admin`** veya veri yüklemesi ile örnek kayıt oluşturun.

## Sorun giderme

- `ImproperlyConfigured: Veritabanı ayarlanmadı` → `.env` içinde `POSTGRES_*` veya `DATABASE_URL` tanımlayın; ya da yerel deneme için `USE_SQLITE=1`.
- Windows’ta `psycopg` kurulumu için `psycopg[binary]` `requirements.txt` içinde tanımlıdır.

## İlgili dokümantasyon

- [documentation/DATA-MODEL.md](../documentation/DATA-MODEL.md)
- [documentation/API-CONTRACT.md](../documentation/API-CONTRACT.md)
- Issue: [#2](https://github.com/declarck/coirendevouz-app/issues/2) (Faz 1.1)
