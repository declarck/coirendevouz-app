# Coirendevouz — Backend (Django)

Django tabanlı API projesi. **Faz 1.1:** proje iskeleti, ortam değişkenleri ve PostgreSQL bağlantısı.

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
