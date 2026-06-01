# RentalHub Continuation Plan

更新日期：2026-06-01

## 主線策略

只維護：

```text
/Users/metroclaw/workspace/rental-system
```

短期不要再開另一套 Next.js refactor，先把現有 Firebase Hosting 純前端版做到可穩定使用。

## 優先順序

### P0：穩定登入與資料存取

已完成：

- 後台頁等待 Firebase Auth 初始化後再導向。
- Firestore rules 改為允許使用者自己名下遞迴子文件。
- 建案統計由 rooms 子集合計算。

下一步：

- 在線上 Firebase 授權網域實測 Google 登入。
- 實測建案新增、客房新增、房客新增。
- 部署 Firestore rules 到 Firebase。

### P1：補齊核心 CRUD

逐頁檢查：

1. 建案 / 客房管理
2. 房客管理
3. 合約管理
4. 租金管理
5. 費用計算
6. 修繕派工
7. 證據保存

每頁都要確認：

- 載入資料
- 新增
- 編輯
- 刪除
- 空狀態
- 錯誤提示

### P2：資料一致性

需要統一欄位命名：

- room / roomId
- projectName / projectId
- contractEnd / endDate
- status 狀態值
- rent / monthlyRent

### P3：使用者體驗

- 全站一致的 sidebar/topbar。
- 搜尋功能真的可用。
- 表格空狀態與載入中狀態。
- 表單欄位驗證與明確錯誤訊息。

### P4：測試與部署流程

- 建立最小 smoke test script。
- GitHub Actions 部署前至少跑 JS syntax check。
- 部署 Hosting + Firestore rules + Storage rules。

## 驗收標準

RentalHub MVP 可視為完成時，至少要能完成：

1. 使用 Google 登入。
2. 新增一個建案。
3. 在建案下新增多個客房。
4. 新增房客並記錄房號。
5. 建立合約與租金紀錄。
6. 輸入水電瓦斯費用並看到分攤結果。
7. 建立修繕派工。
8. 上傳或記錄證據文件。
9. 登出後不能讀取後台資料。
