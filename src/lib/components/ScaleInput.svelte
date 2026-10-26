<script lang="ts">
	import type { Criterion } from '#lib/constants.ts';
	import { criterionHint, criterionName, scaleLabels } from '#lib/i18n.ts';

	let {
		criterion,
		value = $bindable(),
		error
	}: { criterion: Criterion; value: number | null; error?: string } = $props();

	const labels = $derived(scaleLabels(criterion));
</script>

<fieldset class="flex flex-col gap-2">
	<legend class="mb-1">
		<span class="font-medium text-slate-800">{criterionName(criterion)}</span>
		<span class="ml-2 text-sm text-slate-500">{criterionHint(criterion)}</span>
	</legend>
	<div class="grid grid-cols-7 overflow-hidden rounded border border-slate-300">
		{#each labels as label, i (i)}
			<label
				class="flex cursor-pointer flex-col items-center justify-center gap-1 border-l border-slate-200 px-1 py-2 text-center text-[11px] leading-tight first:border-l-0 sm:text-xs
				{value === i + 1 ? 'bg-brand-700 text-white' : 'bg-white text-slate-700 hover:bg-brand-50'}"
			>
				<input
					type="radio"
					class="sr-only"
					name={criterion}
					value={i + 1}
					bind:group={value}
					required
				/>
				<span class="font-semibold">{i + 1}</span>
				<span class="hidden sm:block">{label}</span>
			</label>
		{/each}
	</div>
	<div class="min-h-5 text-sm text-brand-700 sm:hidden">{value ? labels[value - 1] : ''}</div>
	{#if error}<p class="text-sm text-red-700">{error}</p>{/if}
</fieldset>
