<script lang="ts">
	import type { Criterion } from '#lib/constants.ts';
	import { criterionName, formatAverage, scaleLabel, scaleLabels } from '#lib/i18n.ts';
	import type { CriterionSummary } from '#lib/summary.ts';
	import { m } from '#lib/paraglide/messages.js';

	let { criterion, summary }: { criterion: Criterion; summary: CriterionSummary } = $props();

	const max = $derived(Math.max(1, ...summary.distribution));
	const labels = $derived(scaleLabels(criterion));
</script>

<div class="flex flex-col gap-2 rounded border border-slate-200 bg-white p-4">
	<div class="text-sm text-slate-500">{criterionName(criterion)}</div>
	{#if summary.level}
		<div class="flex items-baseline justify-between gap-2">
			<span class="text-lg font-semibold text-brand-800"
				>{scaleLabel(criterion, summary.level)}</span
			>
			<span class="text-xs text-slate-500 tabular-nums">{formatAverage(summary.average)} / 7</span>
		</div>
	{:else}
		<div class="text-lg text-slate-400">–</div>
	{/if}
	<div class="flex h-10 items-end gap-1" aria-hidden="true">
		{#each summary.distribution as count, i (i)}
			<div
				class="flex-1 rounded-sm {count ? 'bg-brand-600' : 'bg-slate-100'}"
				style="height: {count ? Math.max(12, (count / max) * 100) : 8}%"
				title="{labels[i]}: {count}"
			></div>
		{/each}
	</div>
	<div class="flex justify-between text-[11px] text-slate-400">
		<span>{labels[0]}</span>
		<span>{labels[6]}</span>
	</div>
	<span class="sr-only">{m.review_count({ count: summary.n })}</span>
</div>
