<script lang="ts">
	import { courseName, instructorName, termLabel } from '#lib/i18n.ts';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{m.nav_account()} · {m.site_name()}</title>
</svelte:head>

<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
	<h1 class="text-2xl font-semibold text-brand-900">{m.nav_account()}</h1>
	<form method="POST" action="/cikis">
		<button class="btn btn-secondary">{m.logout()}</button>
	</form>
</div>

<p class="mb-6 max-w-2xl text-sm text-slate-600">{m.account_privacy_note()}</p>

<h2 class="mb-3 text-lg font-semibold text-brand-900">{m.my_reviews()}</h2>
<div class="mb-10 overflow-x-auto card">
	<table class="data-table">
		<thead>
			<tr>
				<th>{m.col_course()}</th>
				<th>{m.col_instructor()}</th>
				<th>{m.col_term()}</th>
				<th>{m.col_status()}</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.reviews as r (r.id)}
				<tr>
					<td
						><a href="/ders/{r.courseSlug}"
							>{r.courseCode} {courseName({ nameTr: r.courseNameTr, nameEn: r.courseNameEn })}</a
						></td
					>
					<td>{instructorName({ title: r.instructorTitle, name: r.instructorName })}</td>
					<td>{termLabel(r.academicYear, r.term)}</td>
					<td>
						{#if r.status === 'hidden'}
							<span class="text-red-700">{m.status_hidden()}</span>
						{:else if r.instructorStatus === 'pending'}
							<span class="text-amber-700">{m.status_pending_instructor()}</span>
						{:else}
							<span class="text-green-700">{m.status_published()}</span>
						{/if}
					</td>
					<td class="text-right"
						><a href="/ders/{r.courseSlug}/degerlendir?id={r.id}">{m.edit()}</a></td
					>
				</tr>
			{:else}
				<tr><td colspan="5" class="py-6 text-center text-slate-500">{m.my_reviews_empty()}</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<details class="card p-4">
	<summary class="cursor-pointer text-sm font-medium text-red-700">{m.delete_account()}</summary>
	<p class="mt-3 text-sm text-slate-600">{m.delete_account_body()}</p>
	<form method="POST" action="?/deleteAccount" class="mt-3">
		<button
			class="btn btn-danger"
			onclick={(e) => !confirm(m.delete_account_confirm()) && e.preventDefault()}
		>
			{m.delete_account()}
		</button>
	</form>
</details>
