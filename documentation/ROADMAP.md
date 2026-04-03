# Yol Haritası (Roadmap)

Bu belge, **Coirendevouz** için fazlara ayrılmış teslimat sırasını tanımlar. Tarihler bilinç olarak **bağlayıcı değildir**; ekip hızına göre güncellenir.

---

## Faz 0 — Hazırlık ve ortak dil

| # | Çıktı | Not |
|---|--------|-----|
| 0.1 | Ürün dokümantasyonu (`PROJECT.md`) ve repo özeti (`README`) | **Tamamlandı.** Tek kaynak; revizyon issue veya PR ile yapılır. |
| 0.2 | Monorepo klasör iskeleti (`backend/`, `web/`, `mobile/`) | **Tamamlandı.** Boş veya minimal şablon commit’leri. |
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
| 1.3 | İşletme, hizmet, personel, personel–hizmet ilişkisi modelleri | M2M veya `through` tablosu. |
| 1.4 | Randevu modeli ve çakışma kontrolü | Transaction / `select_for_update` vb. |
| 1.5 | Çalışma saatleri (işletme / personel) MVP temsil'i | JSON veya tablo; dokümante edilmiş şema. |
| 1.6 | DRF ile CRUD + **müsait slot** hesaplama endpoint’i | En kritik iş mantığı. |
| 1.7 | OpenAPI / Swagger | Frontend ve test için. |

**Çıkış kriteri:** Postman veya eşdeğeri ile randevu oluşturma ve çakışma senaryoları doğrulanır.

---

## Faz 2 — MVP web (işletme paneli)

| # | Çıktı | Not |
|---|--------|-----|
| 2.1 | React + TS proje iskeleti, API istemcisi, auth akışı | Token saklama güvenliği. |
| 2.2 | Giriş / kayıt (işletme tarafı) | MVP kapsamına göre sadeleştirilir. |
| 2.3 | Ajanda görünümü (gün/hafta) | Liste takvimi ile başlanabilir. |
| 2.4 | Personel ve hizmet yönetimi ekranları | Form doğrulamaları. |
| 2.5 | Manuel randevu oluşturma | Müşteri seçimi veya hızlı kayıt. |

**Çıkış kriteri:** Bir işletme demo verisi ile uçtan uca randevu yönetimi yapılabilir.

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

*Son güncelleme: Nisan 2026*
