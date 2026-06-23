# 🎨 RentalHub Design System

## 色彩

### 主色
- Primary: `#2563EB` (Blue 600) — 信任、專業
- Primary Light: `#3B82F6` (Blue 500)
- Primary Dark: `#1D4ED8` (Blue 700)
- Secondary: `#10B981` (Emerald 500) — 成功、驗證
- Accent: `#F59E0B` (Amber 500) — 警示、重點

### 中性色
- Background: `#F8FAFC` (Slate 50)
- Surface: `#FFFFFF`
- Border: `#E2E8F0` (Slate 200)
- Text Primary: `#0F172A` (Slate 900)
- Text Secondary: `#64748B` (Slate 500)
- Text Muted: `#94A3B8` (Slate 400)

### 功能色
- Success: `#10B981` (Emerald 500)
- Warning: `#F59E0B` (Amber 500)
- Error: `#EF4444` (Red 500)
- Info: `#3B82F6` (Blue 500)

### 驗證標章
- Verified: `#10B981` (Emerald 500) — 已驗證房源
- Unverified: `#94A3B8` (Slate 400) — 未驗證

## 字體

- **標題**：Noto Sans TC / System Fallback
- **內文**：Noto Sans TC / System Fallback
- **代碼**：JetBrains Mono / Menlo

### 字級
| 層級 | 大小 | 行高 | 字重 |
|------|------|------|------|
| H1 | 32px | 1.2 | Bold (700) |
| H2 | 24px | 1.3 | Semibold (600) |
| H3 | 20px | 1.4 | Medium (500) |
| Body | 16px | 1.5 | Regular (400) |
| Small | 14px | 1.5 | Regular (400) |
| Caption | 12px | 1.4 | Regular (400) |

## 間距

基礎單位：4px

| Token | 值 |
|-------||
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |
| 3xl | 64px |

## 圓角

| Token | 值 |
|-------||
| sm | 4px |
| md | 8px |
| lg | 12px |
| xl | 16px |
| full | 9999px |

## 陰影

| Token | 值 |
|-------||
| sm | 0 1px 2px rgba(0,0,0,0.05) |
| md | 0 4px 6px rgba(0,0,0,0.1) |
| lg | 0 10px 15px rgba(0,0,0,0.1) |
| xl | 0 20px 25px rgba(0,0,0,0.15) |

## 元件

### Button
- Primary: Blue 600 bg, white text, 8px 16px padding
- Secondary: White bg, Blue 600 border and text
- Ghost: Transparent, Blue 600 text
- Danger: Red 500 bg, white text

### Input
- Default: Slate 200 border, 8px 12px padding
- Focus: Blue 500 border, ring
- Error: Red 500 border
- Disabled: Slate 100 bg

### Card
- Default: White bg, Slate 200 border, 12px radius
- Hover: Shadow md
- Active: Blue 500 border

### Badge
- Verified: Emerald 500 bg, white text
- Pending: Amber 500 bg, white text
- Rejected: Red 500 bg, white text

## 響應式斷點

| 斷點 | 寬度 |
|------|------|
| Mobile | < 640px |
| Tablet | 640px - 1024px |
| Desktop | > 1024px |

## 建案卡片與客房資訊頁規格（2026-06-16 更新）

### 圖片效能與儲存規格
- 建案外觀照與客房室內圖上傳時需儲存兩種尺寸：
  - `previewUrl` / `exteriorPhotoPreviewUrls`：小尺寸預覽圖，供建案卡片、列表、室內圖滑動列使用，加速畫面更新。
  - `fullUrl` / `exteriorPhotoUrls` / `interiorPhotoUrls`：大尺寸圖片，點擊放大檢視時使用。
- 舊資料若只有單一 URL，畫面需回退使用同一張圖作為預覽與放大圖，避免既有資料失效。
- 卡片與縮圖 `<img>` 使用 `loading="lazy"`、`decoding="async"`，並優先讀取預覽小圖。

### 建案管理卡片
- 卡片寬度較原本三欄設計再縮減約 1/3；桌機優先改為 4 欄，超寬螢幕可顯示 5 欄。
- 圖片框盡量使用 6:9 直式比例，圖片需完整顯示，不裁切重要內容。
- 圖片框支援左右浮水印切換按鈕與頁碼點點；建築物外觀照片一律使用預覽小圖，以加速建案列表更新。
- 地圖圖片不在地址輸入過程中即時刷新；使用者輸入地址時會自動解析並填入國家、城市欄位，輸入完地址後點「取得清晰地圖圖片」，系統才產生固定尺寸地圖預覽。
- 地圖圖片以 Google Static Maps 的 640×960、`scale=2`、`zoom=18` 直式圖產生，縮小顯示範圍並保留道路標籤，讓建案周邊街道名更清晰；成功時上傳到 Firebase Storage 並儲存 `mapImageUrl`，避免建案列表操作時反覆載入 iframe 或持續更新畫面。
- 若尚未設定 Google Maps API key，先保留地址與 Google 地圖連結，畫面顯示待產生地圖狀態。
- 輪播來源順序：
  1. 已儲存的建案地圖圖片 `mapImageUrl`。
  2. 管理員上傳的建築物外觀照片（卡片讀 `exteriorPhotoPreviewUrls`，放大或後續詳情讀 `exteriorPhotoUrls`）。
  3. 若尚未上傳外觀照片，保留 Google 地圖照片/街景預留位與 Google 地圖連結；正式 Google Places 照片需設定 Places API key 後串接。
- 卡片資訊排序：
  1. 地址：細黑體。
  2. 地圖連結：使用超連結藍色。
  3. 建案類型標籤與總客房數量同列。
  4. 「客房資訊」按鈕：進入客房資訊頁。
  5. 「編輯資料」按鈕：回到建案資料編輯 modal。
- 建案卡片不顯示「已租」、「空置」與百分比進度條，避免卡片資訊過重。
- Title 下方提供角色可見的建案篩選區：出租狀態、租金區間、建案類型、國家、城市；城市下拉選項需依目前選取的國家即時縮小範圍，避免不同國家的城市混在一起；變更任一篩選內容後，下方建案預覽卡片即時依條件重繪，不修改資料。
- 建案預覽圖（地圖或外觀照）列表中優先使用低解析預覽圖片以提升切換效率；點擊後才開啟高解析放大檢視，Esc 或點擊背景可關閉。
- 建案管理頁下方不再放客房列表；客房操作集中到 `room-info.html`。

### 編輯建案頁面
- 建築物外觀照片上傳後自動產生預覽小圖與大圖兩份檔案，並裁切為適合建案卡片的 6:9 直式比例。
- 每張建案外觀照片提供兩種來源按鈕：
  - 「選擇檔案 / 管理者上傳」：由管理員上傳本機圖片。
  - 「使用預設 / Google Place」：系統先用地址查 Place 照片；若該地址結果沒有 photos，依序改查附近地標、街景、大樓名／建築關鍵字與建案名稱；全部沒有照片時改用 `public/img/project-placeholder.jpg`（來源：`/Users/metroclaw/Downloads/image-0.jpg`）作為建案預設預覽圖。取得照片後預覽，儲存時裁切成適當大小；若瀏覽器 CORS 無法下載裁切，先保留 Google 照片 URL 顯示，後續可由後端代理補強。
- 編輯既有建案時，若沒有重新選圖或使用預設圖，保留原本圖片 URL；若重新選圖或套用預設圖，替換該張照片的大小圖。
- 預覽框使用小圖、本機 FileReader 或 Google Place 圖片即時預覽；儲存後卡片使用小圖更新。
- 表單最後新增「環境描述」文字欄位，供管理員記錄建案周邊環境、生活機能、出入口、採光、噪音、垃圾集中區、停車等資訊。
- 儲存建案時，若「間數 / 可出租房間數量」大於目前已建立客房數，系統自動補齊對應客房資料欄位；只新增缺少的房間，不因降低數量自動刪除既有客房，避免誤刪資料。

### 客房資訊頁
- `room-info.html` 作為建案客房資訊頁。
- 頁面開啟時預設顯示第一間客房資料；若 URL 指定 `roomId` 則優先顯示指定房號。
- 客房資訊頁必須先用 `getProjects()` / `getRooms(projectId)` 解析建案實際 owner UID，再讀寫 `/users/{ownerUid}/projects/{projectId}/rooms`；管理員跨帳號看得到建案時，不可用目前登入 uid 直接組路徑導致「客房資訊載入失敗」。
- 頁面載入時若客房子集合少於建案 `rentableRooms/totalRooms`，需自動補齊缺少的空客房資料；只新增缺少客房，不因建案房間數降低而刪除既有客房。
- 頁面需顯示建案名稱、建案地址、客房出租狀態篩選（全部／可出租／已出租）與選擇房號下拉選單；選擇房號後，下方內容立即切換到該房間資料。
- 管理員可在同頁修改該房號的每個主要欄位：房號、類型、坪數、租金、樓層、狀態、網路／第四台資訊、其他資訊 / 設備資訊。
- 室內圖最多 6 張，可水平滑動；滑動列讀預覽小圖，點擊單張圖使用大圖放大檢視。
- 室內圖上傳時同樣儲存 `interiorPhotos[{ previewUrl, fullUrl }]`，並同步保留 `interiorPhotoUrls` 供舊頁面相容。
- 客房資料顯示與編輯：坪數、租金、網路／第四台資訊、其他資訊 / 設備資訊。
- 「儲存此房號資料」前提供「套用到其他房」按鈕：將目前房間的類型、坪數、租金、樓層、狀態、設備、網路／第四台、其他資訊與室內圖批次套用到同建案其他房間；各房房號保留。


### 帳號管理權限顯示（2026-06-17 更新）
- 右上角頭像選單文字為「帳號管理」，連到 `accounts.html?selfEdit=1`，進入帳號管理頁後顯示本人帳號資訊並自動開啟本人編輯模式。
- 管理員在 `accounts.html` 可查看所有帳號列表並完整編輯角色、狀態、建案、房號與一般聯絡欄位。
- 管理員重新登入後，主控台與共用資料讀取函式採跨帳號資料視圖：讀取所有已啟用帳號 `/users/{uid}` 底下的建案、房客、合約、租金、費用、修繕、證據與清潔排程，避免資料因仍屬於原建立帳號而顯示空白。
- 非管理員只顯示自己的帳號資訊與自己的列表列；不可切換或編輯他人帳號。
- 非管理員只能修改自己的顯示名稱、電話、發訊模式、Line ID、寄件地址與提醒設定；角色、建案、房號維持唯讀並由管理員調整。
- 帳號資訊卡標題使用「帳號資訊」；「目前登入」提示需使用醒目的綠色膠囊標籤；頭像下方不顯示角色 label。
- 帳號資訊需顯示並可編輯「發訊模式」（電話簡訊 / Line）與「Line ID」。

## Google Drive 工作區與本次 UI 調整（2026-06-18）

### 系統 Drive 工作區原則
- Web App 登入帳號只用於 Firebase Auth 身份與角色權限；檔案儲存帳號固定為系統指定 Google Drive 帳號或 Shared Drive，兩者不直接綁定。
- 一般使用者在新增建案圖片、合約照片、證據檔案或任何附件時，不得出現 Google Drive 選帳號或授權畫面。
- Google Drive 授權只在系統管理/後端設定階段完成一次；前端透過 `/api/drive/upload` 後端代理取得 resumable upload session。
- 大型檔案與附件一律存 Google Drive：jpg、png、mp4、wav、pdf、doc/docx、sheet/xls/xlsx/csv、ppt 等；Firestore 只保存 Drive metadata。
- 正式上傳流程不自動回退 Firebase Storage；Drive 未設定時需提示管理員完成系統 Drive 憑證設定。
- 2026-06-19 實測確認：目前正式採用管理帳號 OAuth refresh token 寫入管理帳號 Google Drive；Service Account impersonation 只適用已設定 Workspace domain-wide delegation 的 Shared Drive / Workspace，否則會出現 `unauthorized_client`。

### Google Drive 檔案工作區
- 系統 Drive 根目錄建立 `taipeimetrohouse` 專案工作區。
- 子資料夾依功能建立：`建案管理`、`合約管理`、`證據保存`；功能內可再依建案、房號、類型分層。
- Firestore 文件只保存 Drive metadata：`storageOwner=systemDrive`、`driveFileId`、`driveFolderId`、`driveWorkspacePath`、`webViewLink`、`webContentLink`、`thumbnailLink`、檔名、大小、MIME type、上傳者 uid/email。
- 詳細架構見 `docs/design/system-drive-workspace.md`。
- 上傳完成判斷以 Drive metadata finalize 為準：若檔案已寫入 Drive 但瀏覽器讀不到 Google resumable upload 的最終 response，前端需呼叫後端 finalize，由後端依資料夾、檔名與上傳者找回檔案 ID，避免 UI 誤顯示上傳失敗。

### 建案管理
- 篩選列「國家」「城市」使用 select，下拉選項從現有建案 `country/city` 或地址解析結果彙整；城市選單會依目前國家篩選，只顯示該國家的城市。
- 建案圖片、地圖截圖與外觀圖透過後端代理存放於 `taipeimetrohouse/建案管理/{建案ID}`；若建案完全沒有可用預覽圖，畫面使用 `public/img/project-placeholder.jpg` 作為預設建案圖。

### 合約管理
- 新增/編輯合約的客房欄位拆為「建案」與「房號」，先選建案再篩出該建案房號。
- 水費、電費、瓦斯費 selector 都包含「依照度數」，每項旁邊有基本計費 NT$ 欄位。
- 新增「網路／第四台費用」與「室內狀況照片」；照片可多選，不限制張數，存於 `taipeimetrohouse/合約管理/{建案}/{房號}/室內狀況照片`。
- 新增合約 PDF 檔案欄位：`signingPdfFile` 保存簽約流程中的暫時 PDF，`signedContractFile` 保存簽約完成後的正式 PDF；上傳正式檔後，列表與主檔 `contractFile` 優先顯示正式檔，等同覆蓋暫時檔案的對外顯示。

### 帳號管理
- 帳號資訊卡採緊密三欄資訊網格，頭像縮小為 64px，減少垂直高度。
- 發訊模式旁提供「測試」按鈕：電話簡訊模式需開啟裝置簡訊 App 並帶入測試文字；Line 模式需開啟 LINE 傳送/分享視窗並記錄測試結果。Firestore 測試紀錄寫入失敗時需回退到目前使用者 `/users/{uid}/messageTests`，不可只顯示「已建立紀錄」而沒有實際發訊動作。
- 所有帳號列表欄位改為：帳號、角色、聯絡電話、最近登入、操作；不顯示狀態欄。

### 設定頁與資料管理
- 設定頁只保留資料管理與關於資訊；移除「使用者資訊」「通知設定」「預設費用設定」卡片，帳號/個人資料統一由右上角選單進入「帳號管理」維護。
- 「清除所有資料」需刪除目前使用者 `/users/{uid}` 底下的業務集合與設定集合；建案刪除前需先清除 `projects/{projectId}/rooms` 子集合，避免只刪建案文件而殘留客房資料。
- 清除完成後需同步清本機快取：app local/session storage、Cache Storage、Firestore persistence 與 Firebase/Firestore 相關 IndexedDB；重新導向時加上 cache-busting query，避免畫面讀到舊快取。

### 證據保存
- 檔案卡片若為圖片直接顯示縮圖；點擊開啟大尺寸預覽 modal。
- 詳情 modal 使用大尺寸容器：圖片 object-contain 放大、PDF 使用 iframe 預覽，其他檔案顯示圖示並提供另開 Drive。
