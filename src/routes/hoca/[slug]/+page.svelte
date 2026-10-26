<script lang="ts">
	import { courseName, instructorName, termLabel } from '#lib/i18n.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { termKey } from '#lib/terms.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const name = $derived(instructorName(data.instructor));
</script>

<svelte:head>
	<title>{name} · {m.site_name()}</title>
</svelte:head>

<nav class="mb-4 text-sm text-slate-500"><a href="/">{m.nav_courses()}</a> / {m.instructor()}</nav>

<h1 class="mb-1 text-3xl font-semibold text-brand-900">{name}</h1>
<p class="mb-8 text-sm text-slate-500">{m.instructor_page_note()}</p>

<h2 class="mb-3 text-lg font-semibold text-brand-900">{m.courses_taught()}</h2>
<div class="overflow-x-auto card">
	<table class="data-table">
		<thead>
			<tr>
				<th>{m.col_course()}</th>
				<th>{m.col_terms()}</th>
			</tr>
		</thead>
		<tbody>
			{#each data.courses as c (c.id)}
				<tr>
					<td>
						<a href="/ders/{c.slug}?hoca={data.instructor.slug}" class="font-medium">
							<span class="text-slate-500">{c.code}</span>
							{courseName(c)}
						</a>
					</td>
					<td>
						<div class="flex flex-wrap gap-1">
							{#each c.terms as t (termKey(t.academicYear, t.term))}
								<a
									href="/ders/{c.slug}?hoca={data.instructor.slug}&donem={termKey(
										t.academicYear,
										t.term
									)}"
									class="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600 hover:no-underline"
									>{termLabel(t.academicYear, t.term)}</a
								>
							{:else}
								<span class="text-slate-400">–</span>
							{/each}
						</div>
					</td>
				</tr>
			{:else}
				<tr><td colspan="2" class="py-6 text-center text-slate-500">{m.no_courses_found()}</td></tr>
			{/each}
		</tbody>
	</table>
</div>
