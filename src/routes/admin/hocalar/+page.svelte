<script lang="ts">
	import { enhance } from '$app/forms';
	import { instructorName } from '#lib/i18n.ts';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let editing = $state<string | null>(null);
</script>

{#if form && 'missing' in form && form.missing?.length}
	<p class="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
		{m.admin_missing_courses({ codes: form.missing.join(', ') })}
	</p>
{/if}

<section class="mb-10">
	<h2 class="mb-1 text-lg font-semibold text-brand-900">{m.admin_pending_instructors()}</h2>
	<p class="mb-3 text-sm text-slate-600">{m.admin_pending_intro()}</p>
	<div class="flex flex-col gap-3">
		{#each data.pending as i (i.id)}
			<div class="flex flex-wrap items-center gap-3 card p-4">
				<div class="mr-auto">
					<div class="font-medium">{instructorName(i)}</div>
					<div class="text-xs text-slate-500">{m.review_count({ count: i.reviewCount })}</div>
				</div>
				<form method="POST" action="?/approve" use:enhance>
					<input type="hidden" name="id" value={i.id} />
					<button class="btn btn-primary py-1">{m.admin_approve()}</button>
				</form>
				<form method="POST" action="?/merge" class="flex gap-2" use:enhance>
					<input type="hidden" name="id" value={i.id} />
					<select name="target" required class="max-w-48 py-1">
						<option value="">{m.admin_merge_into()}</option>
						{#each data.approved as a (a.id)}<option value={a.id}>{instructorName(a)}</option
							>{/each}
					</select>
					<button class="btn btn-secondary py-1">{m.admin_merge()}</button>
				</form>
				<form
					method="POST"
					action="?/reject"
					use:enhance={({ cancel }) => {
						if (!confirm(m.admin_reject_confirm())) cancel();
					}}
				>
					<input type="hidden" name="id" value={i.id} />
					<button class="btn btn-danger py-1">{m.admin_reject()}</button>
				</form>
			</div>
		{:else}
			<p class="card p-6 text-center text-slate-500">{m.admin_nothing_here()}</p>
		{/each}
	</div>
</section>

<section class="mb-10">
	<h2 class="mb-3 text-lg font-semibold text-brand-900">{m.admin_add_instructor()}</h2>
	<form
		method="POST"
		action="?/create"
		class="grid gap-3 card p-4 sm:grid-cols-[10rem_1fr_1fr_auto] sm:items-end"
		use:enhance
	>
		<div>
			<label class="label" for="new-title">{m.form_instructor_title()}</label><input
				id="new-title"
				name="title"
				class="w-full"
				placeholder="Prof. Dr."
			/>
		</div>
		<div>
			<label class="label" for="new-name">{m.form_instructor_name()}</label><input
				id="new-name"
				name="name"
				required
				minlength="3"
				class="w-full"
			/>
		</div>
		<div>
			<label class="label" for="new-courses">{m.admin_instructor_courses()}</label><input
				id="new-courses"
				name="courses"
				class="w-full"
				placeholder="BBM 101, BBM 342"
			/>
		</div>
		<button class="btn btn-primary">{m.add()}</button>
	</form>
</section>

<section>
	<h2 class="mb-3 text-lg font-semibold text-brand-900">
		{m.admin_all_instructors()} ({data.approved.length})
	</h2>
	<div class="overflow-x-auto card">
		<table class="data-table">
			<thead
				><tr
					><th>{m.col_instructor()}</th><th>{m.admin_instructor_courses()}</th><th
						class="text-right">{m.col_reviews()}</th
					><th></th></tr
				></thead
			>
			<tbody>
				{#each data.approved as i (i.id)}
					{#if editing === i.id}
						<tr>
							<td colspan="4">
								<form
									method="POST"
									action="?/update"
									class="grid gap-2 sm:grid-cols-[8rem_1fr_1fr_auto_auto]"
									use:enhance={() =>
										async ({ update }) => {
											await update();
											editing = null;
										}}
								>
									<input type="hidden" name="id" value={i.id} />
									<input
										name="title"
										value={i.title ?? ''}
										placeholder={m.form_instructor_title()}
									/>
									<input name="name" value={i.name} required minlength="3" />
									<input
										name="courses"
										value={i.courseCodes ?? ''}
										placeholder="BBM 101, BBM 342"
									/>
									<button class="btn btn-primary py-1">{m.save()}</button>
									<button
										type="button"
										class="btn btn-secondary py-1"
										onclick={() => (editing = null)}>{m.cancel()}</button
									>
								</form>
							</td>
						</tr>
					{:else}
						<tr>
							<td><a href="/hoca/{i.slug}">{instructorName(i)}</a></td>
							<td class="text-slate-600">{i.courseCodes ?? '–'}</td>
							<td class="text-right tabular-nums">{i.reviewCount}</td>
							<td class="text-right"
								><button
									type="button"
									class="text-brand-700 hover:underline"
									onclick={() => (editing = i.id)}>{m.edit()}</button
								></td
							>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	</div>
</section>
