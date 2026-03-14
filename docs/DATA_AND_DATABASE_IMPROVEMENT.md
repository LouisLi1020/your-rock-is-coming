# 数据与数据库改进方案

## 一、当前两套数据现状

### 1. 悉尼北区真实数据（后端 SQLite）✅ 完整

| 项目 | 说明 |
|------|------|
| **位置** | `db/courtfinder.db`，通过 `db/index.js` 访问 |
| **表结构** | `courts`（场地）、`bookings`（预订）、`weather_cache`（天气缓存） |
| **种子数据** | `db/seed.js` 中 12 个悉尼北区真实场地：Gordon、Pymble、Killara、St Ives、Lindfield 等 |
| **后端 API** | 已实现且完整：`/api/courts`、`/api/courts/:id`、`/api/courts/:id/availability`、`/api/bookings`（创建/查询/取消/退款）、`/api/weather/:courtId`、`/api/weather/bulk` |

**前端使用处：**

- **Map 页**：`getCourts()` → 列表 + 地图
- **BookingsSlidePanel**：`getBookings(email)`、`getWeatherForCourt(court_id)`，预订与天气均走 API
- **VenueDetail**：当 `venueId` 为**数字**时，用 `getCourtById(venueId)` + `courtToVenue` 显示

### 2. 前端静态 Venues（合并进来的另一套）⚠️

| 项目 | 说明 |
|------|------|
| **位置** | `frontend/src/data/venues.ts` |
| **内容** | 8 个场馆，**混合区域**：Gordon、Sydney Olympic Park、White City、Cooper Park、Bondi、Alexandria、Coogee、North Sydney（不全是北区） |
| **ID 体系** | 字符串 slug，如 `gordon-recreation-ground`、`sydney-olympic-park` |
| **无后端** | 无预订、无真实可用性，仅前端展示 |

**前端使用处：**

- **Discover（Home）**：`useFilteredVenues(venues)`，列表 + 地图全部来自静态数据
- **VenueDetail**：当 `venueId` 为**字符串 slug** 时，用 `getVenueById(venueId)` 显示
- **CalendarBookPage**：下拉框 `venues.map(...)`、`getVenueById(venueId)`，时间槽用 `data/booking.ts` 的 **mock 可用性**（约 70% 随机）
- **QuickBookModal**：静态 venue，同上 mock 逻辑
- **Book 页**：选 venue 来自静态列表

---

## 二、合并导致的问题

1. **Discover 与 Map 数据不一致**  
   - Discover：8 个静态场馆（含 Olympic Park、Bondi 等）  
   - Map：12 个北区 courts（来自 DB）  
   - 用户点 Discover 看到的和点 Map 看到的不是同一批场地。

2. **两套 ID 体系混用**  
   - 静态：`id: 'gordon-recreation-ground'`（字符串）  
   - 后端：`id: 1`（数字）  
   - VenueDetail 用 `venueId` 先查静态再查 API，逻辑分支多、易错。

3. **预订与真实后端脱节**  
   - 真实预订只走 API：需要 `court_id`（数字）、`court_number`、`date`、`start_hour`、`end_hour` 等。  
   - CalendarBookPage / QuickBookModal 使用静态 venue + `data/booking.ts` 的 mock 可用性，调用 `addBooking(venue, selectedDate, selectedSlot, ...)`，与 `BookingContext.addBooking(CreateBookingPayload)` 的接口不一致，**无法正确对应到 backend 的 court 和 availability**。  
   - 只有从 Map 页 → CourtCard → `/book?court=9` 这样的流程才真正在用 API 的 court_id 和 availability。

4. **后端已很完整，但前端未统一用**  
   - 北区真实数据、预订、天气、退款等都在后端；前端仍有大量页面依赖静态数据与 mock，造成“两套数据、一套真一套假”的合并状态。

---

## 三、改进目标

- **单一数据源（悉尼北区）**：以当前 SQLite + 现有 API 为唯一真实数据源。  
- **后端保持完整**：不删减现有 API 与表结构，仅在前端统一使用。  
- **前端统一**：Discover、Map、详情、预订、日历预订都基于同一套 courts（北区），ID 统一为数字 court id。

---

## 四、推荐改进方案（分步）

### 阶段 1：前端统一使用“北区 API”数据（推荐先做）

1. **Discover 页（Home）**  
   - 不再使用 `frontend/src/data/venues.ts` 的静态列表。  
   - 改为：`useCourtsAsVenues()` 或直接 `getCourts()` + `courtToVenue`，与 Map 页一致。  
   - 效果：Discover 与 Map 都显示同一批 12 个北区场地。

2. **统一“场馆列表”来源**  
   - 所有需要“场馆下拉/列表”的页面（CalendarBookPage、QuickBookModal、VenueDetail 的“来自列表”等）改为：  
     - 数据来自 `getCourts()`，再通过 `courtToVenue` 转成前端 Venue 形状。  
   - 可选：在 backend 增加 `GET /api/venues`，返回与 `GET /api/courts` 相同结构（或稍作扩展），前端仍用 `courtToVenue`；若不想改后端，仅前端用 `getCourts()` 即可。

3. **路由与详情页统一用数字 ID**  
   - 详情/预订路由统一为 **数字** court id，例如：  
     - `/venue/:courtId`（courtId 为数字）  
     - 或保留 `/venue/:id`，但约定 `id` 仅数字，不再用 slug。  
   - **VenueDetail**：  
     - 只根据数字 `venueId` 调 `getCourtById(venueId)`，用 `courtToVenue` 得到 Venue 展示；  
     - 不再使用 `getVenueById(venueId)` 的静态数据（或仅作 404 前的一次 fallback，见下）。

4. **预订流程与 API 对齐**  
   - **CalendarBookPage / QuickBookModal / VenueDetail 的“预订”**：  
     - 时间槽与可用性改为调用 **`/api/courts/:id/availability?date=YYYY-MM-DD`**，不再用 `data/booking.ts` 的 mock。  
     - 确认预订时：根据选中的 court（数字 id）、court_number、date、start_hour、end_hour 组装 **CreateBookingPayload**，调用 `addBooking(payload)`（即现有 `BookingContext.addBooking` 的 API 创建接口）。  
   - 这样所有预订都写入 SQLite，与 Map 页、BookingsSlidePanel 一致。

5. **静态 venues 的处理**  
   - **方案 A（推荐）**：不再在 Discover/Calendar/Book 中使用；可保留文件用于本地 demo 或“其他区域即将上线”占位，且明确标注“仅展示、不可预订”或仅用于 UI 原型。  
   - **方案 B**：若将来要支持“北区以外”的场馆，可后续再增加第二数据源（例如另一张表或另一个 API），并明确区分“可预订（北区 API）”与“仅展示（静态或其它 API）”。

### 阶段 2：后端可选的小增强（非必须）

- **GET /api/venues**  
  - 返回与 `GET /api/courts` 相同数据（或增加 opening_hours 等展示字段），便于前端统一“场馆”概念。  
- **保持现有 courts 表**  
  - 北区 12 个场地已足够作为“悉尼北区真实数据”的单一来源；无需再建一张 `venues` 表，除非产品上明确要区分“场地(court)”与“场馆(venue)”多对一关系。

### 阶段 3：数据一致性检查（建议）

- 跑一遍关键流程，确认：  
  - Discover 列表 = Map 列表 = 同一批 courts。  
  - 从 Discover 或 Map 进入详情/预订，都用 court_id，且预订后能在 BookingsSlidePanel 和 `/api/bookings?email=xxx` 中看到。  
  - 取消、退款仅针对 API 返回的 booking，与后端一致。

---

## 五、简要实施清单

| 步骤 | 内容 |
|------|------|
| 1 | Discover（Home）改用 `getCourts()` + `courtToVenue`（或 `useCourtsAsVenues()`），不再用静态 `venues` |
| 2 | CalendarBookPage / Book 页 venue 下拉：数据源改为 API courts（转成 venue 形式） |
| 3 | VenueDetail：路由统一为数字 id；仅用 `getCourtById` + `courtToVenue`，去掉或弱化静态 `getVenueById` |
| 4 | 所有预订流程：时间槽来自 `/api/courts/:id/availability`，确认时组 CreateBookingPayload 调 `addBooking` |
| 5 | QuickBookModal：仅对“来自 API 的 court/venue”开放，或移除对静态 venue 的预订 |
| 6 | （可选）删除或仅保留静态 `venues.ts` 为占位，并加注释说明用途 |

---

## 六、总结

- **数据库（悉尼北区）**：当前 SQLite + 后端 API 已经是一套完整、可用的真实数据源，无需大改。  
- **问题主要在“合并状态”**：前端同时用了这套 API 和一套静态 venues，导致两套数据、两套 ID、预订逻辑不一致。  
- **改进核心**：以“北区 API”为唯一真实数据源，前端统一用 courts API + courtToVenue，统一 ID 为数字，预订全部走现有 API；静态 venues 仅作占位或移除，即可得到清晰、可维护的单一数据流。

按上述阶段 1 实施后，整个项目在数据上会呈现“一个数据库（悉尼北区）+ 一个完整后端 + 前端统一使用”的状态，便于后续扩展其他区域或数据源。
