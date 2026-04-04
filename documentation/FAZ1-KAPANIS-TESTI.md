# Faz 1 kapanış testi (Postman / Swagger)

**Amaç:** Randevu oluşturma ve **aynı personelde çakışma** senaryolarının doğrulanması — roadmap Faz 1 çıkış kriteri.

**Önkoşullar:** `migrate` uygulanmış; `runserver` çalışıyor; tarayıcıda **`/api/v1/docs/`** (Swagger UI) açılabiliyor.

---

## Otomatik test (pytest değil — Django `TestCase`)

Aynı senaryo kodla da doğrulanır; test veritabanı ayrıdır (kalıcı DB’yi silmez):

```powershell
cd backend
$env:USE_SQLITE="1"   # isteğe bağlı; yoksa .env’deki DB kullanılır
.\.venv\Scripts\python.exe manage.py test api.tests.test_faz1_kapanis_e2e -v 2
```

**Beklenen:** `Ran 1 test ... OK` — kayıt, token, slotlar, `201` + çakışmada `400`, `appointments/me` listesi.

---

## Adım 0 — Demo veriyi yükle (önerilir)

Tek seferlik demo işletme, hizmet, personel ve personel–hizmet eşlemesi:

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py seed_faz1_kapanis
```

İsteğe bağlı: `--owner-email` ve `--owner-password` (yeni sahip oluşturulurken).

Komut çıktısında **`business_id`**, **`service_id`**, **`staff_id`** ve **örnek iş günü tarihi** (`YYYY-MM-DD`) yazar — sonraki adımlarda bunları kullanın.

> Veriyi elle oluşturmak isterseniz: Django **Admin**’de işletme (geçerli `working_hours` §4), hizmet (süre örn. 30 dk), personel ve **Personel–hizmet** kaydı gerekir.

---

## Adım 1 — Müşteri kaydı

Swagger’da **`POST /api/v1/auth/register/`** → **Try it out**

Örnek gövde:

```json
{
  "email": "musteri-kapanis@ornek.com",
  "password": "kapanisTest123",
  "full_name": "Kapanış Test Müşteri",
  "phone": "+905551112233",
  "role": "customer"
}
```

**Beklenen:** `201` (aynı e-posta tekrar denenirse `400`).

---

## Adım 2 — JWT al

**`POST /api/v1/auth/token/`**

```json
{
  "email": "musteri-kapanis@ornek.com",
  "password": "kapanisTest123"
}
```

**Beklenen:** `200` ve gövdede `access` (ve `refresh`).

`access` değerini kopyalayın.

---

## Adım 3 — Swagger’da yetkilendirme

Sayfanın üstünde **Authorize** → **Value:** `Bearer <access>` (kelime `Bearer` ve boşluk + token) → **Authorize** → **Close**.

Böylece korumalı uçlar (`appointments`, `appointments/me`) çalışır.

---

## Adım 4 — İşletme listesi / detay (isteğe bağlı doğrulama)

- **`GET /api/v1/businesses/`** → `200`, listede demo işletme.
- **`GET /api/v1/businesses/{id}/`** → Adım 0’daki `business_id` ile `200`; `services` ve `staff` içinde Adım 0’daki ID’ler görünür.

---

## Adım 5 — Müsait slotlar

**`GET /api/v1/appointments/available-slots/`**

Query (Try it out’ta parametreler):

| Parametre     | Değer |
|---------------|--------|
| `staff_id`    | Adım 0 çıktısı |
| `service_id`  | Adım 0 çıktısı |
| `date`        | Adım 0’daki **iş günü** `YYYY-MM-DD` (geçmiş gün kullanmayın) |
| `slot_minutes`| `15` (isteğe bağlı) |

**Beklenen:** `200`; `slots` dizisinde en az bir öğe (`starts_at` / `ends_at`) — iş günü ve saatler uygunsa.

> Boş `slots`: tarihi iş günü yapın; işletme `working_hours` ve personel–hizmetin tanımlı olduğundan emin olun (Adım 0 genelde yeterlidir).

---

## Adım 6 — İlk randevuyu oluştur

**`POST /api/v1/appointments/`** (Authorize gerekli)

`starts_at` için **Adım 5’te dönen ilk slotun `starts_at` değerini** aynen kullanın (timezone ile).

Örnek gövde (kendi ID ve datetime’ınızla değiştirin):

```json
{
  "business": 1,
  "staff": 1,
  "service": 1,
  "starts_at": "2026-04-06T09:00:00+03:00",
  "customer_note": "Faz1 kapanış — başarılı"
}
```

**Beklenen:** `201`; yanıtta `id`, `starts_at`, `ends_at`, `status` (ör. `confirmed`).

---

## Adım 7 — Çakışma (aynı personel, kesişen aralık)

Aynı endpoint ile **ikinci** istek: **aynı** `business`, `staff`, `service`; `starts_at` olarak **birinci randevuyla kesişen** bir zaman (ör. aynı `starts_at` veya 15 dk kaydırılmış kesişen slot).

**Beklenen:** **`400 Bad Request`**; gövde örneği: `"__all__": ["Bu personel için seçilen aralıkta başka bir randevu var."]` (model doğrulaması).

> API sözleşmesinde `409` de geçebilir; mevcut uygulama **400** + doğrulama mesajı döner — “çakışma reddedildi” kabulüdür.

---

## Adım 8 — Kendi randevularım

**`GET /api/v1/appointments/me/`**

**Beklenen:** `200`; Adım 6’daki randevu listede görünür (sayfalama varsa `results` içinde).

---

## Özet kontrol listesi

| # | Senaryo | Beklenen |
|---|---------|----------|
| 1 | Müşteri kayıt + token | `201` / `200` + `access` |
| 2 | Müsait slotlar | `200`, uygun günde dolu `slots` |
| 3 | İlk randevu | `201` |
| 4 | Aynı personele çakışan ikinci randevu | `400` (veya ürün kararı `409`) |
| 5 | `GET .../appointments/me/` | Oluşturulan randevu listelenir |

---

## Backend notu (uygulama davranışı)

- `ends_at` istemci göndermez; sunucu `starts_at` + hizmet süresi ile hesaplar (`Appointment.save`).
- Çakışma reddi **HTTP 400** ve genelde `__all__` altında Türkçe mesaj olarak döner.

## Sorun giderme

- **401:** Token süresi dolmuş veya Authorize’da `Bearer ` eksik — Adım 2–3’ü tekrarlayın.
- **403:** Müşteri olmayan kullanıcı — `role: customer` ile kayıt olun.
- **Slot boş:** Tarih iş günü mü, `seed_faz1_kapanis` çalıştı mı, admin’de `working_hours` geçerli mi kontrol edin.
- **Windows’ta şema/UTF-8:** `PYTHONUTF8=1` ile `manage.py spectacular --validate` (README).

---

*Bu belge Faz 1 kapanış doğrulaması içindir; güncellemeler PR ile yapılır.*
