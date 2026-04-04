# Coirendevouz

Kuaför, berber ve güzellik merkezleri için **randevu yönetimi** ve son kullanıcılar için **yakın işletmelerde müsait slot üzerinden rezervasyon** sunmayı hedefleyen monorepo uygulaması. İşletme tarafında hafif bir **CRM**; müşteri tarafında **telefonsuz, net bir randevu akışı** önceliklidir.

## Özet

| | |
|--|--|
| **Ne yapar?** | İşletmeler personel ve hizmet tanımlar; müşteriler hizmet ve personel seçerek uygun saatlerde randevu alır. |
| **Kimler için?** | Son kullanıcı (mobil), işletme yetkilileri (web panel). |
| **Teknoloji (hedef)** | Django + DRF, PostgreSQL, React + TypeScript (web), React Native + Expo (mobil). |
| **Kapsam sınırı** | Sektör: kuaför / berber / güzellik; genel amaçlı “süper uygulama” değil. |

## Dokümantasyon

| Belge | İçerik |
|--------|--------|
| [documentation/PROJECT.md](documentation/PROJECT.md) | Vizyon, roller, MVP kapsamı, iş kuralları, teknik çerçeve |
| [documentation/ROADMAP.md](documentation/ROADMAP.md) | Fazlar, teslimat sırası, çalışma notları |
| [documentation/DATA-MODEL.md](documentation/DATA-MODEL.md) | Veri modeli taslağı (ER), enum’lar, çalışma saatleri JSON |
| [documentation/API-CONTRACT.md](documentation/API-CONTRACT.md) | REST API sözleşmesi taslağı ve örnek yükler |

## Repo yapısı

```text
backend/          # Django API (bkz. backend/README.md)
frontend-web/     # React + TS — işletme paneli + müşteri sitesi (bkz. frontend-web/README.md)
documentation/  # Ürün ve yol haritası
mobile/           # React Native / Expo (müşteri) — henüz yok
```

## Yerel geliştirme

**Backend:** [backend/README.md](backend/README.md) — sanal ortam, `requirements.txt`, `.env`, PostgreSQL veya geçici SQLite (`USE_SQLITE=1`).

Önkoşullar (tüm monorepo için): Python 3.12+, Node.js LTS (ileride web/mobil), PostgreSQL (backend için önerilir).

## Katkı ve iş akışı

- Görevler GitHub **issue** olarak kaydedilir; geliştirme oturumlarında issue numarası ve kabul kriterleri baz alınır.
- Yeni issue açarken şablon: [Görev](.github/ISSUE_TEMPLATE/gorev.yml) (özet, alan, kabul kriterleri).
- Dokümantasyon değişiklikleri `documentation/` altında tutulur.

## Lisans

Belirlenecek.

---

*Coirendevouz — güzellik ve bakım sektörü için akıllı randevu deneyimi.*
