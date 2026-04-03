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

**Query:** `from`, `to` (datetime veya tarih aralığı).

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

```json
{
  "staff_id": "…",
  "service_id": "…",
  "starts_at": "2026-04-15T11:00:00+03:00",
  "customer_user_id": "…",
  "internal_note": "Telefonla aradı"
}
```

Müşteri uygulamada yoksa `customer_user_id` yerine `business_customer` oluşturma / misafir kullanıcı stratejisi Faz 1’de netleşir.

### 5.3 Randevu durumu güncelleme — `PATCH /appointments/{id}/`

**Yetki:** İlgili işletme.

```json
{ "status": "completed" }
```

### 5.4 Hizmet CRUD — `/businesses/{business_id}/services/`

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `.../services/` | Liste |
| POST | `.../services/` | Oluştur |
| GET/PATCH/DELETE | `.../services/{id}/` | Okuma / güncelle / sil (soft delete: `is_active`) |

### 5.5 Personel CRUD — `/businesses/{business_id}/staff/`

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `.../staff/` | Liste |
| POST | `.../staff/` | Oluştur |
| GET/PATCH/DELETE | `.../staff/{id}/` | Okuma / güncelle |

### 5.6 Personel–hizmet ataması — `PUT /staff/{staff_id}/services/`

```json
{ "service_ids": ["…", "…"] }
```

veya ayrı `POST/DELETE` satırları (backend tercihi).

---

## 6. Kullanıcı profili

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/users/me/` | Oturumdaki kullanıcı |
| PATCH | `/users/me/` | Ad, telefon güncelleme |

---

## 7. Sürümleme ve OpenAPI

- URL öneki: `/api/v1/`.
- **Faz 1.7:** OpenAPI 3 şeması (Swagger UI) bu sözleşmeyle uyumlu tutulur; tek kaynak mümkünse şemadan üretilir.

---

## 8. Revizyon

Endpoint path’leri ve alan adları ilk Django/DRF implementasyonunda küçük farklar gösterebilir; değişiklikler bu dosyada ve `DATA-MODEL.md` içinde eş zamanlı güncellenir.

---

*Son güncelleme: Nisan 2026*
