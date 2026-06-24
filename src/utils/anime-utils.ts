import * as fs from "node:fs";
import * as path from "node:path";
import { siteConfig } from "@/config";
import type { StandardizedAnime } from "@/types/anime";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const LOCAL_ANIME_PATH = path.resolve("public/anime-list.json");

interface TmdbItem {
	id: number;
	title?: string;
	name?: string;
	original_title?: string;
	original_name?: string;
	release_date?: string;
	first_air_date?: string;
	media_type?: string;
	poster_path?: string | null;
	vote_average?: number;
	overview?: string;
}

interface BilibiliItem {
	media_id: number;
	title: string;
	cover?: string;
	season_type_name?: string;
	rating?: { score?: number };
	evaluate?: string;
	brief?: string;
	season_id: number;
	new_ep?: { index_show?: string };
}

export interface AnimePageData {
	animeList: StandardizedAnime[];
	totalCount: number;
	tmdbAverageRating: string;
	bilibiliAverageRating: string;
	isConfigured: boolean;
	sourceLabel: string;
}

function readLocalAnimeItems(): Record<string, unknown>[] {
	try {
		if (fs.existsSync(LOCAL_ANIME_PATH)) {
			const localData = JSON.parse(fs.readFileSync(LOCAL_ANIME_PATH, "utf-8"));
			const items = Array.isArray(localData)
				? localData[0]?.items || localData
				: localData.items || [];

			if (Array.isArray(items)) {
				console.log(`[Anime] Loaded ${items.length} items from local JSON.`);
				return items.filter(
					(item): item is Record<string, unknown> =>
						typeof item === "object" && item !== null,
				);
			}
		}
	} catch {
		// 本地 JSON 读取失败，忽略
	}
	return [];
}

function normalizeTmdbItem(anime: TmdbItem): StandardizedAnime {
	const title = anime.title || anime.name || "";
	const originalTitle = anime.original_title || anime.original_name || title;
	const date = anime.release_date || anime.first_air_date || "";
	const type = anime.media_type === "movie" ? "movie" : "tv";

	return {
		id: anime.id,
		title,
		originalTitle,
		poster: anime.poster_path ? TMDB_IMG + anime.poster_path : null,
		type,
		source: "tmdb",
		rating: anime.vote_average || 0,
		date,
		overview: anime.overview || "",
		link: `https://www.themoviedb.org/${type}/${anime.id}`,
		epStatus: undefined,
	};
}

function normalizeBilibiliItem(item: BilibiliItem): StandardizedAnime {
	return {
		id: item.media_id,
		title: item.title,
		originalTitle: item.title,
		poster: item.cover ? item.cover.replace("http://", "https://") : null,
		type:
			item.season_type_name === "剧场版" || item.season_type_name === "电影"
				? "movie"
				: "tv",
		source: "bilibili",
		rating: item.rating?.score || 0,
		date: "",
		overview: item.evaluate || item.brief || "",
		link: `https://www.bilibili.com/bangumi/play/ss${item.season_id}`,
		epStatus: item.new_ep?.index_show || "",
	};
}

function normalizeLocalItem(
	item: Record<string, unknown>,
	index: number,
): StandardizedAnime | null {
	const title = String(item.title || item.name || "").trim();
	if (!title) return null;

	const rawSource = item.source;
	const source =
		rawSource === "bilibili" || rawSource === "tmdb"
			? rawSource
			: item.poster_path || item.vote_average
				? "tmdb"
				: "local";
	const type =
		item.type === "movie" || item.media_type === "movie" ? "movie" : "tv";
	const poster = String(item.poster || item.cover || "").replace(
		"http://",
		"https://",
	);
	const posterPath =
		typeof item.poster_path === "string" ? item.poster_path : "";
	const id = Number(item.id || item.media_id || index + 1);

	return {
		id: Number.isFinite(id) ? id : index + 1,
		title,
		originalTitle: String(
			item.originalTitle || item.original_title || item.original_name || title,
		),
		poster: poster || (posterPath ? TMDB_IMG + posterPath : null),
		type,
		source,
		rating: Number(item.rating || item.vote_average || 0),
		date: String(item.date || item.release_date || item.first_air_date || ""),
		overview: String(item.overview || item.evaluate || item.brief || ""),
		link: String(item.link || ""),
		epStatus:
			typeof item.epStatus === "string"
				? item.epStatus
				: typeof item.new_ep === "object" &&
						item.new_ep !== null &&
						"index_show" in item.new_ep
					? String(item.new_ep.index_show || "")
					: undefined,
	};
}

function dedupeByTitle(items: StandardizedAnime[]): StandardizedAnime[] {
	const seen = new Set<string>();
	return items.filter((item) => {
		const key = item.title.trim().toLowerCase();
		if (!key || seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

async function fetchTmdbItems(): Promise<TmdbItem[]> {
	const tmdbConfig = siteConfig.anime?.tmdb;
	if (!tmdbConfig?.apiKey || !tmdbConfig?.listId) return [];

	try {
		console.log(`[Anime] Fetching TMDB list: ${tmdbConfig.listId}...`);
		const firstResponse = await fetch(
			`https://api.themoviedb.org/3/list/${tmdbConfig.listId}?api_key=${tmdbConfig.apiKey}&language=zh-CN&page=1`,
		);

		if (!firstResponse.ok) {
			console.error(`[Anime] TMDB fetch failed: ${firstResponse.status}`);
			return [];
		}

		const firstData = await firstResponse.json();
		const totalPages = firstData.total_pages || 1;
		const allItems: TmdbItem[] = [...(firstData.items || [])];

		if (totalPages > 1) {
			const promises: Promise<TmdbItem[]>[] = [];
			for (let page = 2; page <= totalPages; page++) {
				promises.push(
					fetch(
						`https://api.themoviedb.org/3/list/${tmdbConfig.listId}?api_key=${tmdbConfig.apiKey}&language=zh-CN&page=${page}`,
					)
						.then((res) => res.json())
						.then((data) => data.items || []),
				);
			}
			const remainingItems = await Promise.all(promises);
			for (const items of remainingItems) allItems.push(...items);
		}

		console.log(`[Anime] Fetched ${allItems.length} items from TMDB.`);
		return allItems;
	} catch (error: unknown) {
		console.error(
			"[Anime] TMDB fetch error:",
			error instanceof Error ? error.message : error,
		);
		return [];
	}
}

async function fetchBilibiliItems(): Promise<BilibiliItem[]> {
	const uid = siteConfig.anime?.bilibili?.uid;
	if (!uid) return [];

	const bilibiliItems: BilibiliItem[] = [];
	try {
		console.log(`[Anime] Fetching Bilibili list for UID: ${uid}...`);
		const ps = 30;
		let pn = 1;
		let hasMore = true;

		while (hasMore) {
			const res = await fetch(
				`https://api.bilibili.com/x/space/bangumi/follow/list?type=1&vmid=${uid}&pn=${pn}&ps=${ps}`,
			);
			const json = await res.json();

			if (
				json.code === 0 &&
				json.data &&
				json.data.list &&
				json.data.list.length > 0
			) {
				bilibiliItems.push(...json.data.list);
				hasMore = json.data.total > bilibiliItems.length;
				if (hasMore) pn++;
			} else {
				hasMore = false;
			}

			if (pn > 20) break;
		}
		console.log(`[Anime] Fetched ${bilibiliItems.length} items from Bilibili.`);
	} catch (error) {
		console.error("[Anime] Bilibili fetch error:", error);
	}
	return bilibiliItems;
}

export async function getAnimePageData(): Promise<AnimePageData> {
	const [tmdbItems, bilibiliItems] = await Promise.all([
		fetchTmdbItems(),
		fetchBilibiliItems(),
	]);
	const localAnimeItems = readLocalAnimeItems();
	const localAnimeList = localAnimeItems
		.map((item, index) => normalizeLocalItem(item, index))
		.filter((item): item is StandardizedAnime => item !== null);

	let animeList: StandardizedAnime[] = dedupeByTitle([
		...tmdbItems.map(normalizeTmdbItem),
		...localAnimeList,
	]);

	if (bilibiliItems.length > 0) {
		const bilibiliMapped = bilibiliItems.map(normalizeBilibiliItem);
		const bilibiliTitles = new Set(bilibiliMapped.map((item) => item.title));
		animeList = animeList.filter((item) => !bilibiliTitles.has(item.title));
		animeList = [...animeList, ...bilibiliMapped];
	}

	const tmdbAverageRating =
		tmdbItems.length > 0
			? (
					tmdbItems.reduce(
						(sum, item) => sum + (Number(item.vote_average) || 0),
						0,
					) / tmdbItems.length
				).toFixed(1)
			: "0.0";

	const bilibiliAverageRating =
		bilibiliItems.length > 0
			? (
					bilibiliItems.reduce(
						(sum, item) => sum + (Number(item.rating?.score) || 0),
						0,
					) / bilibiliItems.length
				).toFixed(1)
			: "0.0";

	const hasLocalData = localAnimeList.length > 0;
	const isConfigured = !!(
		siteConfig.anime?.bilibili?.uid ||
		(siteConfig.anime?.tmdb?.apiKey && siteConfig.anime?.tmdb?.listId) ||
		hasLocalData
	);
	const enabledSources = [
		siteConfig.anime?.bilibili?.uid ? "Bilibili" : "",
		siteConfig.anime?.tmdb?.apiKey && siteConfig.anime?.tmdb?.listId
			? "TMDB"
			: "",
		hasLocalData ? "Local JSON" : "",
	].filter(Boolean);

	return {
		animeList,
		totalCount: animeList.length,
		tmdbAverageRating,
		bilibiliAverageRating,
		isConfigured,
		sourceLabel:
			enabledSources.length > 1
				? enabledSources.join(" + ")
				: enabledSources[0] || "-",
	};
}
