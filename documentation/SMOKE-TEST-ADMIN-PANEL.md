# İşletme paneli — smoke test (2-FE-10)

Manuel doğrulama listesi; otomasyon için bkz. `frontend-web/apps/admin/e2e/` (Playwright).

## Önkoşullar

- Backend: `http://127.0.0.1:8000` (ör. `python manage.py runserver`)
- Admin web: `http://localhost:8080` (`frontend-web/apps/admin`, `npm run dev`)
- `.env` içinde `VITE_SERVER_URL=http://127.0.0.1:8000/api/v1` (veya eşdeğeri)
- Test kullanıcısı: `role: business_admin`, en az bir **işletmeye** bağlı (sahip veya personel); aksi halde “Bağlı işletme yok” ekranı beklenir

## Hızlı rota kontrolü (giriş yapılmış)

| # | Rota | Beklenen |
|---|------|----------|
| 1 | `/dashboard` | Özet veya yönlendirme; hata sayfası değil |
| 2 | `/dashboard/services` | Hizmet listesi veya boş içerik |
| 3 | `/dashboard/staff` | Personel listesi |
| 4 | `/dashboard/schedule` | Ajanda, tarih seçici |
| 5 | `/dashboard/appointments/manual` | Manuel randevu formu |
| 6 | `/dashboard/appointments` | `/dashboard/schedule` adresine yönlendirme (eski yer imleri) |

## İşlev (B.4–B.8 özet)

- **Hizmetler (B.4):** Yeni hizmet oluştur → listede görünür → düzenle → kaydet.
- **Personel (B.5):** Yeni personel → düzenle → hizmet ataması kaydedilir.
- **Ajanda (B.6):** Hafta/gün değiştir, tabloda randevu satırı varsa satıra tıkla.
- **Manuel randevu (B.7):** Personel + hizmet + tarih/slot + müşteri kullanıcı PK → oluştur → ajandada görünür.
- **Randevu detay (B.8):** Ajanda satırından detay → durum veya iç not güncelle → kaydet.

## Kayıt (B.9, isteğe bağlı)

- `/auth/jwt/business-sign-up` — form gönderimi; ardından giriş (token) beklenir. İşletme kaydı ayrı olduğundan panel boş kalabilir.

## Otomasyon

```powershell
cd frontend-web/apps/admin
npx playwright install chromium
npm run test:e2e
```

Playwright, `8080` için `npm run dev` başlatır; zaten `npm run dev` çalışıyorsa mevcut süreç kullanılır (`reuseExistingServer`). **Yerelde `CI=1` ile test çalıştırmayın** — boş port beklenir; açık sunucu varsa çakışır.

GitHub Actions vb. için `CI` genelde zaten ayarlıdır; ön yüz o ortamda otomatik kalkar.
