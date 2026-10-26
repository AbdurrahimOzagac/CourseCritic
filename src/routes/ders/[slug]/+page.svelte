<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { COURSE_CRITERIA, INSTRUCTOR_CRITERIA, MIN_REVIEWS_FOR_SUMMARY } from '#lib/constants.ts';
	import ReviewCard from '#lib/components/ReviewCard.svelte';
	import ScaleSummary from '#lib/components/ScaleSummary.svelte';
	import {
		courseDescription,
		courseName,
		curveName,
		instructorName,
		kindName,
		outcomeName,
		termLabel
	} from '#lib/i18n.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { termKey } from '#lib/terms.ts';
	import { OUTCOMES } from '#lib/constants.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const course = $derived(data.course);
	const description = $derived(courseDescription(course));
	const otherName = $derived(getLocale() === 'en' ? course.nameTr : course.nameEn);
	const selected = $derived(data.instructors.find((i) => i.slug === data.selectedInstructor));
	const filtered = $derived(!!data.selectedInstructor || !!data.selectedTerm);

	function applyFilter(hoca: string, donem: string) {
		const params = new URLSearchParams();
		if (hoca) params.set('hoca', hoca);
		if (donem) params.set('donem', donem);
		const qs = params.toString();
		goto(`${page.url.pathname}${qs ? '?' + qs : ''}`, { reset: false });
	}

	const reviewHref = $derived(
		`/ders/${course.slug}/degerlendir${data.selectedInstructor ? `?hoca=${data.selectedInstructor}` : ''}`
	);

	const info = $derived(
		[
			[m.field_credits(), course.credits],
			[m.field_ects(), course.ects],
			[m.filter_year_level(), course.yearLevel ? m.year_level({ level: course.yearLevel }) : null],
			[m.filter_kind(), course.kind ? kindName(course.kind) : null],
			[m.field_prerequisites(), course.prerequisites]
		].filter(([, v]) => v !== null && v !== '') as [string, string | number][]
	);
</script>

<svelte:head>
	<title>{course.code} {courseName(course)} · {m.site_name()}</title>
</svelte:head>

<nav class="mb-4 text-sm text-slate-500"><a href="/">{m.nav_courses()}</a> / {course.code}</nav>

<section class="mb-8 flex flex-wrap items-start justify-between gap-6">
	<div class="max-w-3xl">
		<div class="text-sm font-medium tracking-wide text-slate-500">{course.code}</div>
		<h1 class="text-3xl font-semibold text-brand-900">{courseName(course)}</h1>
		{#if otherName && otherName !== courseName(course)}
			<div class="mt-1 text-slate-500">{otherName}</div>
		{/if}

		{#if info.length}
			<dl class="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
				{#each info as [label, value] (label)}
					<div>
						<dt class="text-slate-500">{label}</dt>
						<dd class="font-medium">{value}</dd>
					</div>
				{/each}
			</dl>
		{/if}

		{#if description}
			<p class="mt-4 whitespace-pre-line text-slate-700">{description}</p>
		{/if}

		{#if data.equivalents.length}
			<div class="mt-4 rounded border border-brand-200 bg-brand-50 px-3 py-2 text-sm">
				{m.equivalent_courses()}:
				{#each data.equivalents as e, idx (e.id)}
					{idx ? ', ' : ''}<a href="/ders/{e.slug}">{e.code} {courseName(e)}</a>
				{/each}
			</div>
		{/if}
		<a href="/ders/{course.slug}/duzenle" class="mt-3 inline-block text-xs text-slate-500"
			>{m.suggest_course_edit()}</a
		>
	</div>

	<a href={reviewHref} class="btn btn-primary">{m.write_review()}</a>
</section>

{#if page.url.searchParams.has('bekliyor')}
	<div class="mb-6 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
		{m.review_saved_pending()}
	</div>
{/if}

<!-- Hocalar -->
<section class="mb-8">
	<h2 class="mb-3 text-lg font-semibold text-brand-900">{m.course_instructors()}</h2>
	<div class="overflow-x-auto card">
		<table class="data-table">
			<thead>
				<tr>
					<th>{m.col_instructor()}</th>
					<th>{m.col_terms()}</th>
					<th class="text-right">{m.col_reviews()}</th>
				</tr>
			</thead>
			<tbody>
				{#each data.instructors as i (i.id)}
					<tr class={i.slug === data.selectedInstructor ? 'bg-brand-50' : ''}>
						<td>
							<button
								type="button"
								class="text-left font-medium text-brand-700 hover:underline"
								onclick={() => applyFilter(i.slug, '')}
							>
								{instructorName(i)}
							</button>
						</td>
						<td>
							<div class="flex flex-wrap gap-1">
								{#each i.terms as t (termKey(t.academicYear, t.term))}
									<button
										type="button"
										class="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600 hover:border-brand-300"
										onclick={() => applyFilter(i.slug, termKey(t.academicYear, t.term))}
									>
										{termLabel(t.academicYear, t.term)}
									</button>
								{:else}
									<span class="text-slate-400">–</span>
								{/each}
							</div>
						</td>
						<td class="text-right tabular-nums">{i.reviewCount}</td>
					</tr>
				{:else}
					<tr><td colspan="3" class="text-slate-500">{m.no_instructors_yet()}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<!-- Filtre + özet -->
<section class="mb-8">
	<div class="mb-4 flex flex-wrap items-end gap-3">
		<h2 class="mr-auto text-lg font-semibold text-brand-900">{m.course_ratings()}</h2>
		<div>
			<label class="label" for="f-hoca">{m.col_instructor()}</label>
			<select
				id="f-hoca"
				value={data.selectedInstructor}
				onchange={(e) => applyFilter(e.currentTarget.value, '')}
			>
				<option value="">{m.all()}</option>
				{#each data.instructors as i (i.id)}
					<option value={i.slug}>{instructorName(i)}</option>
				{/each}
			</select>
		</div>
		<div>
			<label class="label" for="f-donem">{m.col_term()}</label>
			<select
				id="f-donem"
				value={data.selectedTerm}
				onchange={(e) => applyFilter(data.selectedInstructor, e.currentTarget.value)}
			>
				<option value="">{m.all()}</option>
				{#each data.termOptions as t (termKey(t.academicYear, t.term))}
					<option value={termKey(t.academicYear, t.term)}
						>{termLabel(t.academicYear, t.term)}</option
					>
				{/each}
			</select>
		</div>
		{#if filtered}
			<button type="button" class="btn btn-secondary" onclick={() => applyFilter('', '')}
				>{m.clear_filters()}</button
			>
		{/if}
	</div>

	{#if data.summary.n === 0}
		<div class="card p-6 text-center text-slate-500">
			{m.no_reviews_yet()} · <a href={reviewHref}>{m.be_first_reviewer()}</a>
		</div>
	{:else}
		<p class="mb-3 text-sm text-slate-600">
			{m.review_count({ count: data.summary.n })}
			{#if data.summary.n < MIN_REVIEWS_FOR_SUMMARY}
				· <span class="text-amber-700">{m.few_reviews_warning()}</span>
			{/if}
		</p>

		<h3 class="mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">
			{m.section_course()}
		</h3>
		<div class="mb-6 grid gap-3 md:grid-cols-3">
			{#each COURSE_CRITERIA as c (c)}
				<ScaleSummary criterion={c} summary={data.summary.criteria[c]} />
			{/each}
		</div>

		<h3 class="mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">
			{m.section_instructor()}{selected ? `: ${instructorName(selected)}` : ''}
		</h3>
		{#if !selected && data.instructors.length > 1}
			<p class="mb-2 text-xs text-slate-500">{m.instructor_criteria_all_hint()}</p>
		{/if}
		<div class="mb-6 grid gap-3 md:grid-cols-3">
			{#each INSTRUCTOR_CRITERIA as c (c)}
				<ScaleSummary criterion={c} summary={data.summary.criteria[c]} />
			{/each}
		</div>

		{@const s = data.summary}
		{#if s.classAverage.n || s.curve.yes + s.curve.no || OUTCOMES.some((o) => s.outcomes[o])}
			<dl class="mb-6 grid gap-4 card p-4 text-sm sm:grid-cols-3">
				{#if s.classAverage.average !== null}
					<div>
						<dt class="text-slate-500">{m.field_class_average()}</dt>
						<dd class="font-medium">
							~{Math.round(s.classAverage.average)}
							<span class="text-slate-400">({s.classAverage.n})</span>
						</dd>
					</div>
				{/if}
				{#if s.curve.yes + s.curve.no}
					<div>
						<dt class="text-slate-500">{m.field_curve()}</dt>
						<dd class="font-medium">
							{curveName('yes')}: {s.curve.yes} · {curveName('no')}: {s.curve.no}
						</dd>
					</div>
				{/if}
				{#if OUTCOMES.some((o) => s.outcomes[o])}
					<div>
						<dt class="text-slate-500">{m.field_outcome()}</dt>
						<dd class="font-medium">
							{OUTCOMES.filter((o) => s.outcomes[o])
								.map((o) => `${outcomeName(o)}: ${s.outcomes[o]}`)
								.join(' · ')}
						</dd>
					</div>
				{/if}
			</dl>
		{/if}
	{/if}
</section>

<!-- Değerlendirmeler -->
{#if data.reviews.length}
	<section>
		<h2 class="mb-3 text-lg font-semibold text-brand-900">{m.reviews()}</h2>
		<div class="flex flex-col gap-3">
			{#each data.reviews as review (review.id)}
				<ReviewCard {review} courseSlug={course.slug} loggedIn={!!page.data.user} />
			{/each}
		</div>
	</section>
{/if}
