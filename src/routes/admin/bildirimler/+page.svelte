<script lang="ts">
	import { enhance } from '$app/forms';
	import { instructorName, termLabel } from '#lib/i18n.ts';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<p class="mb-4 text-sm text-slate-600">{m.admin_reports_intro()}</p>

<div class="flex flex-col gap-3">
	{#each data.reviews as r (r.id)}
		<article class="card p-4 {r.status === 'hidden' ? 'border-red-200' : ''}">
			<header class="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
				<div>
					<a href="/ders/{r.courseSlug}" class="font-medium">{r.courseCode}</a>
					· {instructorName({ title: r.instructorTitle, name: r.instructorName })}
					· {termLabel(r.academicYear, r.term)}
				</div>
				<div>
					<span class="text-red-700">{m.admin_report_count({ count: r.reportCount })}</span>
					{#if r.status === 'hidden'}<span
							class="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800"
							>{m.status_hidden()}</span
						>{/if}
				</div>
			</header>
			<p class="whitespace-pre-line text-slate-800">{r.comment ?? m.admin_no_comment()}</p>
			{#if r.reasons.length}
				<ul class="mt-2 list-disc pl-5 text-sm text-slate-600">
					{#each r.reasons as reason, i (i)}<li>{reason}</li>{/each}
				</ul>
			{/if}
			<div class="mt-3 flex flex-wrap justify-end gap-2">
				<form method="POST" action="?/restore" use:enhance>
					<input type="hidden" name="reviewId" value={r.id} /><button class="btn btn-secondary py-1"
						>{m.admin_restore()}</button
					>
				</form>
				{#if r.status !== 'hidden'}
					<form method="POST" action="?/hide" use:enhance>
						<input type="hidden" name="reviewId" value={r.id} /><button
							class="btn btn-secondary py-1">{m.admin_hide()}</button
						>
					</form>
				{/if}
				<form
					method="POST"
					action="?/delete"
					use:enhance={({ cancel }) => {
						if (!confirm(m.admin_delete_confirm())) cancel();
					}}
				>
					<input type="hidden" name="reviewId" value={r.id} /><button class="btn btn-danger py-1"
						>{m.delete()}</button
					>
				</form>
				<form
					method="POST"
					action="?/ban"
					use:enhance={({ cancel }) => {
						if (!confirm(m.admin_ban_confirm())) cancel();
					}}
				>
					<input type="hidden" name="reviewId" value={r.id} /><button
						class="btn bg-red-700 py-1 text-white hover:bg-red-800">{m.admin_ban()}</button
					>
				</form>
			</div>
		</article>
	{:else}
		<p class="card p-6 text-center text-slate-500">{m.admin_nothing_here()}</p>
	{/each}
</div>
