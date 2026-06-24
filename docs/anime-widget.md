# 追番小组件维护说明

Firefly 的追番功能入口为导航栏「我的」下的「追番」，页面路径是 `/anime/`。页面使用 `MainGridLayout` 和 `card-base`，交互部分由 Svelte 组件挂载，视觉风格会跟随站点主题色、卡片样式和深浅色模式。

## 开关和入口

在 `src/config/siteConfig.ts` 中控制页面是否启用：

```ts
pages: {
	anime: true,
},
```

导航入口在 `src/config/navBarConfig.ts` 的 `LinkPresets.Anime`，默认已经放在「我的」下拉菜单中：

```ts
Anime: {
	name: "追番",
	url: "/anime/",
	icon: "material-symbols:live-tv",
	pageKey: "anime",
},
```

如果把 `siteConfig.pages.anime` 改成 `false`，页面会跳转 404，带 `pageKey: "anime"` 的导航项也会被隐藏。

## 数据来源

追番页会合并三类数据：

1. `siteConfig.anime.bilibili.uid`：从 Bilibili 追番列表读取数据，适合主要维护来源。
2. `siteConfig.anime.tmdb.apiKey` + `siteConfig.anime.tmdb.listId`：从 TMDB 列表读取数据，可选。
3. `public/anime-list.json`：本地手工维护数据，可作为兜底或补充。

推荐配置：

```ts
anime: {
	bilibili: {
		uid: "你的 Bilibili UID",
	},
	// tmdb: {
	// 	apiKey: "你的 TMDB API Key",
	// 	listId: "你的 TMDB List ID",
	// },
},
```

## 本地 JSON 格式

`public/anime-list.json` 支持 `{ "items": [] }` 格式：

```json
{
	"items": [
		{
			"id": 1,
			"title": "孤独摇滚！",
			"originalTitle": "ぼっち・ざ・ろっく！",
			"poster": "https://example.com/poster.jpg",
			"type": "tv",
			"source": "local",
			"rating": 9.2,
			"date": "2022-10-09",
			"overview": "简介文本",
			"link": "https://example.com/detail",
			"epStatus": "全12话"
		}
	]
}
```

字段说明：

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 卡片标题 |
| `id` | 否 | 唯一 ID；不填会按顺序生成 |
| `originalTitle` | 否 | 原名或别名 |
| `poster` | 否 | 海报 URL |
| `type` | 否 | `tv` 或 `movie`，默认 `tv` |
| `source` | 否 | `local`、`bilibili`、`tmdb` |
| `rating` | 否 | 0-10 分 |
| `date` | 否 | `YYYY-MM-DD` |
| `overview` | 否 | 简介 |
| `link` | 否 | 详情或播放链接 |
| `epStatus` | 否 | 进度，例如 `更新至第6话` |

## 页面代码位置

| 文件 | 用途 |
|---|---|
| `src/pages/anime.astro` | 数据读取、统计卡片、页面壳 |
| `src/components/pages/anime/AnimePostWindow.astro` | 文章正文内嵌追番窗口 |
| `src/components/pages/anime/AnimeGrid.svelte` | 搜索、筛选、排序、分页 |
| `src/components/pages/anime/AnimeCard.svelte` | 海报卡片 |
| `src/components/pages/anime/AnimeDetailModal.svelte` | 详情弹窗 |
| `src/types/anime.ts` | 统一数据类型 |
| `src/i18n/i18nKey.ts`、`src/i18n/languages/*.ts` | 多语言文案 |
| `src/utils/anime-utils.ts` | 追番数据读取和合并逻辑 |

## 在文章中加载窗口

文章必须使用 `.mdx` 后缀，然后导入文章内嵌组件：

```mdx
import AnimePostWindow from "@components/pages/anime/AnimePostWindow.astro";

<AnimePostWindow limit={12} />
```

示例文章已经放在 `src/content/posts/anime-widget.mdx`。进入这篇文章后，可以直接看到追番展示窗口。

## 日常维护流程

1. 修改 `src/config/siteConfig.ts` 里的 UID 或 TMDB 配置。
2. 需要手动补条目时，编辑 `public/anime-list.json`。
3. 本地运行 `pnpm check` 和 `pnpm type-check`。
4. 启动 `pnpm dev`，访问 `http://localhost:4321/anime/` 检查页面。
5. 部署前运行 `pnpm build`。

注意：Bilibili 和 TMDB 都是外部接口，构建或本地开发时可能因为网络、地区或接口限制暂时拉不到数据。本地 JSON 数据不会依赖外部接口，适合放关键条目或做兜底。
