# API sözleşmesi taslağı (REST)

**Base URL (örnek):** `https://api.example.com/api/v1`  
**Format:** JSON, UTF-8  
**Kimlik doğrulama:** `Authorization: Bearer <access_token>` (JWT veya eşdeğeri; tam format Faz 1’de netleşir)

Hata yanıtları için ortak yapı önerisi:

```json
{
  "error": {
    "code": "validation_error",
    "message": "İnsan tarafından okunabilir özet",
    "details": {}
  }
}
```

---

## 1. Kimlik doğrulama

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/auth/register/` | Müşteri veya işletme kaydı (gövdede rol / tip ayrımı) |
| POST | `/auth/token/` | Giriş; access (+ isteğe bağlı refresh) token |
| POST | `/auth/token/refresh/` | Refresh token ile yenileme (kullanılıyorsa) |

### 1.1 Kayıt — örnek istek (müşteri)

```json
{
  "email": "musteri@ornek.com",
  "password": "********",
  "full_name": "Ayşe Yılmaz",
  "phone": "+905551112233",
  "role": "customer"
}
```

**İşletme yöneticisi (panel):** Aynı uç nokta; `role`: `business_admin` (veya `staff`). Yanıtta kullanıcı özeti (JWT yok); oturum için ardından `POST /auth/token/` kullanılır. **MVP:** Kullanıcı kaydı, işletme (`Business`) kaydından ayrıdır; işletme yönetici ile ilişkilendirilmedikçe `GET /businesses/mine/` boş olabilir. Davet / self-serve işletme oluşturma ürün kararına bırakılmıştır.

### 1.2 Token — örnek yanıt

```json
{
  "access": "<jwt>",
  "refresh": "<jwt>",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## 2. İşletmeler (keşif ve detay)

### 2.1 Liste — `GET /businesses/`

**Query parametreleri (MVP):**

| Parametre | Örnek | Açıklama |
|-----------|--------|----------|
| `lat`, `lng` | 39.92, 32.85 | Yakınlık (birlikte zorunlu) |
| `radius_km` | 5 | Varsayılan ürün kararı |
| `category` | `barber` | `DATA-MODEL.md` ile uyumlu enum |
| `q` | `ankara çankaya` | Metin arama |
| `page`, `page_size` | 1, 20 | Sayfalama |

**Örnek yanıt:**

```json
{
  "count": 42,
  "next": "?page=2",
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Salon Örnek",
      "slug": "salon-ornek",
      "category": "barber",
      "city": "Ankara",
      "district": "Çankaya",
      "latitude": 39.92077,
      "longitude": 32.85411,
      "is_active": true
    }
  ]
}
```

### 2.2 Detay — `GET /businesses/{id}/`

İşletme, hizmet listesi ve personel özetini döner (iç içe veya `?_expand=` ile genişletme backend kararı).

**Örnek yanıt (özet):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Salon Örnek",
  "slug": "salon-ornek",
  "category": "barber",
  "description": "…",
  "address_line": "…",
  "city": "Ankara",
  "district": "Çankaya",
  "latitude": 39.92077,
  "longitude": 32.85411,
  "working_hours": {},
  "services": [
    {
      "id": "…",
      "name": "Saç kesimi",
      "duration_minutes": 30,
      "price": "500.00",
      "is_active": true
    }
  ],
  "staff": [
    {
      "id": "…",
      "display_name": "Mehmet",
      "is_active": true,
      "service_ids": ["…"]
    }
  ]
}
```

### 2.3 Panel — `GET /businesses/mine/`

**Yetki:** `Authorization: Bearer` — rol `business_admin` veya `staff` (müşteri token’ı **403**).

**Açıklama:** Kullanıcının **sahibi** olduğu (`Business.owner`) veya **aktif personel** kaydıyla bağlı olduğu işletmeler. Django **süper kullanıcı** (`is_superuser`) için yanıtta **tüm aktif** işletmeler döner (panelde işletme seçimi / destek). Yanıt gövdesi, sayfalama ile `GET /businesses/` listesi ile uyumlu (`count`, `next`, `previous`, `results`); öğe alanları liste şeması ile aynıdır.

---

## 3. Müsait slotlar (kritik)

### `GET /appointments/available-slots/`

**Yetki:** Genelde anonim veya müşteri token’ı (ürün kararı).

**Query parametreleri:**

| Parametre | Zorunlu | Açıklama |
|-----------|---------|----------|
| `staff_id` | evet | |
| `service_id` | evet | Süre ve uygun personel–hizmet kontrolü |
| `date` | evet | ISO tarih `YYYY-MM-DD` (işletme TZ) |

**Örnek yanıt:**

```json
{
  "staff_id": "…",
  "service_id": "…",
  "date": "2026-04-15",
  "slot_minutes": 15,
  "slots": [
    { "starts_at": "2026-04-15T09:00:00+03:00", "ends_at": "2026-04-15T09:30:00+03:00" },
    { "starts_at": "2026-04-15T09:30:00+03:00", "ends_at": "2026-04-15T10:00:00+03:00" }
  ]
}
```

**Hata örnekleri:** personel hizmeti veremiyor, kapalı gün, süre uyuşmazlığı → `400` + `error.code`.

---

## 4. Randevular (müşteri)

### 4.1 Oluşturma — `POST /appointments/`

**Yetki:** Müşteri token’ı.

**Örnek istek:**

```json
{
  "business_id": "…",
  "staff_id": "…",
  "service_id": "…",
  "starts_at": "2026-04-15T09:00:00+03:00",
  "customer_note": "Kısa kesim"
}
```

`ends_at` sunucuda hesaplanır; çakışmada `409 Conflict` veya `400` + net mesaj.

**Örnek yanıt (`201`):**

```json
{
  "id": "…",
  "business_id": "…",
  "staff_id": "…",
  "service_id": "…",
  "starts_at": "2026-04-15T09:00:00+03:00",
  "ends_at": "2026-04-15T09:30:00+03:00",
  "status": "confirmed",
  "source": "customer_app"
}
```

### 4.2 Kendi randevularım — `GET /appointments/me/` veya `GET /users/me/appointments/`

**Yetki:** Müşteri.

**Query:** `status`, `from`, `to`, sayfalama.

**Örnek öğe:** yukarıdaki alanlar + işletme adı özeti (isteğe bağlı `business_name`).

### 4.3 İptal — `POST /appointments/{id}/cancel/` veya `PATCH /appointments/{id}/`

**Yetki:** Randevu sahibi müşteri; iş kuralı (ör. son 24 saat) backend’de.

```json
{ "reason": "optional" }
```

---

## 5. İşletme paneli (business admin)

Tüm endpoint’ler **işletme yetkilisi** veya kapsam içi **personel** token’ı ile; `business_id` URL’de veya token içindeki yetki ile sınırlanır.

### 5.1 Günlük / aralık ajanda — `GET /businesses/{business_id}/schedule/`

**Yetki:** İşletme sahibi veya o işletmenin aktif personeli.

**Query:**

| Parametre | Zorunlu | Açıklama |
|-----------|---------|----------|
| `from` | Evet | `YYYY-MM-DD` — aralığın başı (dahil). |
| `to` | Evet | `YYYY-MM-DD` — aralığın sonu (dahil). Günler `Europe/Istanbul` takvimine göre; `from` ≤ `to` olmalıdır. |
| `status` | Hayır | Randevu durumu (`pending`, `confirmed`, …); tek değer. Verilmezse tüm durumlar. |
| `staff_id` | Hayır | Yalnızca bu personel kayıtlarına ait randevular. **Birden fazla değer:** aynı isimle tekrarlanan sorgu parametreleri (`staff_id=1&staff_id=2`) veya **tek parametrede virgülle liste** (`staff_id=1,2`). Pozitif tam sayılar; tekrarlar tekilleştirilir. Verilmezse veya boşsa tüm personel. İşletmeye ait olmayan veya bulunamayan ID’ler için **400** ve `error.code`: `unknown_staff` (veya geçersiz biçim için `invalid_staff_id`). |

**Örnek:** `GET .../schedule/?from=2026-04-10&to=2026-04-16&status=confirmed&staff_id=3` veya `...&staff_id=1&staff_id=2`.

**Örnek yanıt:**

```json
{
  "business_id": "…",
  "appointments": [
    {
      "id": "…",
      "starts_at": "…",
      "ends_at": "…",
      "status": "confirmed",
      "service": { "id": "…", "name": "Saç kesimi" },
      "staff": { "id": "…", "display_name": "Mehmet" },
      "customer": { "id": "…", "full_name": "Ayşe", "phone": "+90…" }
    }
  ]
}
```

### 5.2 Manuel randevu — `POST /businesses/{business_id}/appointments/manual/`

**Yetki:** İşletme sahibi veya o işletmenin aktif personeli.

```json
{
  "staff_id": 1,
  "service_id": 2,
  "starts_at": "2026-04-15T11:00:00+03:00",
  "customer_user_id": 42,
  "internal_note": "Telefonla aradı"
}
```

`customer_user_id` kayıtlı kullanıcı PK’si olmalı ve rolü **`customer`** olmalı. Personel–hizmet eşleşmesi aktif olmalı; `starts_at` için randevu modeli çakışma kuralları geçerlidir. Yanıtta `status`: `confirmed`, `source`: `business_manual`.

Misafir / işletme içi müşteri kaydı stratejisi ileride genişletilebilir; şu an yalnızca mevcut müşteri hesabına atama desteklenir.

### 5.3 Randevu detayı / durum güncelleme — `GET` ve `PATCH /api/v1/appointments/{id}/`

**Yetki:** Randevunun işletmesinde sahip veya aktif personel (`Authorization: Bearer`). Müşteri token’ı **403**.

**`GET`:** Randevu özeti; `internal_note` dahil (işletme paneli).

**`PATCH` — gövde (kısmi):** En az biri — `status` (`pending`, `confirmed`, `completed`, `cancelled`, `no_show`), `internal_note` (işletme içi not).

```json
{ "status": "completed" }
```

Yanıtta randevu özeti; `internal_note` dahil (müşteri `GET /appointments/me/` yanıtında iç not yok).

### 5.4 Hizmet CRUD — `/businesses/{business_id}/services/`

**Yetki:** İşletme sahibi veya o işletmenin aktif personeli (`Authorization: Bearer`).

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `.../services/` | Liste (panel: aktif + pasif hizmetler; sayfalama diğer listelerle aynı) |
| POST | `.../services/` | Oluştur (gövde: `name`, `duration_minutes`, `price`; isteğe bağlı `is_active`, varsayılan `true`) |
| GET/PATCH/DELETE | `.../services/{id}/` | Okuma / güncelle / **pasifleştir** (`DELETE` fiziksel silme yapmaz; `is_active` false yapılır) |

Aynı işletmede aynı `name` ile ikinci kayıt veritabanı kısıtıyla reddedilir (`duplicate_service_name`).

### 5.5 Personel CRUD — `/businesses/{business_id}/staff/`

**Yetki:** İşletme sahibi veya o işletmenin aktif personeli (`Authorization: Bearer`).

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `.../staff/` | Liste (aktif + pasif; `display_name` sırası; sayfalama) |
| POST | `.../staff/` | Oluştur (`display_name` zorunlu; isteğe bağlı `working_hours`, `user` kullanıcı PK, `is_active`) |
| GET/PATCH/DELETE | `.../staff/{id}/` | Okuma / güncelle / **pasifleştir** (`DELETE` → `is_active` false) |

Okuma yanıtında `service_ids` (aktif personel–hizmet bağları), `user_id`, `working_hours` dahildir.

### 5.6 Personel–hizmet ataması — `PUT /businesses/{business_id}/staff/{staff_id}/services/`

**Yetki:** İşletme sahibi veya o işletmenin aktif personeli.

İstek gövdesi (tamsayı PK listesi; işletme içi hizmetlere ait olmalı):

```json
{ "service_ids": [1, 2, 3] }
```

**Semantik:** Liste, bu personel için **geçerli hizmet kümesinin tamamıdır**. Listede olmayan mevcut `StaffService` bağları pasifleştirilir (`is_active=false`); listedekiler oluşturulur veya yeniden aktifleştirilir. Boş liste tüm bağları pasifleştirir.

Geçersiz veya başka işletmeye ait hizmet PK’leri: `400`, `error.code`: `invalid_service_ids`.

**Yanıt:** `200` — güncel personel nesnesi (`StaffSerializer`; `service_ids` dahil).

---

## 6. Kullanıcı profili

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/users/me/` | Oturumdaki kullanıcı |
| PATCH | `/users/me/` | `full_name` ve/veya `phone` (en az biri); e-posta ve rol değişmez. Yanıt gövdesi `GET` ile aynı: `{ "user": { ... } }`. |

---

## 7. Sürümleme ve OpenAPI

- URL öneki: `/api/v1/`.
- **Faz 1.7:** OpenAPI 3 şeması (Swagger UI) bu sözleşmeyle uyumlu tutulur; tek kaynak mümkünse şemadan üretilir.
- **Faz 2 (işletme paneli):** Uygulanan uçların güncel listesi ve yöntemler için [`backend/README.md`](../backend/README.md) REST tablosu; şema doğrulaması `python manage.py spectacular --validate --fail-on-warn` (uyarı kabul edilmez).

---

## 8. Revizyon

Endpoint path’leri ve alan adları ilk Django/DRF implementasyonunda küçük farklar gösterebilir; değişiklikler bu dosyada ve `DATA-MODEL.md` içinde eş zamanlı güncellenir.

---

*Son güncelleme: Nisan 2026*
