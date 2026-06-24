<script lang="ts">
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import type { StandardizedAnime } from "@/types/anime";

interface Props {
	anime: StandardizedAnime;
	onclick?: (anime: StandardizedAnime) => void;
}

let { anime, onclick }: Props = $props();

function handleLoad(e: Event) {
	const img = e.currentTarget as HTMLImageElement;
	img.style.opacity = "1";
	const ph = img.parentElement?.querySelector(".lqip-placeholder");
	if (ph) ph.classList.add("loaded");
}

function handleClick() {
	onclick?.(anime);
}

function getTypeLabel(type: string): string {
	return type === "movie" ? i18n(I18nKey.animeMovie) : i18n(I18nKey.animeTV);
}

function getSourceLabel(source: StandardizedAnime["source"]): string {
	if (source === "bilibili") return "Bilibili";
	if (source === "tmdb") return "TMDB";
	return "Local";
}

function getSourceColor(source: StandardizedAnime["source"]): string {
	if (source === "bilibili") return "bg-pink-500";
	if (source === "tmdb") return "bg-emerald-500";
	return "bg-neutral-600";
}
</script>

<div
	class="anime-card group relative overflow-hidden rounded-2xl bg-(--card-bg) cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 border border-(--line-divider)"
	onclick={handleClick}
	onkeydown={(e) => e.key === "Enter" && handleClick()}
	role="button"
	tabindex="0"
>
	<!-- 海报区域 -->
	<div class="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
		{#if anime.poster}
			<div class="lqip-placeholder absolute inset-0 pointer-events-none" style="background: var(--muted)" aria-hidden="true"></div>
			<img
				src={anime.poster}
				alt={anime.title}
				class="h-full w-full object-cover transition-all duration-500 group-hover:scale-105 opacity-0"
				loading="lazy"
				decoding="async"
				onload={handleLoad}
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center">
				<svg class="h-12 w-12 text-neutral-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
				</svg>
			</div>
		{/if}

		<!-- 评分角标（右上） -->
		{#if anime.rating > 0}
			<div class="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-lg bg-black/75 backdrop-blur-md px-2 py-1 text-xs font-bold text-white shadow-lg">
				<svg class="h-3.5 w-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
					<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
				</svg>
				<span>{anime.rating.toFixed(1)}</span>
			</div>
		{/if}

		<!-- 类型角标（左上） -->
		<div class="absolute top-2.5 left-2.5 rounded-lg bg-blue-500 px-2.5 py-1 text-xs font-bold text-white shadow-md backdrop-blur-sm">
			{getTypeLabel(anime.type)}
		</div>

		<!-- 来源标签（左下） -->
		<div class="absolute bottom-2.5 left-2.5 rounded-md {getSourceColor(anime.source)} px-2 py-0.5 text-[10px] font-semibold text-white shadow-md">
			{getSourceLabel(anime.source)}
		</div>

		<!-- 悬停遮罩 -->
		<div class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
			<div class="p-4">
				<p class="mb-3 line-clamp-3 text-xs text-white/90 leading-relaxed">{anime.overview || i18n(I18nKey.animeNoOverview)}</p>
				<button class="w-full rounded-xl bg-(--primary) px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-(--primary)/90 hover:shadow-lg active:scale-95">
					{i18n(I18nKey.animeViewDetails)}
				</button>
			</div>
		</div>
	</div>

	<!-- 底部信息 -->
	<div class="p-3.5">
		<!-- 标题 -->
		<h3 class="mb-1.5 line-clamp-1 text-sm font-bold text-neutral-900 dark:text-neutral-100 transition-colors group-hover:text-(--primary)" title={anime.title}>
			{anime.title}
		</h3>
		<!-- 原文标题 -->
		{#if anime.originalTitle && anime.originalTitle !== anime.title}
			<p class="mb-2 line-clamp-1 text-[11px] text-neutral-400 dark:text-neutral-500" title={anime.originalTitle}>
				{anime.originalTitle}
			</p>
		{/if}
		<!-- 底部信息行 -->
		<div class="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
			<span class="font-medium">{anime.epStatus || anime.date?.slice(0, 4) || ""}</span>
		</div>
	</div>
</div>

<style>
	.line-clamp-1 {
		display: -webkit-box;
		line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.line-clamp-3 {
		display: -webkit-box;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
