<script lang="ts">
	import { MIN_REVIEWS_FOR_SUMMARY } from '#lib/constants.ts';
	import { courseName, instructorName, kindName, scaleLabel } from '#lib/i18n.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { matchesQuery } from '#lib/text.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type SortKey = 'code' | 'difficulty' | 'workload' | 'teachingValue' | 'reviewCount';

	let query = $state('');
	let yearLevel = $state('');
	let kind = $state('');
	let sortKey = $state<SortKey>('code');
	let sortDesc = $state(false);

	const levels = $derived(
		[...new Set(data.courses.map((c) => c.yearLevel).filter((l): l is number => l !== null))].sort()
	);

	const rows = $derived.by(() => {
		const filtered = data.courses.filter(
			(c) =>
				(!yearLevel || String(c.yearLevel) === yearLevel) &&
				(!kind || c.kind === kind) &&
				matchesQuery(query, c.code, c.nameTr, c.nameEn, ...c.instructors.map((i) => i.name))
		);
		const dir = sortDesc ? -1 : 1;
		return filtered.sort((a, b) => {
			if (sortKey === 'code') return a.code.localeCompare(b.code, 'tr') * dir;
			const hasA = a.reviewCount >= MIN_REVIEWS_FOR_SUMMARY || sortKey === 'reviewCount';
			const hasB = b.reviewCount >= MIN_REVIEWS_FOR_SUMMARY || sortKey === 'reviewCount';
			// Yeterli değerlendirmesi olmayanlar her zaman sonda
			if (hasA !== hasB) return hasA ? -1 : 1;
			const va = (a[sortKey] as number | null) ?? 0;
			const vb = (b[sortKey] as number | null) ?? 0;
			return (va - vb) * dir || a.code.localeCompare(b.code, 'tr');
		});
	});

	function sortBy(key: SortKey) {
		if (sortKey === key) sortDesc = !sortDesc;
		else {
			sortKey = key;
			sortDesc = key === 'reviewCount';
		}
	}

	const columns: { key: SortKey; label: () => string; className?: string }[] = [
		{ key: 'difficulty', label: m.criterion_difficulty },
		{ key: 'workload', label: m.criterion_workload },
		{ key: 'teachingValue', label: m.criterion_teachingValue },
		{ key: 'reviewCount', label: m.col_reviews, className: 'text-right' }
	];
</script>

<svelte:head>
	<title>{m.home_title()} · {m.site_name()}</title>
</svelte:head>

<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold text-brand-900">{m.home_title()}</h1>
		<p class="mt-1 max-w-2xl text-slate-600">{m.home_intro()}</p>
	</div>
	<a href="/ders/oner" class="text-sm">{m.suggest_course_link()}</a>
</div>

<div class="mb-4 flex flex-wrap items-end gap-3 card p-3">
	<div class="min-w-48 flex-1">
		<label class="label" for="filter-q">{m.filter_search()}</label>
		<input
			id="filter-q"
			type="search"
			bind:value={query}
			placeholder={m.filter_search_placeholder()}
			class="w-full"
		/>
	</div>
	<div>
		<label class="label" for="filter-level">{m.filter_year_level()}</label>
		<select id="filter-level" bind:value={yearLevel}>
			<option value="">{m.all()}</option>
			{#each levels as l (l)}
				<option value={String(l)}>{m.year_level({ level: l })}</option>
			{/each}
		</select>
	</div>
	<div>
		<label class="label" for="filter-kind">{m.filter_kind()}</label>
		<select id="filter-kind" bind:value={kind}>
			<option value="">{m.all()}</option>
			<option value="compulsory">{kindName('compulsory')}</option>
			<option value="elective">{kindName('elective')}</option>
		</select>
	</div>
</div>

<div class="overflow-x-auto card">
	<table class="data-table">
		<thead>
			<tr>
				<th>
					<button type="button" onclick={() => sortBy('code')} class="font-semibold">
						{m.col_course()}{sortKey === 'code' ? (sortDesc ? ' ↓' : ' ↑') : ''}
					</button>
				</th>
				<th>{m.col_instructors()}</th>
				{#each columns as col (col.key)}
					<th class={col.className}>
						<button
							type="button"
							onclick={() => sortBy(col.key)}
							class="font-semibold whitespace-nowrap"
						>
							{col.label()}{sortKey === col.key ? (sortDesc ? ' ↓' : ' ↑') : ''}
						</button>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as c (c.id)}
				<tr>
					<td class="min-w-56">
						<a href="/ders/{c.slug}" class="font-medium">
							<span class="text-slate-500 tabular-nums">{c.code}</span>
							{courseName(c)}
						</a>
						{#if c.kind || c.yearLevel}
							<div class="mt-0.5 text-xs text-slate-500">
								{[
									c.yearLevel ? m.year_level({ level: c.yearLevel }) : null,
									c.kind ? kindName(c.kind) : null
								]
									.filter(Boolean)
									.join(' · ')}
							</div>
						{/if}
					</td>
					<td class="min-w-40">
						{#each c.instructors as i (i.id)}
							<div>
								<a href="/ders/{c.slug}?hoca={i.slug}" class="text-slate-700">{instructorName(i)}</a
								>
							</div>
						{:else}
							<span class="text-slate-400">–</span>
						{/each}
					</td>
					{#if c.reviewCount >= MIN_REVIEWS_FOR_SUMMARY}
						<td>{scaleLabel('difficulty', Math.round(c.difficulty!))}</td>
						<td>{scaleLabel('workload', Math.round(c.workload!))}</td>
						<td>{scaleLabel('teachingValue', Math.round(c.teachingValue!))}</td>
					{:else}
						<td colspan="3" class="text-slate-400 italic">
							{c.reviewCount ? m.not_enough_reviews({ count: c.reviewCount }) : m.no_reviews_yet()}
						</td>
					{/if}
					<td class="text-right tabular-nums">{c.reviewCount}</td>
				</tr>
			{:else}
				<tr><td colspan="6" class="py-8 text-center text-slate-500">{m.no_courses_found()}</td></tr>
			{/each}
		</tbody>
	</table>
</div>
