<script lang="ts">
	import { enhance } from '$app/forms';
	import ScaleInput from '#lib/components/ScaleInput.svelte';
	import {
		COMMENT_MAX_LENGTH,
		COURSE_CRITERIA,
		CURVE_ANSWERS,
		INSTRUCTOR_CRITERIA,
		MAX_ATTEMPTS,
		OUTCOMES,
		TERMS,
		type Criterion
	} from '#lib/constants.ts';
	import {
		courseName,
		criterionName,
		curveName,
		instructorName,
		outcomeName,
		termName
	} from '#lib/i18n.ts';
	import { CRITERIA } from '#lib/constants.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { findProfanity } from '#lib/profanity.ts';
	import { foldText, matchesQuery } from '#lib/text.ts';
	import { NEW_INSTRUCTOR } from '#lib/review-form.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Form başlangıç değerleri: sayfa yüklendiğindeki veriden bir kez alınır
	// svelte-ignore state_referenced_locally
	const e = data.existing;
	// svelte-ignore state_referenced_locally
	let instructor = $state(e?.instructor ?? data.preselected);
	let academicYear = $state(e ? String(e.academicYear) : '');
	let term = $state<string>(e?.term ?? '');
	let ratings = $state<Record<Criterion, number | null>>({
		difficulty: e?.difficulty ?? null,
		workload: e?.workload ?? null,
		teachingValue: e?.teachingValue ?? null,
		instructorClarity: e?.instructorClarity ?? null,
		instructorAttitude: e?.instructorAttitude ?? null,
		instructorExpertise: e?.instructorExpertise ?? null
	});
	// İsteğe bağlı alanlar state'e bağlanır: bağlanmayan `value={…}` alanları başka bir alana yazınca
	// (ör. yorum) sıfırlanabiliyordu ve girilen sınıf ortalaması sessizce kayboluyordu
	let attempts = $state(e?.attempts ? String(e.attempts) : '');
	let outcome = $state<string>(e?.outcome ?? '');
	let classAverage = $state<number | null>(e?.classAverage ?? null);
	let curve = $state<string>(e?.curve ?? '');
	let comment = $state(e?.comment ?? '');
	let submitting = $state(false);

	// Yeni hoca eklerken listedeki benzer isimler (Türkçe karakterden bağımsız, en fazla 5)
	let newName = $state('');
	const knownInstructors = $derived([...data.courseInstructors, ...data.otherInstructors]);
	const similar = $derived(
		foldText(newName).length >= 2
			? knownInstructors.filter((i) => matchesQuery(newName, i.name)).slice(0, 5)
			: []
	);
	const exactMatch = $derived(similar.some((i) => foldText(i.name) === foldText(newName)));

	// Gönder'e basınca açılan onay penceresi: boş bırakılan isteğe bağlı alanları listeler
	let formEl: HTMLFormElement;
	let dialogEl: HTMLDialogElement;
	let unfilled = $state<string[]>([]);
	let confirmed = false;

	function unfilledFields(data: FormData): string[] {
		const fields: [string, () => string][] = [
			...CRITERIA.map((c): [string, () => string] => [c, () => criterionName(c)]),
			['attempts', m.field_attempts],
			['outcome', m.field_outcome],
			['classAverage', m.field_class_average],
			['curve', m.field_curve],
			['comment', m.field_comment]
		];
		return fields
			.filter(([name]) => !String(data.get(name) ?? '').trim())
			.map(([, label]) => label());
	}

	const flagged = $derived(comment ? findProfanity(comment) : []);
	const errors = $derived((form?.errors ?? {}) as Record<string, string | undefined>);

	function errorText(code: string | undefined): string | undefined {
		switch (code) {
			case undefined:
				return undefined;
			case 'required':
				return m.error_required();
			case 'profanity':
				return m.error_profanity();
			case 'too_long':
				return m.error_too_long();
			case 'future_term':
				return m.error_future_term();
			case 'empty_review':
				return m.error_empty_review();
			case 'duplicate':
				return m.error_duplicate_review();
			default:
				return m.error_invalid();
		}
	}
</script>

<svelte:head>
	<title>{m.write_review()} · {data.course.code} · {m.site_name()}</title>
</svelte:head>

<nav class="mb-4 text-sm text-slate-500">
	<a href="/">{m.nav_courses()}</a> / <a href="/ders/{data.course.slug}">{data.course.code}</a> /
	{e ? m.edit_review() : m.write_review()}
</nav>

<h1 class="mb-1 text-2xl font-semibold text-brand-900">{e ? m.edit_review() : m.write_review()}</h1>
<p class="mb-6 text-slate-600">{data.course.code} {courseName(data.course)}</p>

<form
	method="POST"
	class="flex max-w-3xl flex-col gap-8"
	bind:this={formEl}
	use:enhance={({ formData, cancel }) => {
		if (!confirmed) {
			cancel();
			unfilled = unfilledFields(formData);
			dialogEl.showModal();
			return;
		}
		confirmed = false;
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	{#if e}<input type="hidden" name="id" value={e.id} />{/if}

	<!-- Ne zaman, kimden -->
	<section class="flex flex-col gap-4 card p-5">
		<h2 class="font-semibold text-brand-900">{m.form_when_whom()}</h2>
		<div>
			<label class="label" for="instructor">{m.col_instructor()}</label>
			<select id="instructor" name="instructor" bind:value={instructor} required class="w-full">
				<option value="" disabled>{m.form_select_instructor()}</option>
				{#if data.pendingInstructor}
					<option value={data.pendingInstructor.id}
						>{instructorName(data.pendingInstructor)} ({m.pending()})</option
					>
				{/if}
				{#if data.courseInstructors.length}
					<optgroup label={m.form_course_instructors()}>
						{#each data.courseInstructors as i (i.id)}
							<option value={i.id}>{instructorName(i)}</option>
						{/each}
					</optgroup>
				{/if}
				{#if data.otherInstructors.length}
					<optgroup label={m.form_other_instructors()}>
						{#each data.otherInstructors as i (i.id)}
							<option value={i.id}>{instructorName(i)}</option>
						{/each}
					</optgroup>
				{/if}
				<option value={NEW_INSTRUCTOR}>{m.form_instructor_not_listed()}</option>
			</select>
			{#if errorText(errors.instructor)}<p class="mt-1 text-sm text-red-700">
					{errorText(errors.instructor)}
				</p>{/if}
		</div>

		{#if instructor === NEW_INSTRUCTOR}
			<div class="grid gap-3 rounded border border-amber-200 bg-amber-50 p-3">
				<div>
					<label class="label" for="newInstructorName">{m.form_instructor_name()}</label>
					<input
						id="newInstructorName"
						name="newInstructorName"
						required
						minlength="3"
						maxlength="100"
						autocomplete="off"
						bind:value={newName}
						class="w-full"
					/>
				</div>
				<!-- Yazarken listedeki benzer isimler: çoğu zaman yeni eklemek yerine var olan seçilir -->
				{#if similar.length}
					<div class="rounded border border-amber-300 bg-white p-3 text-sm">
						<p class="mb-2 font-medium text-slate-800">
							{exactMatch ? m.form_instructor_exact() : m.form_instructor_suggestions()}
						</p>
						<ul class="flex flex-col gap-1">
							{#each similar as i (i.id)}
								<li class="flex items-center justify-between gap-3">
									<span>{instructorName(i)}</span>
									<button
										type="button"
										class="btn btn-secondary py-1"
										onclick={() => {
											instructor = i.id;
											newName = '';
										}}>{m.form_instructor_pick()}</button
									>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
				<p class="text-sm text-amber-800 sm:col-span-2">{m.form_new_instructor_note()}</p>
				<!-- Aylık ekleme hakkı: sınır dolunca gönderilmeden önce görünsün -->
				{#if data.instructorAdds.remaining === 0 || errors.newInstructorName === 'limit'}
					<p class="text-sm font-medium text-red-700 sm:col-span-2">
						{m.instructor_adds_exhausted({ limit: data.instructorAdds.limit })}
					</p>
				{:else if data.instructorAdds.used > 0}
					<p class="text-sm text-slate-600 sm:col-span-2">
						{m.instructor_adds_remaining({
							used: data.instructorAdds.used,
							remaining: data.instructorAdds.remaining
						})}
					</p>
				{/if}
				{#if errors.newInstructorName && errors.newInstructorName !== 'limit'}
					<p class="text-sm text-red-700 sm:col-span-2">
						{errors.newInstructorName === 'invalid'
							? m.error_instructor_name()
							: errorText(errors.newInstructorName)}
					</p>
				{/if}
			</div>
		{/if}

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label class="label" for="academicYear">{m.form_academic_year()}</label>
				<select
					id="academicYear"
					name="academicYear"
					bind:value={academicYear}
					required
					class="w-full"
				>
					<option value="" disabled>{m.form_select()}</option>
					{#each data.years as y (y)}
						<option value={String(y)}>{y}-{y + 1}</option>
					{/each}
				</select>
				{#if errorText(errors.academicYear)}<p class="mt-1 text-sm text-red-700">
						{errorText(errors.academicYear)}
					</p>{/if}
			</div>
			<div>
				<label class="label" for="term">{m.col_term()}</label>
				<select id="term" name="term" bind:value={term} required class="w-full">
					<option value="" disabled>{m.form_select()}</option>
					{#each TERMS as t (t)}
						<option value={t}>{termName(t)}</option>
					{/each}
				</select>
				{#if errorText(errors.term)}<p class="mt-1 text-sm text-red-700">
						{errorText(errors.term)}
					</p>{/if}
			</div>
		</div>
	</section>

	<!-- Ders -->
	<section class="flex flex-col gap-6 card p-5">
		<div>
			<h2 class="font-semibold text-brand-900">{m.section_course()}</h2>
			<p class="text-sm text-slate-500">{m.form_ratings_hint()}</p>
		</div>
		{#each COURSE_CRITERIA as c (c)}
			<ScaleInput criterion={c} bind:value={ratings[c]} error={errorText(errors[c])} />
		{/each}
	</section>

	<!-- Hoca -->
	<section class="flex flex-col gap-6 card p-5">
		<h2 class="font-semibold text-brand-900">{m.section_instructor()}</h2>
		{#each INSTRUCTOR_CRITERIA as c (c)}
			<ScaleInput criterion={c} bind:value={ratings[c]} error={errorText(errors[c])} />
		{/each}
	</section>

	<!-- İsteğe bağlı -->
	<section class="flex flex-col gap-4 card p-5">
		<div>
			<h2 class="font-semibold text-brand-900">{m.form_optional_section()}</h2>
			<p class="text-sm text-slate-500">{m.form_optional_hint()}</p>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label class="label" for="attempts">{m.field_attempts()}</label>
				<select id="attempts" name="attempts" class="w-full" bind:value={attempts}>
					<option value="">–</option>
					{#each Array.from({ length: MAX_ATTEMPTS }, (_, i) => i + 1) as n (n)}
						<option value={String(n)}>{n === MAX_ATTEMPTS ? `${n}+` : n}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="label" for="outcome">{m.field_outcome()}</label>
				<select id="outcome" name="outcome" class="w-full" bind:value={outcome}>
					<option value="">–</option>
					{#each OUTCOMES as o (o)}
						<option value={o}>{outcomeName(o)}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="label" for="classAverage">{m.field_class_average()}</label>
				<input
					id="classAverage"
					name="classAverage"
					type="number"
					min="0"
					max="100"
					inputmode="numeric"
					placeholder="0–100"
					class="w-full"
					bind:value={classAverage}
				/>
				<p class="mt-1 text-xs text-slate-500">{m.field_class_average_hint()}</p>
				{#if errorText(errors.classAverage)}<p class="mt-1 text-sm text-red-700">
						{errorText(errors.classAverage)}
					</p>{/if}
			</div>
			<div>
				<label class="label" for="curve">{m.field_curve()}</label>
				<select id="curve" name="curve" class="w-full" bind:value={curve}>
					<option value="">–</option>
					{#each CURVE_ANSWERS as c (c)}
						<option value={c}>{curveName(c)}</option>
					{/each}
				</select>
			</div>
		</div>

		<div>
			<label class="label" for="comment">{m.field_comment()}</label>
			<textarea
				id="comment"
				name="comment"
				rows="6"
				maxlength={COMMENT_MAX_LENGTH}
				bind:value={comment}
				placeholder={m.field_comment_placeholder()}
				class="w-full"></textarea>
			<div class="mt-1 flex justify-between text-xs text-slate-500">
				<span>
					{#if flagged.length}
						<span class="text-red-700"
							>{m.profanity_live_warning({ words: flagged.join(', ') })}</span
						>
					{/if}
				</span>
				<span class="tabular-nums">{comment.length}/{COMMENT_MAX_LENGTH}</span>
			</div>
			{#if errorText(errors.comment)}<p class="mt-1 text-sm text-red-700">
					{errorText(errors.comment)}
				</p>{/if}
		</div>
	</section>

	<div class="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900">
		<p class="font-semibold">{m.rules_title()}</p>
		<p class="mt-1">{m.rules_ban_warning()}</p>
		<p class="mt-1 text-red-800">{m.rules_anonymity_note()}</p>
	</div>

	{#if errors.ratings}
		<p class="text-sm text-red-700">{errorText(errors.ratings)}</p>
	{/if}
	{#if form?.errors}
		<p class="text-sm text-red-700">{m.error_form()}</p>
	{/if}

	<div class="flex justify-end gap-3">
		<a href="/ders/{data.course.slug}" class="btn btn-secondary">{m.cancel()}</a>
		<button class="btn btn-primary" disabled={submitting || flagged.length > 0}>
			{e ? m.save() : m.submit_review()}
		</button>
	</div>
</form>

<dialog
	bind:this={dialogEl}
	class="m-auto w-[min(32rem,calc(100vw-2rem))] rounded border border-slate-300 bg-white p-0 shadow-xl backdrop:bg-slate-900/40"
>
	<div class="flex flex-col gap-4 p-5">
		<h2 class="text-lg font-semibold text-brand-900">{m.confirm_title()}</h2>
		{#if unfilled.length}
			<div>
				<p class="text-sm text-slate-700">{m.confirm_unfilled_intro()}</p>
				<ul class="mt-2 list-disc pl-5 text-sm text-slate-700">
					{#each unfilled as label (label)}<li>{label}</li>{/each}
				</ul>
			</div>
		{/if}
		<p class="text-sm text-slate-700">{e ? m.confirm_save() : m.confirm_send()}</p>
		<div class="flex justify-end gap-3">
			<button type="button" class="btn btn-secondary" onclick={() => dialogEl.close()}>
				{m.confirm_back()}
			</button>
			<button
				type="button"
				class="btn btn-primary"
				onclick={() => {
					confirmed = true;
					dialogEl.close();
					formEl.requestSubmit();
				}}>{m.confirm_yes()}</button
			>
		</div>
	</div>
</dialog>
