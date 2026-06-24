<script lang="ts">
import ClientPagination from "@components/common/ClientPagination.svelte";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import type { StandardizedAnime } from "@/types/anime";
import AnimeCard from "./AnimeCard.svelte";
import AnimeDetailModal from "./AnimeDetailModal.svelte";

interface Props {
	items: StandardizedAnime[];
	bilibiliAverageRating?: string;
	itemsPerPage?: number;
}

let { items, bilibiliAverageRating, itemsPerPage = 15 }: Props = $props();

// 状态
let searchQuery = $state("");
let activeFilter = $state<"all" | "tv" | "movie">("all");
let sortBy = $state<"rating-desc" | "rating-asc" | "date-desc" | "date-asc">(
	"rating-desc",
);
let currentPage = $state(1);
let selectedAnime = $state<StandardizedAnime | null>(null);

// 筛选和排序后的数据
let filteredItems = $derived(() => {
	let result = [...items];

	// 搜索过滤
	if (searchQuery.trim()) {
		const query = searchQuery.toLowerCase().trim();
		result = result.filter(
			(item) =>
				item.title.toLowerCase().includes(query) ||
				item.originalTitle.toLowerCase().includes(query),
		);
	}

	// 类型过滤
	if (activeFilter !== "all") {
		result = result.filter((item) => item.type === activeFilter);
	}

	// 排序
	switch (sortBy) {
		case "rating-desc":
			result.sort((a, b) => b.rating - a.rating);
			break;
		case "rating-asc":
			result.sort((a, b) => a.rating - b.rating);
			break;
		case "date-desc":
			result.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
			break;
		case "date-asc":
			result.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
			break;
	}

	return result;
});

// 分页
let totalPages = $derived(Math.ceil(filteredItems().length / itemsPerPage));
let pagedItems = $derived(() => {
	const start = (currentPage - 1) * itemsPerPage;
	return filteredItems().slice(start, start + itemsPerPage);
});

// 筛选/搜索变化时重置到第一页
function resetPage() {
	currentPage = 1;
}

function handleSearch(e: Event) {
	searchQuery = (e.target as HTMLInputElement).value;
	resetPage();
}

function setFilter(filter: "all" | "tv" | "movie") {
	activeFilter = filter;
	resetPage();
}

function setSort(sort: typeof sortBy) {
	sortBy = sort;
	resetPage();
}

function goToPage(page: number) {
	currentPage = page;
}

function openDetail(anime: StandardizedAnime) {
	selectedAnime = anime;
}

function closeDetail() {
	selectedAnime = null;
}

// 过滤计数
let tvCount = $derived(items.filter((i) => i.type === "tv").length);
let movieCount = $derived(items.filter((i) => i.type === "movie").length);

// i18n 带参数
let allLabel = $derived(
	i18n(I18nKey.animeAllWithCount).replace("{count}", String(items.length)),
);
let tvLabel = $derived(
	i18n(I18nKey.animeTVWithCount).replace("{count}", String(tvCount)),
);
let movieLabel = $derived(
	i18n(I18nKey.animeMovieWithCount).replace("{count}", String(movieCount)),
);
</script>

<div class="anime-grid">
	<!-- 工具栏 -->
	<div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<!-- 搜索框 -->
		<div class="relative flex-1 max-w-md">
			<svg class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="text"
				placeholder={i18n(I18nKey.animeSearch)}
				value={searchQuery}
				oninput={handleSearch}
				class="w-full rounded-xl border border-(--line-divider) bg-(--card-bg) py-2.5 pl-10 pr-4 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none transition-all duration-200 focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20 focus:shadow-sm"
			/>
		</div>

		<!-- 筛选和排序 -->
		<div class="flex flex-wrap items-center gap-3">
			<!-- 类型筛选 -->
			<div class="flex items-center gap-2">
				<button
					class="rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 {activeFilter === 'all' ? 'bg-(--primary) text-white shadow-md shadow-(--primary)/30' : 'bg-(--card-bg) text-neutral-600 dark:text-neutral-400 border border-(--line-divider) hover:border-(--primary)/50 hover:text-(--primary)'}"
					onclick={() => setFilter("all")}
				>
					{allLabel}
				</button>
				<button
					class="rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 {activeFilter === 'tv' ? 'bg-(--primary) text-white shadow-md shadow-(--primary)/30' : 'bg-(--card-bg) text-neutral-600 dark:text-neutral-400 border border-(--line-divider) hover:border-(--primary)/50 hover:text-(--primary)'}"
					onclick={() => setFilter("tv")}
				>
					{tvLabel}
				</button>
				<button
					class="rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 {activeFilter === 'movie' ? 'bg-(--primary) text-white shadow-md shadow-(--primary)/30' : 'bg-(--card-bg) text-neutral-600 dark:text-neutral-400 border border-(--line-divider) hover:border-(--primary)/50 hover:text-(--primary)'}"
					onclick={() => setFilter("movie")}
				>
					{movieLabel}
				</button>
			</div>

			<!-- 排序 -->
			<div class="relative">
				<select
					value={sortBy}
					onchange={(e) => setSort((e.target as HTMLSelectElement).value as typeof sortBy)}
					class="appearance-none rounded-xl border border-(--line-divider) bg-(--card-bg) pl-3.5 pr-9 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 outline-none cursor-pointer transition-all duration-200 focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
				>
					<option value="rating-desc">{i18n(I18nKey.animeRatingDesc)}</option>
					<option value="rating-asc">{i18n(I18nKey.animeRatingAsc)}</option>
					<option value="date-desc">{i18n(I18nKey.animeDateDesc)}</option>
					<option value="date-asc">{i18n(I18nKey.animeDateAsc)}</option>
				</select>
				<svg class="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</div>
		</div>
	</div>

	<!-- 卡片网格 -->
	{#if pagedItems().length > 0}
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
			{#each pagedItems() as anime (`${anime.source}-${anime.id}`)}
				<AnimeCard {anime} onclick={openDetail} />
			{/each}
		</div>
	{:else}
		<div class="py-20 text-center">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
				<svg class="h-8 w-8 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
			</div>
			<p class="text-neutral-500 dark:text-neutral-400 font-medium">{i18n(I18nKey.animeNoResults)}</p>
			<p class="text-sm text-neutral-400 dark:text-neutral-500 mt-1">{i18n(I18nKey.animeSearchHint)}</p>
		</div>
	{/if}

	<!-- 分页 -->
	<ClientPagination
		totalItems={filteredItems().length}
		{itemsPerPage}
		{currentPage}
		onPageChange={goToPage}
	/>
</div>

<!-- 详情弹窗 -->
<AnimeDetailModal anime={selectedAnime} onclose={closeDetail} />
