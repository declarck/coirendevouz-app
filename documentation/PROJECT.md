# Coirendevouz — Proje Dokümantasyonu

Bu doküman, kuaför, berber ve güzellik merkezleri ile son kullanıcıları buluşturan randevu ve işletme yönetimi ürününün **kapsamını, kullanıcı rollerini, teknik çerçeveyi ve temel iş kurallarını** tanımlar. Tüm ekip (tasarım, frontend, backend) için **tek referans** olarak kullanılmalıdır.

---

## 1. Vizyon ve problem

### Problem

Son kullanıcılar, yakınlarında uygun bir kuaför veya berbere gitmek istediklerinde sık sık **telefonla arama, mesajlaşma ve “o saatte var mı?” tekrarı** ile zaman kaybeder. İşletmeler ise randevuları defter, WhatsApp veya dağınık araçlarla takip ederek **çakışma, unutma ve müşteri memnuniyetsizliği** riski taşır.

### Çözüm

Tek uygulama üzerinden:

- **Müşteri:** Konum veya tercihine göre işletmeleri keşfeder, hizmet ve personel seçer, **boş slotları** görür ve **rezervasyon** oluşturur; mümkün olduğunca **yüz yüze veya telefon olmadan** işini netleştirir.
- **İşletme:** Randevularını tek panelden yönetir; personel, hizmet ve takvim bilgisini düzenler; CRM’e yakın ama **MVP’de sade** bir operasyon katmanı kullanır.

Ürün **sektör odaklıdır** (kuaför, berber, güzellik merkezi); fotoğrafçı, tesisatçı vb. farklı meslek gruplarına genişleyen bir “süper uygulama” hedefi **yoktur**. Altyapı ise ileride aynı sektör içinde özellik eklemeye uygun şekilde **genişletilebilir** tutulur.

---

## 2. Ürünün iki yüzü

| Yön | Açıklama |
|-----|----------|
| **Pazar yeri (müşteri)** | Yakındaki işletmeleri listeleme/filtreleme, işletme ve personel detayı, müsait slot, rezervasyon oluşturma ve takip. |
| **İşletme paneli (CRM-lite)** | Ajanda, personel ve hizmet tanımları, müşteri iletişim bilgisi (basit), manuel randevu girişi. |

---

## 3. Kullanıcı rolleri

| Rol | Kim | Temel ihtiyaçlar |
|-----|-----|------------------|
| **Müşteri (son kullanıcı)** | Randevu alan kişi | Kayıt/giriş, keşif, slot seçimi, randevu geçmişi, iptal/değişiklik (kurallara bağlı), bildirim. |
| **İşletme yöneticisi** | Salon sahibi veya yetkili | İşletme profili, çalışma düzeni, personel ve hizmet yönetimi, takvim, müşteri kayıtları. |
| **Personel (opsiyonel giriş)** | Çalışan | Kendi randevularını görme; ileride kısıtlı düzenleme (MVP kapsamı ayrı netleştirilir). |

Kimlik doğrulama ve yetkilendirme, **hangi kullanıcının hangi işletme verisine erişebileceğini** net ayıracak şekilde tasarlanır (özellikle çoklu işletme ve personel senaryoları için).

---

## 4. MVP kapsamı (öncelikli)

### Müşteri

- Konum / arama / kategori ile işletme keşfi (liste veya harita stratejisi ürün kararına bağlı).
- İşletme detayı: hizmetler (süre, fiyat), personel listesi.
- **Hizmet → personel → tarih/saat (slot)** akışı ile rezervasyon.
- Randevu listesi (yaklaşan / geçmiş), iptal veya değişiklik (iş kuralları ile sınırlı).
- Bildirim altyapısı için hazırlık; MVP’de en az bir kanal (ör. e-posta veya SMS) hedeflenebilir.

### İşletme

- Dijital ajanda: günlük / haftalık görünüm.
- Personel tanımı, mesai / müsaitlik şablonu (başlangıçta sade model).
- Hizmet kataloğu: ad, süre, fiyat.
- Personel–hizmet eşlemesi (ör. belirli hizmeti sadece belirli personel verir).
- Telefon veya kapıdan gelen müşteri için **manuel randevu** oluşturma.
- Basit müşteri rehberi (iletişim bilgisi).

### Bilinçli olarak MVP dışı veya sonraya bırakılanlar

- Stok, muhasebe, detaylı raporlama (orta/uzun vadede).
- Ön ödeme / kapora (ürün kararına göre orta vade).
- Gelişmiş kampanya ve sadakat (orta vade).

---

## 5. Temel iş kuralları

### Slot ve süre

- Her randevu bir **hizmet** ile bağlıdır; hizmetin **süresi (dakika)** slot hesabının temelidir.
- Randevunun **bitiş zamanı**, başlangıç + hizmet süresi ile tutarlı olmalıdır (hesaplanan veya saklanan alan ile).

### Çakışma önleme

- Aynı **personel** için aynı zaman aralığında, iptal edilmemiş iki randevu **olamaz**.
- Eşzamanlı taleplerde veri tutarlılığı (transaction / kilit stratejisi backend’de tanımlanır).

### Çalışma saatleri

- İşletme ve gerektiğinde personel bazlı **çalışma / kapalı / mola** bilgisi tutulur.
- MVP’de yapı sade tutulabilir (ör. JSON şeması veya normalize tablo); ileride sorgu ihtiyacına göre güçlendirilir.

---

## 6. Teknoloji yığını (hedef)

| Katman | Teknoloji |
|--------|-----------|
| Backend API | Python, **Django**, **Django REST Framework** |
| Veritabanı | **PostgreSQL** |
| Web (işletme / yönetim) | **React**, **TypeScript**, **Vite** (veya eşdeğer toolchain) |
| Mobil (müşteri ağırlıklı) | **React Native**, **TypeScript**, **Expo** |
| API sözleşmesi | REST (JSON), OpenAPI/Swagger tercih edilir |
| Asenkron işler (ileride) | Örn. **Celery** + **Redis** (hatırlatma SMS/e-posta) |

Monorepo düzeni örnek:

```text
backend/    # Django projesi
web/        # React web uygulaması
mobile/     # React Native (Expo)
documentation/
```

İsimlendirme ve paket yapısı repoya göre güncellenebilir; bu doküman **iş gereksinimleri** odaklıdır.

---

## 7. Yasal ve güvenlik notları (yüksek seviye)

- KVKK kapsamında kişisel veri (ad, telefon, randevu geçmişi): **amaç sınırlaması**, **saklama süresi** ve **açık rıza / bilgilendirme** metinleri ürün ve hukuk sürecinde ele alınmalıdır.
- API’de kimlik doğrulama (ör. token tabanlı), yetkilendirme ve güvenli iletişim (HTTPS) zorunlu kabul edilir.

---

## 8. Başarı ölçütleri (MVP için örnek)

- Müşteri, hedef akışta **5 dakikadan kısa sürede** randevu oluşturabilmeli (ölçüm: kullanıcı testi).
- İşletme, günlük randevularını **tek ekrandan** takip edebilmeli.
- Aynı personel için **çakışan randevu** oluşmamalı (teknik ve iş kuralı).

---

## 9. İlgili dokümanlar

- [ROADMAP.md](./ROADMAP.md) — fazlar ve teslimat sırası
- Depo kökündeki [README.md](../README.md) — kısa özet ve yerel geliştirme girişi

---

*Son güncelleme: Nisan 2026*
