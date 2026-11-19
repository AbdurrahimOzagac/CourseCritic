<script lang="ts">
	import { enhance } from '$app/forms';
	import { COURSE_CRITERIA, INSTRUCTOR_CRITERIA } from '#lib/constants.ts';
	import {
		criterionName,
		curveName,
		instructorName,
		outcomeName,
		scaleLabel,
		termLabel
	} from '#lib/i18n.ts';
	import { m } from '#lib/paraglide/messages.js';
	import type { ReviewRow } from '#lib/server/queries.ts';

	let {
		review,
		courseSlug,
		loggedIn,
		showInstructor = true
	}: {
		review: ReviewRow;
		courseSlug: string;
		loggedIn: boolean;
		showInstructor?: boolean;
	} = $props();

	let reporting = $state(false);
	let reported = $state(false);

	// Kartın üstünde küçük rozetler: kaç kez alındığı, sonuç, sınıf ortalaması, çan
	const chips = $derived(
		[
			review.attempts ? m.review_attempts({ count: review.attempts }) : null,
			review.outcome ? outcomeName(review.outcome) : null,
			review.classAverage !== null ? `${m.field_class_average()}: ~${review.classAverage}` : null,
			review.curve ? `${m.field_curve()} ${curveName(review.curve)}` : null
		].filter((c): c is string => !!c)
	);

	// Puanlar iki grupta; hiç puanı olmayan grup gösterilmez
	const groups = $derived(
		[
			{ title: m.section_course(), criteria: COURSE_CRITERIA },
			{ title: m.section_instructor(), criteria: INSTRUCTOR_CRITERIA }
		]
			.map((g) => ({ ...g, rated: g.criteria.filter((c) => review[c] !== null) }))
			.filter((g) => g.rated.length)
	);
</script>

<article class="overflow-hidden card">
	<div class="p-5">
		<header class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
				<span
					class="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 ring-inset"
					>{termLabel(review.academicYear, review.term)}</span
				>
				{#if showInstructor}
					<a href="/hoca/{review.instructor.slug}" class="font-medium text-slate-800"
						>{instructorName(review.instructor)}</a
					>
				{/if}
			</div>
			{#if review.edited}<span class="text-xs text-slate-400">{m.review_edited()}</span>{/if}
		</header>

		{#if chips.length}
			<ul class="mt-3 flex flex-wrap gap-1.5">
				{#each chips as chip (chip)}
					<li class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{chip}</li>
				{/each}
			</ul>
		{/if}

		{#if groups.length}
			<div class="mt-5 grid gap-x-10 gap-y-5 md:grid-cols-2">
				{#each groups as g (g.title)}
					<section>
						<h3 class="mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
							{g.title}
						</h3>
						<dl class="flex flex-col gap-3">
							{#each g.rated as c (c)}
								{@const level = review[c] as number}
								<div>
									<div class="flex items-baseline justify-between gap-3 text-sm">
										<dt class="text-slate-500">{criterionName(c)}</dt>
										<dd class="font-medium text-slate-800">{scaleLabel(c, level)}</dd>
									</div>
									<div class="mt-1 flex gap-0.5" aria-hidden="true">
										{#each [1, 2, 3, 4, 5, 6, 7] as n (n)}
											<span
												class="h-1.5 flex-1 rounded-full {n <= level
													? 'bg-brand-600'
													: 'bg-slate-200'}"
											></span>
										{/each}
									</div>
								</div>
							{/each}
						</dl>
					</section>
				{/each}
			</div>
		{/if}

		{#if review.comment}
			<blockquote
				class="mt-5 border-l-4 border-brand-200 pl-4 leading-relaxed whitespace-pre-line text-slate-800"
			>
				{review.comment}
			</blockquote>
		{/if}
	</div>

	<footer
		class="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-2 text-xs"
	>
		{#if review.isMine}
			<a href="/ders/{courseSlug}/degerlendir?id={review.id}">{m.edit()}</a>
			<form
				method="POST"
				action="?/delete"
				use:enhance={({ cancel }) => {
					if (!confirm(m.review_delete_confirm())) cancel();
				}}
			>
				<input type="hidden" name="reviewId" value={review.id} />
				<button class="text-red-700 hover:underline">{m.delete()}</button>
			</form>
		{:else if review.reportedByMe || reported}
			<span class="text-slate-400">{m.report_done()}</span>
		{:else if !loggedIn}
			<a href="/giris?r=/ders/{courseSlug}" class="text-slate-500">{m.report()}</a>
		{:else if reporting}
			<form
				method="POST"
				action="?/report"
				class="flex w-full flex-col gap-2"
				use:enhance={() =>
					async ({ result, update }) => {
						if (result.type === 'success') {
							reported = true;
							reporting = false;
						}
						await update({ reset: false, invalidateAll: false });
					}}
			>
				<input type="hidden" name="reviewId" value={review.id} />
				<label class="text-slate-600" for="reason-{review.id}">{m.report_reason()}</label>
				<textarea id="reason-{review.id}" name="reason" rows="2" maxlength="500" class="w-full"
				></textarea>
				<div class="flex justify-end gap-2">
					<button type="button" class="btn btn-secondary py-1" onclick={() => (reporting = false)}
						>{m.cancel()}</button
					>
					<button class="btn btn-danger py-1">{m.report_submit()}</button>
				</div>
			</form>
		{:else}
			<button
				type="button"
				class="text-slate-500 hover:underline"
				onclick={() => (reporting = true)}>{m.report()}</button
			>
		{/if}
	</footer>
</article>
