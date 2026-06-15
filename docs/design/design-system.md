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

## 建案卡片與客房資訊頁規格（2026-06-11 更新）

### 建案管理卡片
- 卡片寬度較原本三欄設計再縮減約 1/3；桌機優先改為 4 欄，超寬螢幕可顯示 5 欄。
- 圖片框盡量使用 6:9 直式比例，圖片需完整顯示，不裁切重要內容。
- 圖片框支援左右浮水印切換按鈕與頁碼點點。
- 地圖圖片不在地址輸入過程中即時刷新；使用者輸入完地址後點「取得地圖圖片」，系統才產生固定尺寸地圖預覽。
- 地圖圖片以 Google Static Maps 的 600×900 直式圖產生，成功時上傳到 Firebase Storage 並儲存 `mapImageUrl`，避免建案列表操作時反覆載入 iframe 或持續更新畫面。
- 若尚未設定 Google Maps API key，先保留地址與 Google 地圖連結，畫面顯示待產生地圖狀態。
- 輪播來源順序：
  1. 已儲存的建案地圖圖片 `mapImageUrl`。
  2. 管理員上傳的建築物外觀照片。
  3. 若尚未上傳外觀照片，保留 Google 地圖照片/街景預留位與 Google 地圖連結；正式 Google Places 照片需設定 Places API key 後串接。
- 卡片資訊排序：
  1. 地址：細黑體。
  2. 地圖連結：使用超連結藍色。
  3. 建案類型標籤與總客房數量同列。
  4. 「客房資訊」按鈕：進入客房資訊頁。
  5. 「編輯資料」按鈕：回到建案資料編輯 modal。

### 客房資訊頁
- 新增 `room-info.html` 作為建案客房資訊頁。
- 頁面需顯示建案、地址、房號。
- 室內圖最多 6 張，可水平滑動；點擊單張圖可放大到最大檢視。
- 客房資料顯示：坪數、租金、網路第四台、設備/其他資訊。
- 若從建案卡片進入且未指定房號，顯示該建案所有客房清單；若指定 `roomId`，優先開啟該客房詳情。
