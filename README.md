# Vitamin Saati: Yasemin Hanım için

Kedili, yaseminli küçük bir iPhone uygulaması (PWA). Her akşam 22:00'de bildirim gelir. Vitamin içilmediyse 22:30'da bir kez daha hatırlatır. İçildiyse bildirim gelmez.

Toplam kurulum yaklaşık 15 dakika sürer ve hepsi ücretsizdir.

---

## 1. GitHub'a yükle
1. GitHub'da yeni bir **private** repo aç, örneğin `yasemin-vitamin`.
2. Bu klasörün içindekileri repoya yükle. `node_modules` klasörünü yükleme. Kısa yol olarak GitHub sitesinde "uploading an existing file" diyip sürükleyip bırakabilirsin.

## 2. Vercel'e bağla
1. vercel.com → **Add New → Project** → bu repoyu seç → **Deploy**. Framework olarak "Other" kalsın, başka ayar gerekmez.
2. Proje açılınca **Storage** sekmesi → **Upstash for Redis** (Marketplace) → ücretsiz planla oluştur → bu projeye bağla. Gerekli anahtarlar otomatik eklenir.

## 3. Bildirim anahtarlarını oluştur
Bilgisayarında terminalde şunu çalıştır:
```
npx web-push generate-vapid-keys
```
Çıkan iki anahtarı Vercel → proje → **Settings → Environment Variables**'a ekle:

| Ad | Değer |
|---|---|
| `VAPID_PUBLIC_KEY` | Public Key |
| `VAPID_PRIVATE_KEY` | Private Key |
| `VAPID_SUBJECT` | `mailto:senin@mailin.com` |
| `CRON_SECRET` | Uzun, rastgele bir kelime (ör. `kedi-yasemin-8x2k9q`) |

Ekledikten sonra **Deployments → en üstteki → Redeploy** yap.

## 4. Saatli tetikleyiciyi kur (cron-job.org)
Vercel'in ücretsiz planındaki zamanlayıcı saat konusunda ±1 saat kayabiliyor. Bu yüzden dakikası dakikasına çalışan ücretsiz **cron-job.org** kullanıyoruz.

1. cron-job.org'a üye ol → **Create cronjob**.
2. **1. iş:** URL `https://PROJE-ADIN.vercel.app/api/cron?key=CRON_SECRET_DEGERI`, zamanlama her gün **22:00**, saat dilimi **Europe/Istanbul**.
3. **2. iş:** aynı URL'nin sonuna `&type=late` ekle, her gün **22:30**.

Denemek için tarayıcıda 1. işin URL'sini aç. `{"ok":true,...}` görmen lazım.

## 5. Yasemin Hanım'ın telefonunda
1. `https://PROJE-ADIN.vercel.app` adresini **Safari**'de aç.
2. **Paylaş → Ana Ekrana Ekle**.
3. Ana ekrandaki kedili **Vitamin** ikonundan aç → **Bildirimleri aç** → İzin ver.

Bitti. Test etmek için 4. adımdaki URL'yi tarayıcıda açarsan telefona hemen bildirim düşer. O akşam "içtim" işaretlenmişse bildirim atlanır.

---

### Notlar
- iOS 16.4 ve üstü gerekir. Bildirimler yalnızca ana ekrana eklenmiş uygulamada çalışır, Safari sekmesinde çalışmaz.
- Seri ve işaretlemeler telefonda tutulur. Sunucu sadece bildirim kaydını ve "bu akşam içildi mi" bilgisini (3 gün) saklar.
- Saat, mesajlar veya isim değiştirmek için: saat `public/index.html` içindeki `HOUR` değerinde ve cron-job.org'da, bildirim mesajları `api/cron.js` içinde.

### Dosyalar
```
public/index.html          uygulama (tasarım + mantık)
public/sw.js               bildirimi gösteren servis çalışanı
public/manifest.webmanifest, ikonlar
api/config.js              bildirim için açık anahtar
api/subscribe.js           telefonun bildirim kaydı
api/taken.js               "bu akşam içildi" bilgisi
api/cron.js                22:00 / 22:30 bildirimi
lib/redis.js               Upstash bağlantısı
```
