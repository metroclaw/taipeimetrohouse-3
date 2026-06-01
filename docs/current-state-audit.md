# RentalHub Current State Audit

更新日期：2026-06-01

## 主線判定

正式主線為：

```text
/Users/metroclaw/workspace/rental-system
```

已移除非主線本機資料夾：

```text
/Users/metroclaw/workspace/taipeimetrohouse-2-ref
```

移除前已確認該資料夾 Git working tree 無未提交變更。

## 目前可用狀態

- Firebase Hosting 純前端版已存在並可開啟。
- 線上網址：<https://taipeimetrohouse-2.web.app/>
- 已有登入頁與後台功能頁。
- 未登入訪問後台頁會導回 login。

## 已實作頁面

- 首頁：`public/index.html`
- 登入：`public/login.html`
- 主控台：`public/dashboard.html`
- 建案/客房：`public/projects.html`
- 房客：`public/tenants.html`
- 合約：`public/contracts.html`
- 租金：`public/rent.html`
- 費用計算：`public/billing.html`
- 修繕：`public/maintenance.html`
- 證據：`public/evidence.html`
- 設定：`public/settings.html`

## 本次修正

### 1. 後台登入守門改為等待 Firebase Auth 初始化

檔案：`public/js/app.js`

修正原因：

- 原本只看 `localStorage` session，若 localStorage 遺失但 Firebase Auth 仍有登入狀態，後台會太早導回 login。
- 已改成 `waitForAuthInit()`，先等 Firebase Auth 初始狀態回報，再決定是否導向 login。

### 2. Firestore rules 支援多層資料結構

檔案：`firestore.rules`

修正原因：

- RentalHub 的客房資料路徑是 `/users/{uid}/projects/{projectId}/rooms/{roomId}`。
- 舊規則只支援一層子集合，可能擋住 rooms 讀寫。
- 已改成 `/users/{uid}/{document=**}` 遞迴允許使用者讀寫自己名下資料。

### 3. 建案出租率改由 rooms 子集合即時計算

檔案：`public/projects.html`

修正原因：

- 建案卡片原本仰賴 `totalRooms` / `occupied` 欄位。
- 若舊資料未寫入統計欄位，出租率會顯示 0。
- 已改為讀取每個建案的 `rooms` 子集合計算總房數、出租數、空置數。

### 4. README 從模板改成真實專案說明

檔案：`README.md`

## 已驗證

- `node --check public/js/*.js` 通過。
- 所有 `public/*.html` 可由 Python HTML parser 解析。
- 本機 `python3 -m http.server` 瀏覽器煙霧測試：
  - `login.html` 可開。
  - 未登入訪問 `projects.html` 會導回 login。
  - Browser console 無 JS error。

## 仍需處理

1. 實際 Google 登入後的完整新增/編輯/刪除流程，需要使用真實帳號在 Firebase Auth 授權網域下測試。
2. Tailwind 目前使用 CDN，瀏覽器會警告不建議 production 使用；短期可接受，長期建議改 build pipeline。
3. 多數頁面仍是 inline JS，長期應逐步抽到獨立 JS 模組。
4. 尚無自動化 E2E 測試。
