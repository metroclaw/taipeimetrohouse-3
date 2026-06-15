# Google Places 照片串接說明

更新日期：2026-06-11

## 目標

建案管理需要兩種 Google 圖片來源：

1. **Google Static Maps**：依建案地址產生固定尺寸地圖圖片，儲存到 Firebase Storage，作為建案卡片預設圖。
2. **Google Places Photos**：依地址找到地點後，取得 Google 地點照片，作為未上傳建築物外觀照時的備用圖片來源。

## 重要限制

目前 RentalHub 是 Firebase Hosting 純前端靜態站，沒有後端代理。Google Maps/Places API key 放在前端時一定會被瀏覽器看到，所以必須：

- 使用 Google Cloud Console 的 **HTTP referrer restrictions** 限制網域。
- 只允許：
  - `https://taipeimetrohouse-2.web.app/*`
  - `http://127.0.0.1:*/*`（本機測試可選）
- 不要使用無限制 API key。

若未來導入後端或 Cloud Functions，建議把 Places 查詢放到後端，前端只拿結果，安全性更好。

## 一、建立 Google Maps API key

1. 前往 Google Cloud Console：
   <https://console.cloud.google.com/>
2. 建立或選擇專案。
3. 到 **APIs & Services → Library**。
4. 啟用：
   - Maps Static API
   - Places API 或 Places API (New)
5. 到 **APIs & Services → Credentials**。
6. 建立 **API key**。
7. 編輯 API key：
   - Application restrictions：選 **Websites**。
   - Website restrictions 加入：
     - `https://taipeimetrohouse-2.web.app/*`
     - 本機測試需要時加入 `http://127.0.0.1:*/*`
   - API restrictions：限制只允許 Maps Static API、Places API。

## 二、在 RentalHub 前端設定 key

目前純前端版本可在 `public/projects.html` 加入：

```html
<script>
window.GOOGLE_MAPS_STATIC_API_KEY = '你的 API key';
window.GOOGLE_PLACES_API_KEY = '你的 API key';
</script>
```

建議後續改成集中設定檔，例如：

```text
public/js/maps-config.js
```

並且不要提交未限制網域的 key。

## 三、Static Maps 地圖圖片流程

目前實作方向：

1. 使用者輸入地址。
2. 使用者點「取得地圖圖片」。
3. 系統產生 600×900 Static Maps 圖片 URL：

```text
https://maps.googleapis.com/maps/api/staticmap
  ?center=地址
  &zoom=17
  &size=600x900
  &scale=2
  &maptype=roadmap
  &markers=color:red|地址
  &key=API_KEY
```

4. 儲存建案時，系統嘗試把圖片下載成 Blob，再上傳 Firebase Storage：

```text
/users/{uid}/projects/{projectId}/map-{timestamp}.jpg
```

5. Firestore 儲存：

```js
{
  mapUrl: 'Google Maps search link',
  mapStaticUrl: 'Static Maps source URL',
  mapImageUrl: 'Firebase Storage download URL'
}
```

若瀏覽器因 CORS 或 Google 限制無法下載 Blob，系統仍會保留 `mapStaticUrl` 作為顯示來源，並提醒之後可用後端代理處理。

## 四、Places Photos 串接流程

### 方式 A：Places API Text Search / Find Place

1. 用地址查詢 place id：

```http
GET https://maps.googleapis.com/maps/api/place/findplacefromtext/json
  ?input=台北市大安區信義路三段100號
  &inputtype=textquery
  &fields=place_id,name,photos,formatted_address
  &key=API_KEY
```

2. 回傳資料中取：

```js
candidates[0].photos[0].photo_reference
```

3. 取得照片：

```http
GET https://maps.googleapis.com/maps/api/place/photo
  ?maxwidth=900
  &photo_reference=PHOTO_REFERENCE
  &key=API_KEY
```

### 方式 B：Places API New

1. Text Search：

```http
POST https://places.googleapis.com/v1/places:searchText
Content-Type: application/json
X-Goog-Api-Key: API_KEY
X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.photos

{
  "textQuery": "台北市大安區信義路三段100號"
}
```

2. 取照片名稱：

```js
places[0].photos[0].name
```

3. 取得照片媒體：

```http
GET https://places.googleapis.com/v1/PHOTO_NAME/media?maxWidthPx=900&key=API_KEY
```

## 五、建議實作策略

短期純前端：

- 先只做 Static Maps 地圖圖。
- Places 照片先保留為 Google 地圖 / 街景入口，避免前端 API key 暴露太多服務。

中期：

- 加入 `GOOGLE_PLACES_API_KEY`，用 Places API 查前兩張照片。
- 把照片 URL 暫存到建案資料：

```js
{
  googlePlaceId,
  googlePhotoUrls: [url1, url2],
  googlePhotosUpdatedAt
}
```

長期建議：

- 使用 Cloud Functions 或其他後端代理：
  - 前端送地址。
  - 後端呼叫 Google Places。
  - 後端把照片存到 Firebase Storage。
  - 前端只讀 Firebase Storage URL。

這樣可以避免 API key 暴露，也可以穩定處理 CORS、配額、錯誤重試與圖片裁切。
