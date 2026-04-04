# Coirendevouz — Backend (Django)

Django tabanlı API projesi.

- **Faz 1.1:** proje iskeleti, ortam değişkenleri, PostgreSQL bağlantısı.
- **Faz 1.2:** özel kullanıcı modeli (`users.User`), e-posta ile giriş, roller (`customer`, `business_admin`, `staff`), Django admin entegrasyonu.
- **Faz 1.3:** işletme, hizmet, personel, personel–hizmet (`business` uygulaması); admin’de yönetilebilir.

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

## Sorun giderme

- `ImproperlyConfigured: Veritabanı ayarlanmadı` → `.env` içinde `POSTGRES_*` veya `DATABASE_URL` tanımlayın; ya da yerel deneme için `USE_SQLITE=1`.
- Windows’ta `psycopg` kurulumu için `psycopg[binary]` `requirements.txt` içinde tanımlıdır.

## İlgili dokümantasyon

- [documentation/DATA-MODEL.md](../documentation/DATA-MODEL.md)
- [documentation/API-CONTRACT.md](../documentation/API-CONTRACT.md)
- Issue: [#2](https://github.com/declarck/coirendevouz-app/issues/2) (Faz 1.1)
