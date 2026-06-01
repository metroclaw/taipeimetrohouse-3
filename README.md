# RentalHub

> 個人房東的一站式租賃管理系統。主線專案路徑：`/Users/metroclaw/workspace/rental-system`。

## 目前定位

RentalHub 是給個人房東管理多建案、多客房、多房客的內部管理工具，目前採用 Firebase Hosting + 純前端 HTML/JavaScript 版本作為主線。

線上部署：

- https://taipeimetrohouse-2.web.app/

GitHub remote：

- https://github.com/metroclaw/taipeimetrohouse-3.git

Firebase project：

- `taipeimetrohouse-2`

## 已有功能頁面

| 頁面 | 說明 |
|---|---|
| `index.html` | 對外首頁 / 公司形象頁 |
| `login.html` | Google 登入 |
| `dashboard.html` | 主控台 / 總覽 |
| `projects.html` | 建案與客房管理 |
| `tenants.html` | 房客管理 |
| `contracts.html` | 合約管理 |
| `rent.html` | 租金管理 |
| `billing.html` | 水電瓦斯費用計算 |
| `maintenance.html` | 修繕派工 |
| `evidence.html` | 證據 / 圖片保存 |
| `settings.html` | 系統設定 |

## 技術棧

- 前端：HTML + Tailwind CDN + vanilla JavaScript
- Firebase SDK：v9 compat
- Auth：Firebase Authentication / Google Sign-In
- DB：Cloud Firestore
- Storage：Firebase Storage
- Hosting：Firebase Hosting

## 資料結構重點

主要資料放在使用者自己的文件底下：

```text
/users/{uid}
/users/{uid}/projects/{projectId}
/users/{uid}/projects/{projectId}/rooms/{roomId}
/users/{uid}/tenants/{tenantId}
/users/{uid}/contracts/{contractId}
/users/{uid}/rentRecords/{recordId}
/users/{uid}/utilityBills/{billId}
/users/{uid}/maintenanceTasks/{taskId}
/users/{uid}/evidenceFiles/{fileId}
```

Firestore rules 已允許登入使用者讀寫自己 `/users/{uid}` 底下的所有遞迴子文件。

## 本機驗證

本機 shell 的 PATH 可能沒有自動包含 Homebrew Node，建議用：

```bash
PATH=/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin \
for f in public/js/*.js; do node --check "$f" || exit 1; done
```

啟動靜態伺服器：

```bash
cd /Users/metroclaw/workspace/rental-system/public
python3 -m http.server 4173 --bind 127.0.0.1
```

瀏覽：

- http://127.0.0.1:4173/login.html
- http://127.0.0.1:4173/dashboard.html

## 部署

```bash
firebase deploy --only hosting,firestore:rules,storage --project taipeimetrohouse-2
```

GitHub Actions 也會在 push 到 `main` 後部署 Hosting，但 Firestore/Storage rules 是否同步部署請以 workflow 內容為準。

## 目前重要注意事項

1. `login.html` 不載入 `app.js`，登入頁有自己的 Firebase 初始化與 Google 登入流程。
2. 後台頁面共用 `public/js/app.js`，登入導向必須等待 Firebase Auth 初始化，避免登入後被第一個 `null` 狀態誤踢回 login。
3. 這是純前端版，尚未導入 Next.js/Tailwind build pipeline；不要再把已移除的 `taipeimetrohouse-2-ref` 當主線。
4. 修改後至少要跑 JS 語法檢查與本機瀏覽器煙霧測試。
