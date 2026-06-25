<script lang="ts">
import { onMount } from "svelte";
import ClientPagination from "@/components/common/ClientPagination.svelte";

interface Example {
	jp: string;
	cn: string;
}

interface GrammarItem {
	title: string;
	emoji: string;
	level: string;
	levelColor: string;
	structure: string;
	meaning: string;
	examples: Example[];
	tips?: string;
}

interface GrammarCategory {
	category: string;
	remark: string;
	items: GrammarItem[];
}

interface Props {
	categories: GrammarCategory[];
	itemsPerPage?: number;
}

const { categories, itemsPerPage = 3 }: Props = $props();

let activeCategory = $state<string | null>(null);
let currentPage = $state(1);

onMount(() => {
	const hash = window.location.hash;
	if (hash.startsWith("#cat=")) {
		const catName = decodeURIComponent(hash.slice(5));
		const found = categories.find((c) => c.category === catName);
		if (found) {
			activeCategory = found.category;
			const pageMatch = hash.match(/&page=(\d+)/);
			if (pageMatch) {
				const page = Number.parseInt(pageMatch[1], 10);
				if (page >= 1 && page <= Math.ceil(found.items.length / itemsPerPage)) {
					currentPage = page;
				}
			}
		}
	}
});

const activeCategoryData = $derived(
	activeCategory ? categories.find((c) => c.category === activeCategory) : null,
);

const totalPages = $derived(
	activeCategoryData
		? Math.ceil(activeCategoryData.items.length / itemsPerPage)
		: 0,
);

const paginatedItems = $derived(
	activeCategoryData
		? activeCategoryData.items.slice(
				(currentPage - 1) * itemsPerPage,
				currentPage * itemsPerPage,
			)
		: [],
);

const totalItems = $derived(
	categories.reduce((sum, c) => sum + c.items.length, 0),
);

function getCategoryLevels(
	cat: GrammarCategory,
): { level: string; color: string; count: number }[] {
	const map = new Map<string, { color: string; count: number }>();
	for (const item of cat.items) {
		const existing = map.get(item.level);
		if (existing) {
			existing.count++;
		} else {
			map.set(item.level, { color: item.levelColor, count: 1 });
		}
	}
	return Array.from(map.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([level, { color, count }]) => ({ level, color, count }));
}

const DAY_GRADIENTS = [
	"from-emerald-500/20 to-teal-500/10",
	"from-blue-500/20 to-indigo-500/10",
	"from-amber-500/20 to-orange-500/10",
	"from-rose-500/20 to-pink-500/10",
	"from-violet-500/20 to-purple-500/10",
	"from-cyan-500/20 to-sky-500/10",
	"from-lime-500/20 to-green-500/10",
	"from-fuchsia-500/20 to-pink-500/10",
];

function getGradient(index: number): string {
	return DAY_GRADIENTS[index % DAY_GRADIENTS.length];
}

function enterCategory(cat: string) {
	activeCategory = cat;
	currentPage = 1;
	window.location.hash = `#cat=${encodeURIComponent(cat)}`;
	window.scrollTo({ top: 0, behavior: "smooth" });
}

function backToDirectory() {
	activeCategory = null;
	currentPage = 1;
	window.location.hash = "";
	window.scrollTo({ top: 0, behavior: "smooth" });
}

function handlePageChange(page: number) {
	currentPage = page;
	const cat = activeCategory
		? `#cat=${encodeURIComponent(activeCategory)}`
		: "";
	window.location.hash = `${cat}&page=${page}`;
	window.scrollTo({ top: 0, behavior: "smooth" });
}
</script>

<div class="knowledge-base">
	<div class="knowledge-header mb-6">
		<div class="flex items-center gap-3 mb-2">
			<span class="text-3xl">📚</span>
			<h2 class="text-2xl font-bold text-black/85 dark:text-white/85">
				日本語文法
			</h2>
		</div>
		<p class="text-sm text-black/50 dark:text-white/50">
			系统整理日语语法知识，从入门到精通
		</p>
	</div>

	{#if !activeCategory}
		<!-- 目录视图 -->
		<div class="flex items-center gap-4 mb-6 text-sm text-black/50 dark:text-white/50">
			<span class="flex items-center gap-1.5">
				<span class="w-2 h-2 rounded-full bg-(--primary)"></span>
				{categories.length} 个分类
			</span>
			<span class="flex items-center gap-1.5">
				<span class="w-2 h-2 rounded-full bg-(--primary)/60"></span>
				{totalItems} 条语法
			</span>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			{#each categories as cat, index (cat.category)}
				{@const levels = getCategoryLevels(cat)}
				{@const gradient = getGradient(index)}
				<button
					type="button"
					class="card-base group w-full text-left rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-(--primary)/30 onload-animation"
					style="animation-delay: {index * 60}ms"
					onclick={() => enterCategory(cat.category)}
				>
					<!-- 顶部渐变条 -->
					<div class="h-1.5 w-full bg-gradient-to-r {gradient}"></div>

					<div class="p-5 flex items-start gap-4">
						<!-- 左侧日期徽章 -->
						<div class="flex-shrink-0 flex flex-col items-center">
							<div class="w-11 h-11 rounded-xl bg-gradient-to-br {gradient} flex items-center justify-center border border-black/5 dark:border-white/10 group-hover:scale-110 transition-transform duration-300">
								<span class="text-xs font-bold text-black/70 dark:text-white/70 leading-none">
									{cat.category}
								</span>
							</div>
						</div>

						<!-- 内容区 -->
						<div class="flex-1 min-w-0">
							<h3 class="font-bold text-black/85 dark:text-white/85 group-hover:text-(--primary) transition-colors">
								{cat.category}
							</h3>
							{#if cat.remark}
								<p class="text-xs text-black/45 dark:text-white/45 mt-1 truncate">
									{cat.remark}
								</p>
							{/if}

							<!-- 等级分布 -->
							<div class="flex items-center gap-1.5 mt-3 flex-wrap">
								{#each levels as lv}
									<span
										class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
										style="background: {lv.color}18; color: {lv.color}"
									>
										{lv.level}
										<span class="opacity-70">×{lv.count}</span>
									</span>
								{/each}
							</div>
						</div>

						<!-- 右侧数量 -->
						<div class="flex-shrink-0 flex flex-col items-end gap-1">
							<span class="text-2xl font-bold text-black/15 dark:text-white/15 group-hover:text-(--primary)/30 transition-colors leading-none">
								{cat.items.length}
							</span>
							<span class="text-[10px] text-black/30 dark:text-white/30">条</span>
						</div>
					</div>
				</button>
			{/each}
		</div>
	{:else}
		<!-- 内容视图 -->
		{@const activeIndex = categories.findIndex((c) => c.category === activeCategory)}
		{@const gradient = getGradient(activeIndex >= 0 ? activeIndex : 0)}

		<div class="mb-4">
			<button
				type="button"
				class="inline-flex items-center gap-2 text-sm text-(--primary) hover:underline font-medium"
				onclick={backToDirectory}
			>
				<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M15 18l-6-6 6-6" />
				</svg>
				返回目录
			</button>
		</div>

		<!-- 当前分类标题卡 -->
		<div class="card-base rounded-xl overflow-hidden mb-6 onload-animation">
			<div class="h-1.5 w-full bg-gradient-to-r {gradient}"></div>
			<div class="p-5 flex items-center gap-4">
				<div class="w-12 h-12 rounded-xl bg-gradient-to-br {gradient} flex items-center justify-center border border-black/5 dark:border-white/10 flex-shrink-0">
					<span class="text-sm font-bold text-black/70 dark:text-white/70 leading-none">
						{activeCategory}
					</span>
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="text-lg font-bold text-black/85 dark:text-white/85">
						{activeCategory}
					</h3>
					{#if activeCategoryData?.remark}
						<p class="text-sm text-black/45 dark:text-white/45 mt-0.5">
							{activeCategoryData.remark}
						</p>
					{/if}
				</div>
				<div class="flex-shrink-0 text-right">
					<span class="text-2xl font-bold text-black/15 dark:text-white/15 leading-none">
						{activeCategoryData?.items.length ?? 0}
					</span>
					<span class="block text-[10px] text-black/30 dark:text-white/30 mt-0.5">条语法</span>
				</div>
			</div>
		</div>

		<div class="space-y-4 mb-8">
			{#each paginatedItems as item, index (item.title)}
				<article
					class="grammar-card card-base rounded-xl p-5 onload-animation"
					style="animation-delay: {index * 80}ms"
				>
					<header class="flex items-start gap-3 mb-4">
						<span class="text-2xl flex-shrink-0">{item.emoji}</span>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<h3 class="text-lg font-bold text-black/85 dark:text-white/85">
									{item.title}
								</h3>
								<span
									class="px-2 py-0.5 rounded-full text-xs font-medium text-white"
									style="background: {item.levelColor}"
								>
									{item.level}
								</span>
							</div>
							<p class="text-sm text-black/60 dark:text-white/60 mt-1 font-mono">
								{item.structure}
							</p>
							<p class="text-sm text-black/50 dark:text-white/50">
								{item.meaning}
							</p>
						</div>
					</header>

					<div class="ml-10 space-y-2">
						{#each item.examples as example}
							<div class="flex gap-2 text-sm">
								<span class="text-black/75 dark:text-white/75 font-medium">{example.jp}</span>
								<span class="text-black/40 dark:text-white/40">→</span>
								<span class="text-black/60 dark:text-white/60">{example.cn}</span>
							</div>
						{/each}

						{#if item.tips}
							<div class="mt-3 px-3 py-2 rounded-lg bg-(--btn-regular-bg) text-xs text-black/60 dark:text-white/60">
								💡 {item.tips}
							</div>
						{/if}
					</div>
				</article>
			{/each}
		</div>

		{#if totalPages > 1}
			<ClientPagination
				totalItems={activeCategoryData?.items.length ?? 0}
				{itemsPerPage}
				{currentPage}
				onPageChange={handlePageChange}
			/>
		{/if}
	{/if}
</div>
