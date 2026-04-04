# Yol Haritası (Roadmap)

Bu belge, **Coirendevouz** için fazlara ayrılmış teslimat sırasını tanımlar. Tarihler bilinç olarak **bağlayıcı değildir**; ekip hızına göre güncellenir.

---

## Faz 0 — Hazırlık ve ortak dil

| # | Çıktı | Not |
|---|--------|-----|
| 0.1 | Ürün dokümantasyonu (`PROJECT.md`) ve repo özeti (`README`) | **Tamamlandı.** Tek kaynak; revizyon issue veya PR ile yapılır. |
| 0.2 | Monorepo klasör iskeleti (`backend/`, `frontend-web/`, `mobile/` hedef) | **Tamamlandı.** `backend/` + [`frontend-web/README.md`](../frontend-web/README.md); `web/` klasör adı yerine `frontend-web/` kullanılır. |
| 0.3 | Veri modeli taslağı (ER mantığı) ve API sözleşmesi taslağı | **Tamamlandı.** [`DATA-MODEL.md`](./DATA-MODEL.md), [`API-CONTRACT.md`](./API-CONTRACT.md) — backend–frontend sözleşmesi. |
| 0.4 | Issue şablonu (başlık + kabul kriterleri) | **Tamamlandı.** [`.github/ISSUE_TEMPLATE/gorev.yml`](../.github/ISSUE_TEMPLATE/gorev.yml) — gündüz mobilde kayıt, akşam uygulama akışı için. |

**Çıkış kriteri:** Ekip aynı tabloları ve ana endpoint’leri isimlendirme düzeyinde konuşabiliyor.

**Faz 0 durumu:** 0.1–0.4 tamamlandı; Faz 1’e geçilebilir.

---

## Faz 1 — MVP backend çekirdeği

| # | Çıktı | Not |
|---|--------|-----|
| 1.1 | Django projesi, PostgreSQL, temel ayarlar | **Tamamlandı.** [`backend/README.md`](../backend/README.md), `requirements.txt`, `.env.example` — [#2](https://github.com/declarck/coirendevouz-app/issues/2). Ortamlar: dev / staging ayrımı ileride. |
| 1.2 | Kullanıcı modeli ve roller (müşteri, işletme yöneticisi, istenirse personel) | **Tamamlandı.** `users.User` — e-posta girişi, `Role`, admin; ayrıntı [`backend/README.md`](../backend/README.md). |
| 1.3 | İşletme, hizmet, personel, personel–hizmet ilişkisi modelleri | **Tamamlandı.** `business` uygulaması: `Business`, `Service`, `Staff`, `StaffService` (M2M `through`). |
| 1.4 | Randevu modeli ve çakışma kontrolü | **Tamamlandı.** `appointments.Appointment` — `clean` ile kesişim; `save` içinde `transaction.atomic` + `select_for_update` (personel kilidi). |
| 1.5 | Çalışma saatleri (işletme / personel) MVP temsil'i | **Tamamlandı.** `business/working_hours.py` — §4 şema doğrulaması; `Staff.get_effective_working_hours()`. |
| 1.6 | DRF ile CRUD + **müsait slot** hesaplama endpoint’i | **Tamamlandı.** `api` uygulaması: JWT (`/api/v1/auth/token/`), kayıt, `GET /api/v1/businesses/`, müsait slot `GET /api/v1/appointments/available-slots/`, randevu `POST /api/v1/appointments/`, `GET /api/v1/appointments/me/`. Ayrıntı [`backend/README.md`](../backend/README.md), [`API-CONTRACT.md`](./API-CONTRACT.md). |
| 1.7 | OpenAPI / Swagger | **Tamamlandı.** `drf-spectacular` — OpenAPI 3 şema `/api/v1/schema/`, Swagger UI `/api/v1/docs/`, ReDoc `/api/v1/redoc/`. Ayrıntı [`backend/README.md`](../backend/README.md). |

**Çıkış kriteri:** Postman veya eşdeğeri ile randevu oluşturma ve çakışma senaryoları doğrulanır — adım adım: [`FAZ1-KAPANIS-TESTI.md`](./FAZ1-KAPANIS-TESTI.md); demo veri: `python manage.py seed_faz1_kapanis`.

---

## Faz 2 — MVP web (işletme paneli)

### Özet tablo (yüksek seviye)

| # | Çıktı | Not |
|---|--------|-----|
| 2.1 | React + TS proje iskeleti, API istemcisi, auth akışı | **Kısmen tamam:** Minimal `apps/admin`, Zone `apps/site`, JWT + CORS + `GET /users/me/`. Aşağıdaki **2.1.x** maddeleriyle tamamlanır. |
| 2.2 | Giriş / kayıt (işletme tarafı) | İşletme yöneticisi kaydı veya davet akışı; şablon formlarının Django ile hizalanması. |
| 2.3 | Ajanda görünümü (gün/hafta) | Backend `schedule` uçu + liste takvimi. |
| 2.4 | Personel ve hizmet yönetimi ekranları | CRUD + doğrulama. |
| 2.5 | Manuel randevu oluşturma | Müşteri kullanıcı seçimi veya MVP misafir stratejisi. |

**Çıkış kriteri:** Bir işletme demo verisi ile uçtan uca randevu yönetimi yapılabilir.

### Faz 2 — Ayrıntılı uygulama planı (sıra)

Aşağıdaki sıra **bilinçli**: önce işletme kapsamı ve API, sonra ekranlar. [`API-CONTRACT.md`](./API-CONTRACT.md) §5 ile uyum hedeflenir; sapma olursa önce sözleşme güncellenir, sonra kod.

#### A — Backend (işletme paneli API)

| Sıra | Kod | İçerik | Bağımlılık |
|------|-----|--------|------------|
| A.1 | `2-BE-01` | **Yetki katmanı:** `business_admin` (ve istenirse `staff`) için DRF izinleri; işletme kaynaklarında `owner` / üyelik kontrolü. | — |
| A.2 | `2-BE-02` | **İşletme kapsamı:** Yöneticinin işletme(ler)ine erişim — örn. `GET /api/v1/businesses/mine/` veya `users/me` içinde `owned_businesses` (sözleşmeye göre netleştirilir). | A.1 |
| A.3 | `2-BE-03` | **Hizmet CRUD:** `GET/POST /api/v1/businesses/{id}/services/`, `GET/PATCH/DELETE .../services/{id}/` (soft delete: `is_active`). | A.2 |
| A.4 | `2-BE-04` | **Personel CRUD:** `.../staff/` ile aynı desen. | A.2 |
| A.5 | `2-BE-05` | **Personel–hizmet ataması:** `PUT .../staff/{staff_id}/services/` veya eşdeğeri (`service_ids`). | A.3, A.4 |
| A.6 | `2-BE-06` | **Ajanda:** `GET .../businesses/{id}/schedule/?from=&to=` — randevu listesi + müşteri özeti. | A.2, randevu modeli (mevcut) |
| A.7 | `2-BE-07` | **Manuel randevu:** `POST .../appointments/manual/` — `staff_id`, `service_id`, `starts_at`, `customer_user_id` (veya MVP misafir/müşteri stratejisi). | A.5, A.6 |
| A.8 | `2-BE-08` | **Randevu güncelleme:** `PATCH /api/v1/appointments/{id}/` — durum (`completed`, `cancelled` vb.) işletme yetkisiyle. | A.1, A.6 |
| A.9 | `2-BE-09` | **Profil:** `PATCH /api/v1/users/me/` (sözleşme §6) — ad, telefon. | Mevcut `GET` ile birlikte |
| A.10 | `2-BE-10` | OpenAPI şeması, README tablosu ve gerekirse **API-CONTRACT** düzeltmesi. | A.1–A.9 |

#### B — Frontend (`frontend-web/apps/admin`, Minimal)

| Sıra | Kod | İçerik | Bağımlılık |
|------|-----|--------|------------|
| B.1 | `2-FE-01` | Ortak **API istemcisi** (axios instance, `Authorization`, **refresh token** yenileme, hata mesajları). | Mevcut JWT |
| B.2 | `2-FE-02` | **Menü / sayfa iskeleti:** Coirendevouz modülleri (demo sayfaları gizlenir veya kaldırılır); ana rota grupları. | B.1 |
| B.3 | `2-FE-03` | **İşletme bağlamı:** Oturumdan işletme seçimi veya tek işletme; route guard. | A.2, B.1 |
| B.4 | `2-FE-04` | **Hizmetler** ekranı: liste + oluştur/düzenle. | A.3, B.3 |
| B.5 | `2-FE-05` | **Personel** ekranı: liste + oluştur/düzenle + hizmet ataması. | A.4, A.5, B.3 |
| B.6 | `2-FE-06` | **Ajanda** ekranı: gün/hafta liste veya takvim widget’ı. | A.6, B.3 |
| B.7 | `2-FE-07` | **Manuel randevu** sihirbazı veya form. | A.7, B.5 |
| B.8 | `2-FE-08` | **Randevu detay / durum** (tamamlandı, iptal). | A.8, B.6 |
| B.9 | `2-FE-09` | **Kayıt / davet** (işletme yöneticisi) — MVP kapsamı netliği. | A.1, 2.2 |
| B.10 | `2-FE-10` | Smoke test dokümanı veya Playwright/Cypress iskeleti (isteğe bağlı). | B.4–B.8 |

#### C — Müşteri sitesi (`frontend-web/apps/site`, Zone)

| Sıra | Kod | İçerik |
|------|-----|--------|
| C.1 | `2-SITE-01` | Ana sayfa / iletişim bileşenlerini Coirendevouz metinleriyle sadeleştirme. |
| C.2 | `2-SITE-02` | “Randevu al” için deep link veya Faz 3 mobil öncesi basit yönlendirme (ürün kararı). |

> **Not:** Müşteri akışının asıl derinliği **Faz 3**; C maddeleri Faz 2 sonunda veya Faz 3 başlangıcında yapılabilir.

#### D — Tanımlar (issue / PR başlığında kullanım)

- Görev kodu: `2-BE-04` gibi referans verilebilir.
- Her alt görev bitince bu tabloda ilgili satır “tamamlandı” diye işaretlenir (PR veya commit mesajında kod kullanılır).

---

## Faz 3 — MVP mobil (müşteri)

| # | Çıktı | Not |
|---|--------|-----|
| 3.1 | Expo + React Native + TS iskeleti | Ortak tipler mümkün olduğunca paylaşılır. |
| 3.2 | Keşif ve işletme detayı | Liste/harita kararı. |
| 3.3 | Randevu sihirbazı: hizmet → personel → slot | Backend slot API’sine bağlı. |
| 3.4 | Randevularım, iptal/değişiklik kuralları | İş kuralları backend’de zorunlu. |
| 3.5 | Push bildirim altyapısı (en azından tasarım + stub) | Tam entegrasyon faz 4’e kayabilir. |

**Çıkış kriteri:** Son kullanıcı akışı demo ile gösterilebilir.

---

## Faz 4 — Bildirim, kalite, dağıtım

| # | Çıktı | Not |
|---|--------|-----|
| 4.1 | Randevu onayı / hatırlatma (SMS veya e-posta veya push) | Celery + Redis veya sağlayıcı API. |
| 4.2 | Temel testler (backend birim/entegrasyon, kritik UI akışları) | Regresyon için minimum set. |
| 4.3 | CI (lint, test) | GitHub Actions veya eşdeğeri. |
| 4.4 | Staging ortamı ve sürüm etiketleme | `v0.x` MVP. |

---

## Faz 5 — Büyüme özellikleri (MVP sonrası)

Öncelik ürün ve geri bildirime göre seçilir; örnekler:

- Gerçek kullanıcı yorumları ve puan (sadece tamamlanan randevular).
- Kampanya veya indirim duyuruları.
- Gelir / randevu özet raporları.
- Ön ödeme / kapora entegrasyonu.
- Stok veya muhasebe modülleri (daha sonra).

---

## Çalışma biçimi (ekip)

- **Gündüz:** Mobil veya web üzerinden GitHub **issue** olarak görev ve kabul kriteri kaydı.
- **Akşam:** Geliştirme oturumunda issue’lar sırayla ele alınır; dokümantasyon gerekiyorsa `documentation/` güncellenir.

---

*Son güncelleme: Nisan 2026 — Faz 2 ayrıntılı plan eklendi.*
