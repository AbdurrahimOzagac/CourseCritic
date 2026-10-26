<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const labels: Record<string, () => string> = {
		code: m.field_code,
		nameTr: m.field_name_tr,
		nameEn: m.field_name_en,
		credits: m.field_credits,
		ects: m.field_ects,
		yearLevel: m.filter_year_level,
		kind: m.filter_kind,
		prerequisites: m.field_prerequisites,
		descriptionTr: m.field_description_tr,
		descriptionEn: m.field_description_en
	};
</script>

{#if form?.error}<p class="mb-4 text-sm text-red-700">{m.admin_code_conflict()}</p>{/if}

<div class="flex flex-col gap-4">
	{#each data.suggestions as s (s.id)}
		<article class="card p-4">
			<header class="mb-3 flex items-center justify-between">
				<div class="font-medium">
					{#if s.isNew}
						<span class="mr-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800"
							>{m.admin_new_course()}</span
						>
					{:else}
						<a href="/ders/{s.courseSlug}">{s.courseSlug}</a>
					{/if}
				</div>
			</header>
			<table class="data-table">
				<thead
					><tr><th class="w-40"></th><th>{m.admin_current()}</th><th>{m.admin_proposed()}</th></tr
					></thead
				>
				<tbody>
					{#each s.changes as c (c.field)}
						<tr>
							<td class="text-slate-500">{labels[c.field]()}</td>
							<td class="whitespace-pre-line text-slate-500 line-through decoration-red-300"
								>{c.from ?? '–'}</td
							>
							<td class="whitespace-pre-line text-green-800">{c.to ?? '–'}</td>
						</tr>
					{:else}
						<tr><td colspan="3" class="text-slate-500">{m.admin_no_changes()}</td></tr>
					{/each}
				</tbody>
			</table>
			{#if s.note}<p class="mt-3 text-sm text-slate-600">{m.suggestion_note()}: {s.note}</p>{/if}
			<div class="mt-3 flex justify-end gap-2">
				<form method="POST" action="?/reject" use:enhance>
					<input type="hidden" name="id" value={s.id} /><button class="btn btn-secondary py-1"
						>{m.admin_reject()}</button
					>
				</form>
				<form method="POST" action="?/approve" use:enhance>
					<input type="hidden" name="id" value={s.id} /><button class="btn btn-primary py-1"
						>{m.admin_approve()}</button
					>
				</form>
			</div>
		</article>
	{:else}
		<p class="card p-6 text-center text-slate-500">{m.admin_nothing_here()}</p>
	{/each}
</div>
