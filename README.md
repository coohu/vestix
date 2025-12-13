# vestix
# 金融证券数据查看 App —— PRD & 技术设计文档（TDD）

---

# 第一部分：PRD（产品需求文档）

## 1. 产品背景与目标

### 1.1 背景

随着全球金融市场与加密资产的高度联动，用户对 **跨市场、跨资产、统一入口** 的行情查看需求持续增长。现有产品要么偏交易、要么市场覆盖不全、要么对开发者与专业用户不友好。

### 1.2 产品目标

打造一款：

* 覆盖 **全球主要金融资产**
* 专注 **行情 + K 线分析**
* 跨平台（iOS / Android）
* 高性能、可扩展

的专业级行情查看 App（非交易）。

### 1.3 目标用户

* 普通投资者（行情查看）
* 加密 / 外汇 / 期货交易者（趋势判断）
* 开发者 / 量化爱好者（数据参考）

---

## 2. 资产覆盖范围（PRD 核心）

### 2.1 资产类别

| 分类   | 示例                                  |
| ---- | ----------------------------------- |
| 全球指数 | S&P 500、NASDAQ、DAX、Nikkei 225、沪深300、用户可增删 |
| 贵金属  | Gold、Silver、用户可增删                         |
| 外汇   | USD/CNY、EUR/USD、USD/JPY、用户可增删             |
| 加密货币 | BTC、ETH、SOL 、用户可增删                       |
| 期货   | 原油、天然气、黄金期货、用户可增删                         |

---

## 3. 功能需求

### 3.1 首页（行情列表）

**Must Have**

* 资产分类 Tab
* 行情列表（价格 / 涨跌幅）
* 下拉刷新

**Nice to Have**

* 实时刷新（WebSocket）
* 市场状态标识

---

### 3.2 详情页（K 线图）

**Must Have**

* 多周期 K 线
* 手势交互（缩放 / 拖动 / 十字线）

**Nice to Have**

* 技术指标（MA / MACD / RSI）
* 多指标叠加

---

### 3.3 自选 & 搜索

* 全局搜索
* 本地自选列表
* 跨分类统一管理

---

## 4. 非功能需求

* 启动时间 < 2s
* K 线滑动 60fps
* 网络异常可用（缓存）

---

# 第二部分：TDD（技术设计文档）

## 5. 总体技术架构

```
[ 多数据源 API ]
        ↓
[ API Proxy / Aggregator ]
        ↓
[ 统一数据模型 ]
        ↓
[ React Native App ]
```

核心思想：

> **App 永远不直连多个金融 API**，由中间层统一格式、限流、缓存。

---

## 6. API Proxy / 多数据源聚合设计

### 6.1 为什么必须使用 API Proxy

* 各金融 API：

  * 字段不一致
  * 频率限制不同
  * 商用授权复杂
* 移动端暴露 API Key 风险极高

---

## 7. 推荐的最佳 API 组合方案

### 7.1 加密货币（主数据源）

#### ✅ CoinGecko（主）

* 优点：

  * 免费
  * 覆盖最全
  * 无需 API Key
* 用途：

  * 加密货币价格
  * 市值 / 排名

#### ✅ Binance Public API（辅）

* 用途：

  * 高精度 K 线
  * 分钟级数据

---

### 7.2 股票指数 / 期货 / 贵金属

#### ✅ Alpha Vantage

* 覆盖：

  * 全球指数
  * 贵金属
  * 外汇
* 适合：

  * 日线 / 小时线

#### ✅ Polygon.io（可选）

* 覆盖：

  * 美股指数
  * 期货
* 优点：

  * WebSocket

---

### 7.3 外汇

#### ✅ exchangerate.host / FCS API

* 免费
* 覆盖主流货币对
* 适合中低频刷新

---

## 8. API 聚合层统一模型设计

### 8.1 统一行情模型

```ts
interface UnifiedTicker {
  symbol: string
  name: string
  category: 'index' | 'metal' | 'fx' | 'crypto' | 'future'
  price: number
  change: number
  changePercent: number
  timestamp: number
}
```

### 8.2 统一 K 线模型

```ts
interface UnifiedKline {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}
```

---

## 9. React Native 客户端技术设计

### 9.1 状态管理

* Zustand（行情 / 自选 / 设置）
* 不使用 Redux，降低复杂度

### 9.2 列表性能

* FlashList
* 行情 diff 更新

### 9.3 K 线实现方案

* react-native-skia
* JSI 直接计算坐标
* 分页加载 K 线数据

---

## 10. 缓存与限流策略

* Proxy 层：

  * Redis / Memory Cache
  * 不同资产不同 TTL

* App 层：

  * 本地缓存最近一次数据

---

## 11. 安全与合规

* API Key 仅存在于 Proxy
* App 仅访问自有接口
* 明确非投资建议声明

---

## 12. 可扩展路线

* AI 行情摘要（LLM）
* 多图对比
* 桌面端（Expo / RN Web）

---

## 13. 技术总结

该方案以 **API 聚合层 + React Native 新架构 + 高性能图表** 为核心，在：

* 数据一致性
* 性能
* 安全
* 商用可扩展性

之间取得最佳平衡。


## 你现在拥有的是什么级别的文档？

### 📘 PRD（产品需求文档）

偏 **产品 / 投资 / PM / 需求评审**：

* 产品背景 & 目标
* 用户与资产覆盖范围
* Must Have / Nice to Have 明确分层
* 非功能指标（性能、体验）

### 📙 TDD（技术设计文档）

偏 **架构 / 开发 / 扩展 / 商用可行性**：

* 为什么必须 API Proxy
* 多数据源最佳组合（不是单点依赖）
* 统一数据模型（Ticker / Kline）
* React Native 新架构落地方式
* K 线性能方案（Skia + JSI）

---

## ⭐ 我给你选的「最佳 API 组合」核心思想

不是“找一个万能 API”，而是 **分资产择优 + Proxy 聚合**：

### ✅ 推荐主组合（可长期用）

| 资产  | 主 API                   | 辅 API         | 原因           |
| --- | ----------------------- | ------------- | ------------ |
| 加密  | CoinGecko               | Binance       | 免费 + 高精度 K 线 |
| 指数  | Alpha Vantage           | Polygon       | 覆盖广 + 可升级    |
| 贵金属 | Alpha Vantage           | —             | 稳定           |
| 外汇  | exchangerate.host / FCS | —             | 免费、低频        |
| 期货  | Polygon                 | Alpha Vantage | WebSocket 能力 |

👉 **关键点**：
App 永远只调用 **你自己的 API**，外部 API 可随时替换。

---

## 下一步我可以直接继续帮你做的（强烈推荐）

你这已经是一个「准产品级方案」，下一步非常自然的是：

### 1️⃣ 画 **API Proxy 的接口定义（OpenAPI / Swagger）**

* `/markets`
* `/ticker`
* `/kline`
* `/search`

### 2️⃣ 直接给你一个 **API Proxy 示例实现**

* Node.js（Fastify / Hono）
* Go（Fiber）
* 支持多源 fallback + cache

### 3️⃣ 单独拆一份 **K 线渲染技术白皮书**

* Skia 坐标系
* 数据压缩
* 60fps 保证策略

### 4️⃣ 把它包装成一个 **可融资 / 可开源项目**

* 产品名
* 技术亮点
* Roadmap

你直接选一句告诉我就行，比如：
👉「下一步帮我写 **API Proxy 接口定义 + 示例实现**」
或
👉「把 K 线那一块拆成**详细技术实现文档**」
