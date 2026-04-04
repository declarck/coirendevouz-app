# Faz 1 kapanış — otomatik test raporu

Bu belge, **Faz 1 çıkış kriteri** için eklenen **otomatik uçtan uca (E2E) testin** ne yaptığını sırasıyla ve **örnek başarılı çalıştırma çıktısını** özetler.

**İlgili dosyalar**

- Test kodu: [`backend/api/tests/test_faz1_kapanis_e2e.py`](../backend/api/tests/test_faz1_kapanis_e2e.py)  
- Elle senaryo rehberi: [`FAZ1-KAPANIS-TESTI.md`](./FAZ1-KAPANIS-TESTI.md)

---

## 1. Ne eklendi?

| Öğe | Açıklama |
|-----|----------|
| Django test sınıfı | `Faz1KapanisE2ETests` — `TestCase` + `APIClient` |
| Test metodu | `test_faz1_kapanis_end_to_end` — tek akışta tüm adımlar |
| Test verisi | `setUpTestData`: işletme sahibi, işletme, hizmet, personel, `StaffService` (kalıcı geliştirme DB’sine yazılmaz; test DB’si) |
| Ortam | `@override_settings(ALLOWED_HOSTS=...)` — `testserver` ile DRF istemcisinin çalışması |

---

## 2. Sırasıyla yapılanlar (test içinde)

Test çalıştığında **aşağıdaki sıra** izlenir; her adımda HTTP durum kodu doğrulanır.

| Sıra | İşlem | HTTP / beklenti |
|------|--------|------------------|
| **A** | Test veritabanı oluşturulur, migrasyonlar uygulanır | (Django test altyapısı) |
| **B** | `setUpTestData`: demo işletme grafiği (sahip, işletme, hizmet, personel, personel–hizmet) | — |
| **1** | `POST /api/v1/auth/register/` — benzersiz e-posta ile müşteri kaydı | `201 Created` |
| **2** | `POST /api/v1/auth/token/` — `email` + `password` | `200 OK`, gövdede `access` |
| **3** | `Authorization: Bearer <access>` ile istemci yetkilendirilir | — |
| **4** | `GET /api/v1/appointments/available-slots/` — `staff_id`, `service_id`, `date` (yerel saat diliminde bir sonraki iş günü), `slot_minutes=15` | `200 OK`, `slots` listesi **boş değil** |
| **5** | `POST /api/v1/appointments/` — ilk slotun `starts_at` değeri ile randevu | `201 Created`, `status: confirmed`, `ends_at` var |
| **6** | Aynı gövde ile **ikinci** `POST` (aynı personel / aynı başlangıç) — çakışma | `400 Bad Request`, doğrulama gövdesi (`__all__` vb.) |
| **7** | `GET /api/v1/appointments/me/` | `200 OK`, `results` içinde en az bir randevu |
| **C** | Test veritabanı yok edilir | (Django test altyapısı) |

---

## 3. Komut (nasıl çalıştırılır?)

```powershell
cd backend
$env:USE_SQLITE="1"
.\.venv\Scripts\python.exe manage.py test api.tests.test_faz1_kapanis_e2e -v 2
```

`USE_SQLITE=1` isteğe bağlıdır; kaldırırsanız `.env` içindeki veritabanı ayarı kullanılır — yine de test **ayrı** bir test veritabanı üzerinde koşar, geliştirme verinizi silmez.

---

## 4. Örnek başarılı çıktı (otomatik koşum)

Aşağıdaki çıktı, bu repoda testin **başarıyla** tamamlandığı bir koşuma aittir (süre ortamına göre birkaç saniye değişebilir).

```text
Creating test database for alias 'default' ('file:memorydb_default?mode=memory&cache=shared')...
Found 1 test(s).
Operations to perform:
  Synchronize unmigrated apps: api, drf_spectacular, messages, rest_framework, rest_framework_simplejwt, staticfiles
  Apply all migrations: admin, appointments, auth, business, contenttypes, sessions, users
Synchronizing apps without migrations:
  Creating tables...
    Running deferred SQL...
Running migrations:
  Applying contenttypes.0001_initial... OK
  [... migrasyon satırları ...]
  Applying sessions.0001_initial... OK
test_faz1_kapanis_end_to_end (api.tests.test_faz1_kapanis_e2e.Faz1KapanisE2ETests.test_faz1_kapanis_end_to_end)
Kayıt → token → slotlar → ilk randevu 201 → ikinci 400 → me listesi. ... ok

----------------------------------------------------------------------
Ran 1 test in ~1.4s

OK
Destroying test database for alias 'default' ('file:memorydb_default?mode=memory&cache=shared')...
 OK
System check identified no issues (0 silenced).
```

**Yorum:** `Ran 1 test ... OK` ve `... ok` satırı, Faz 1 kapanış akışının otomatik olarak **geçtiğini** gösterir. Hata olsaydı `FAILED` veya traceback görünürdü.

---

## 5. Bu dokümanın güncellenmesi

Test veya API değişince: `backend/api/tests/test_faz1_kapanis_e2e.py` ile uyumlu tutun; örnek çıktıdaki migrasyon listesi Django sürümüne göre uzun/kısa olabilir — önemli olan son satırlardaki **`OK`** sonucudur.

---

*Son güncelleme: Nisan 2026*
