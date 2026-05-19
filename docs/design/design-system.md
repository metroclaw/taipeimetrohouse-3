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
