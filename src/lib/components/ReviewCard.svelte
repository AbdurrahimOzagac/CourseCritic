<script lang="ts">
	import { enhance } from '$app/forms';
	import { CRITERIA } from '#lib/constants.ts';
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

	const meta = $derived(
		[
			review.attempts ? m.review_attempts({ count: review.attempts }) : null,
			review.outcome ? outcomeName(review.outcome) : null
		]
			.filter(Boolean)
			.join(', ')
	);
</script>

<article class="card p-4">
	<header
		class="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2"
	>
		<div class="text-sm">
			<span class="font-semibold text-slate-800">{m.anonymous_student()}</span>
			<span class="text-slate-400"> · </span>
			<span class="text-slate-700">{termLabel(review.academicYear, review.term)}</span>
			{#if showInstructor}
				<span class="text-slate-400"> · </span>
				<a href="/hoca/{review.instructor.slug}" class="text-slate-700"
					>{instructorName(review.instructor)}</a
				>
			{/if}
			{#if meta}<span class="text-slate-400"> · </span><span class="text-slate-600">{meta}</span
				>{/if}
		</div>
		{#if review.edited}<span class="text-xs text-slate-400">{m.review_edited()}</span>{/if}
	</header>

	<dl class="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
		{#each CRITERIA as c (c)}
			<div class="flex justify-between gap-2">
				<dt class="text-slate-500">{criterionName(c)}</dt>
				<dd class="font-medium text-slate-800">{scaleLabel(c, review[c])}</dd>
			</div>
		{/each}
		{#if review.classAverage !== null}
			<div class="flex justify-between gap-2">
				<dt class="text-slate-500">{m.field_class_average()}</dt>
				<dd class="font-medium text-slate-800">~{review.classAverage}</dd>
			</div>
		{/if}
		{#if review.curve}
			<div class="flex justify-between gap-2">
				<dt class="text-slate-500">{m.field_curve()}</dt>
				<dd class="font-medium text-slate-800">{curveName(review.curve)}</dd>
			</div>
		{/if}
	</dl>

	{#if review.comment}
		<p class="mt-3 whitespace-pre-line text-slate-800">{review.comment}</p>
	{/if}

	<footer class="mt-3 flex flex-wrap items-center justify-end gap-3 text-xs">
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
