# ParentMarry Mock Profile Assets

这组资料用于本地模拟推荐、互选和详情浏览，不是真实用户资料。照片由 AI 生成并裁剪为 900x900 PNG，方便前端直接按 `object-fit: cover` 展示。

## 数据位置

- 完整资料种子：`services/api/app/mock_profiles.py`
- 前端照片资产：`apps/user-app/public/mock-assets/profiles/`
- API 种子入口：`services/api/app/store.py`

## 角色索引

| 姓名 | 性别 | 年龄段 | 城市 | 职业 | 照片 |
| --- | --- | --- | --- | --- | --- |
| 梁辰 | 男 | 36 | 上海 | 城市建筑师 | `liang-chen-portrait.png`, `liang-chen-hobby.png` |
| 顾远 | 男 | 34 | 杭州 | 投研分析师 | `gu-yuan-portrait.png`, `gu-yuan-hobby.png` |
| 许子墨 | 男 | 31 | 深圳 | 运动康复师 | `xu-zimo-portrait.png`, `xu-zimo-hobby.png` |
| 陈屿 | 男 | 35 | 苏州 | 工业设计师 | `chen-yu-portrait.png`, `chen-yu-hobby.png` |
| 林晚 | 女 | 32 | 上海 | 品牌策划 | `lin-wan-portrait.png`, `lin-wan-hobby.png` |
| 唐溪 | 女 | 33 | 杭州 | 儿科医生 | `tang-xi-portrait.png`, `tang-xi-hobby.png` |
| 何晴 | 女 | 30 | 深圳 | 交互设计师 | `he-qing-portrait.png`, `he-qing-hobby.png` |
| 江南 | 女 | 34 | 南京 | 博物馆策展 | `jiang-nan-portrait.png`, `jiang-nan-hobby.png` |

## 资料覆盖维度

每个角色都包含：

- 基础信息：姓名、性别、出生年、城市、学历、职业、当前状态。
- 生活与职业：职业路径、生活方式、兴趣、性格标签、家庭氛围。
- 择偶条件：年龄范围、城市范围、学历偏好、是否接受异地、婚姻节奏。
- 风险边界：dealbreakers、父母视角介绍。
- AI 问答：居住计划、经济情况、家庭边界、相处方式等，用于模拟补充追问和资料页生成。
- 照片：每人 1 张头像/资料照 + 1 张兴趣/生活方式照。

## 使用原则

- 这些图片只用于本地原型、交互检查和视觉节奏观察。
- 后续如加入真人照片，需要重新确认授权、肖像权和隐私合规。
- 如果继续扩充模拟库，建议保持男女比例、城市分布、职业类型和生活风格的多样性。
