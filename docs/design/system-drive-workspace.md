# 系統 Google Drive 工作區設計

更新日期：2026-06-19

## 核心結論

RentalHub 的 Web App 登入帳號只用於身份識別、角色與資料權限判斷；檔案儲存帳號與登入帳號無關。

所有大型檔案與媒體檔案必須儲存在系統指定的 Google Drive 工作區，不存進一般使用者自己的 Google Drive，也不以 Firebase Storage 作為正式大型檔案儲存層。

## 使用者體驗規則

一般使用者在 Web App 做任何操作時，不應出現：

- Google Drive 授權畫面
- 選擇 Google 帳號畫面
- 要求允許存取個人 Google Drive 的畫面

使用者只會看到系統內的上傳流程：

```text
選擇檔案 → 上傳中 → 上傳完成 / 失敗提示
```

## 儲存位置

系統使用指定的 Google Drive 帳號或 Shared Drive 作為專案工作區：

```text
taipeimetrohouse/
├── 建案管理/
├── 合約管理/
├── 證據保存/
├── 修繕派工/
├── 租金管理/
└── 帳號附件/
```

建議正式營運使用 Google Workspace Shared Drive；若使用個人 Gmail，則由系統管理員在後端設定一次 OAuth refresh token，之後由後端自動寫入該帳號 Drive。

## 必須存到 Google Drive 的檔案類型

凡是大型檔案、原始檔、影音、掃描文件與附件，一律使用 Google Drive：

- 圖片：jpg、jpeg、png、webp、gif、heic 等
- 影片：mp4、mov、m4v、avi 等
- 音訊：wav、mp3、m4a、aac 等
- 文件：pdf、doc、docx、pages、txt 等
- 試算表：xls、xlsx、csv、numbers、Google Sheets 匯出/附件等
- 簡報：ppt、pptx、key 等
- 其他附件：合約掃描、修繕報價、收據、工單附件等

Firestore 只保存 metadata，不保存檔案本體。

## 架構

```text
Web App 使用者
  ↓ Firebase Auth 登入
前端頁面
  ↓ 帶 Firebase ID token 呼叫後端
Firebase Functions /api/drive/upload
  ↓ 使用系統 Drive 憑證
Google Drive taipeimetrohouse 工作區
  ↓ 回傳 Drive metadata
Firestore 儲存 metadata 與業務資料
```

## 後端 API

目前前端呼叫：

```text
POST /api/drive/upload
```

API 動作：

1. `createSession`
   - 驗證 Firebase ID token。
   - 檢查 `accounts/{uid}` 角色。
   - 使用系統 Google Drive 憑證建立資料夾路徑。
   - 建立 Google Drive resumable upload session。
   - 回傳 `uploadUrl`、`driveFolderId`、`driveWorkspacePath`。

2. 前端直接以 `PUT` 將檔案傳到 Google Drive 的 resumable upload URL。
   - 這個 URL 由後端建立，不需要使用者 Google Drive OAuth。
   - 適合較大型檔案，避免檔案本體經過 Firebase Function 記憶體。

3. `finalize`
   - 優先使用前端從 Google Drive upload response 取得的 `driveFileId` 驗證檔案。
   - 若瀏覽器因 Google Drive resumable upload 回應 / CORS / JSON body 限制無法讀取最終 response，但檔案其實已上傳成功，前端不可直接判定失敗；改呼叫後端 `finalize`，由後端依 `driveFolderId`、`fileName`、`uploadedByUid` 到 Drive 找回剛上傳的檔案。
   - 回傳標準 metadata，前端再將 metadata 寫入 Firestore 或業務文件。

### 上傳成功但前端顯示失敗的處理規則（2026-06-19 實測修正）

已確認情境：Google Drive 已正確建立 `taipeimetrohouse` 資料夾與檔案，但 Web App 顯示上傳失敗。原因通常不是 Drive 寫入失敗，而是瀏覽器無法讀取 Google resumable upload 的最終回應，或回應格式不是前端預期 JSON。

固定處理方式：

1. 前端 `PUT` 到 `session.uploadUrl` 後，若讀取 response 失敗，先記錄 warning，不立即顯示上傳失敗。
2. 前端仍呼叫 `/api/drive/upload` 的 `finalize`，並帶上 `driveFolderId`、`driveWorkspacePath`、`fileName`、`fileType`、`fileSize`。
3. 後端若沒有收到 `driveFileId`，用 `driveFolderId + fileName + uploadedByUid` 查找最近上傳的檔案。
4. 找到檔案後以 Drive `files.get` 取回 `webViewLink`、`webContentLink`、`thumbnailLink` 等 metadata。
5. 只有在 Drive 查找也失敗時，才回報上傳失敗或要求使用者重試。

## 後端憑證設定

正式部署使用 Firebase Secret Manager 注入 `functions/index.js` 的 `defineSecret()`；本機範例值可參考 `functions/.env.example`，但不要提交真實密鑰。

支援兩種模式：

### 模式 A：OAuth refresh token（適合個人 Gmail）

Secret 名稱：

```text
SYSTEM_DRIVE_CLIENT_ID
SYSTEM_DRIVE_CLIENT_SECRET
SYSTEM_DRIVE_REFRESH_TOKEN
SYSTEM_OWNER_EMAIL
DRIVE_WORKSPACE_ROOT=taipeimetrohouse
DRIVE_PUBLIC_READ=false 或 true
```

管理員只在系統設定階段授權一次。一般 Web App 使用者不會看到授權畫面。

目前 RentalHub 正式採用此模式：以管理帳號 OAuth refresh token 寫入管理帳號的 Google Drive。設定或更新 Secret 後必須重新部署 `driveUpload`，讓 Cloud Functions/Cloud Run 新 revision 掛載最新 Secret。

### 模式 B：Service Account（適合 Shared Drive / Workspace）

Secret 名稱：

```text
SYSTEM_DRIVE_CLIENT_EMAIL
SYSTEM_DRIVE_PRIVATE_KEY
SYSTEM_DRIVE_IMPERSONATE_EMAIL（選用，Workspace domain-wide delegation 時使用）
SYSTEM_OWNER_EMAIL
DRIVE_WORKSPACE_ROOT=taipeimetrohouse
DRIVE_PUBLIC_READ=false 或 true
```

若使用 Shared Drive，建議將 service account 加入該 Shared Drive 或使用 Workspace 委派。`SYSTEM_DRIVE_IMPERSONATE_EMAIL` 只有在 Google Workspace Admin Console 已設定 domain-wide delegation 且授權 Drive scopes 時才可填；一般 Gmail 或未設定委派時不可填，否則 Google 會回傳 `GaxiosError: unauthorized_client: Client is unauthorized to retrieve access tokens using this method`。

### Secret 設定注意事項

- 正式值以 Firebase Secret Manager 為準；`.env.example` 只作為填寫範例與交接用，不提交真實金鑰。
- 若同時存在 OAuth refresh token 與 Service Account，程式優先使用 OAuth refresh token，避免一般 Gmail 誤走 service account impersonation。
- 空值或暫停使用的 Secret 可設為 `__unset__`；程式會視為未設定，不會誤觸發錯誤的驗證路徑。
- 更新任何 Secret 後需執行 `firebase deploy --only functions:driveUpload --project taipeimetrohouse-2`，否則已部署 revision 仍可能使用舊版本 Secret。
- 驗證 OAuth 模式時，可先用相同 `client_id/client_secret/refresh_token` 呼叫 Google Drive `about.get`；成功時應能看到管理帳號 email。
- 驗證上傳時以實際 Web App 小檔案測試為準：Google Drive 應建立資料夾與檔案，Web App 也應顯示成功並保存 metadata。

## 權限規則

Drive 只作為儲存層，不負責 App 內權限。App 權限由 Firebase Auth + Firestore 帳號角色控制。

初版允許上傳角色：

- 管理員
- 員工
- 房務
- 工務

租客與訪客的上傳入口需等自助入口權限設計完成後再開放。

## Firestore metadata schema

範例：

```js
{
  provider: 'googleDrive',
  storageOwner: 'systemDrive',
  driveFileId: '...',
  driveFileName: 'A1入住前.jpg',
  driveFolderId: '...',
  driveWorkspacePath: 'taipeimetrohouse/證據保存/屋況',
  fileName: 'A1入住前.jpg',
  fileType: 'image/jpeg',
  fileSize: 2450000,
  webViewLink: 'https://drive.google.com/file/d/.../view',
  webContentLink: '...',
  thumbnailLink: '...',
  uploadedByUid: 'firebase uid',
  uploadedByName: '使用者顯示名稱',
  uploadedByEmail: '使用者登入 email',
  publicRead: false,
  createdAt: serverTimestamp
}
```

## 預覽策略

若 `DRIVE_PUBLIC_READ=true`，後端會將檔案設定為「知道連結者可讀」，圖片/PDF 可直接使用 Drive 連結預覽。

若 `DRIVE_PUBLIC_READ=false`，檔案維持私人，後續需補「後端預覽代理」或「短效簽名讀取 URL」才能在不公開檔案的情況下直接內嵌預覽。正式安全版建議使用私人檔案 + 後端預覽代理。

## 不可回退規則

因產品要求大型檔案堅持儲存在 Google Drive，正式上傳流程不應在 Drive 失敗時自動回退 Firebase Storage。Drive 尚未設定或上傳失敗時，應提示管理員完成系統 Drive 設定或重試。

## 2026-06-19 功能變更總結

本次實測完成並確認正常：

- 系統 Google Drive 工作區由管理帳號建立並持有，Web App 使用者不需也不會進行 Google Drive OAuth。
- Firebase Functions `driveUpload` 已改用 Firebase Secret Manager 讀取 Drive 憑證。
- 驗證失敗教訓：一般 Gmail 不可使用 service account impersonation；若未設定 Workspace domain-wide delegation，填入 `SYSTEM_DRIVE_IMPERSONATE_EMAIL` 會導致 `unauthorized_client`。
- 正式採用 OAuth refresh token 模式寫入管理帳號 Google Drive；Service Account 模式只保留給未來 Shared Drive / Workspace。
- 前端 Google Drive resumable upload 已加入「成功寫入但讀不到最終 response」的 fallback；後端會用資料夾、檔名與上傳者 metadata 找回檔案 ID，避免 Drive 已有檔案但 Web App 誤顯示失敗。
- 驗證標準：必須同時確認 Google Drive 看到正確資料夾/檔案結構，且 Web App 顯示上傳成功。
