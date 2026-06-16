# 行事曆與 Google Calendar 同步設計

## 目標

將 RentalHub 內所有有日期概念的事項集中到獨立 `calendar.html` 行事曆頁面，並規劃後續同步到 Google Calendar：

- 修繕派工：派工建立日、預定處理日、到期日。
- 清潔排程：清潔日期。
- 租金收款：租金應收日、實收日、逾期提醒。
- 合約管理：合約起訖日、到期提醒。
- 其他未來事項：帳單、費用、水電瓦斯抄表、保養提醒等。

## 頁面調整

### 修繕派工頁 `maintenance.html`

- 移除原本頁面下方的「清潔排程日曆」區塊。
- 修繕派工頁只保留派工單列表、狀態統計與新增/編輯派工單。
- 頁面提供「行事曆」按鈕，導向 `calendar.html`。

### 行事曆頁 `calendar.html`

- 新增獨立功能頁。
- 左側導航新增「行事曆」。
- 月曆顯示不同來源事件：
  - 派工：`maintenanceTasks`
  - 清潔：`cleaningSchedules`
  - 收款：`rentRecords`
  - 合約到期：`contracts`
- 點擊事件可開啟 Google Calendar 建立事件視窗，作為 OAuth/MCP 直接同步完成前的過渡方案。

## Google Calendar 同步設計

### 重要限制

Google API key 只能用於部分公開資料查詢，不能代表使用者寫入私人 Google Calendar。要做到「所有派工、收款、到期日直接同步到行事曆」，正式做法需要以下其一：

1. Google OAuth 2.0 使用者授權，取得 Calendar 寫入權限。
2. 後端或 MCP driver 代管 OAuth 流程，前端只呼叫安全後端 API。

因此 API key 不應硬寫在公開前端檔案內；使用者提供的 key 應放在安全設定或 MCP/後端設定中。

### 同步資料模型建議

每筆可同步事件新增以下欄位：

```js
{
  calendarSyncEnabled: true,
  googleCalendarEventId: '',
  googleCalendarSyncedAt: null,
  calendarSourceCollection: 'maintenanceTasks | cleaningSchedules | rentRecords | contracts',
  calendarSourceId: 'Firestore doc id'
}
```

### 同步策略

- 新增或更新派工、收款、合約、清潔排程時：
  1. 寫入 Firestore。
  2. 呼叫 MCP/後端同步服務。
  3. 成功後回寫 `googleCalendarEventId` 與 `googleCalendarSyncedAt`。
- 刪除資料時：
  1. 若有 `googleCalendarEventId`，先刪除 Google Calendar event。
  2. 再刪 Firestore 資料。
- 若同步失敗：
  - 保留 Firestore 原始資料。
  - 顯示「待同步 / 同步失敗」狀態，供使用者重試。

## 目前實作階段

目前前端已建立 `calendar.html`，可彙整並顯示 Firestore 內的派工、清潔、收款、合約日期事件。直接寫入 Google Calendar 的部分待 OAuth/MCP driver 完成後接上。
