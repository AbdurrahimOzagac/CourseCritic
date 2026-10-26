<script lang="ts">
	import { courseName, instructorName } from '#lib/i18n.ts';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{m.search_title()} · {m.site_name()}</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-semibold text-brand-900">
	{data.q ? m.search_results_for({ q: data.q }) : m.search_title()}
</h1>

{#if !data.q}
	<p class="text-slate-600">{m.search_empty_hint()}</p>
{:else}
	<div class="grid gap-6 md:grid-cols-2">
		<section class="card">
			<h2 class="border-b border-slate-200 px-4 py-3 font-semibold">
				{m.search_courses()} ({data.courses.length})
			</h2>
			<ul class="divide-y divide-slate-100">
				{#each data.courses as c (c.id)}
					<li class="px-4 py-2">
						<a href="/ders/{c.slug}"><span class="text-slate-500">{c.code}</span> {courseName(c)}</a
						>
					</li>
				{:else}
					<li class="px-4 py-3 text-slate-500">{m.search_no_results()}</li>
				{/each}
			</ul>
		</section>
		<section class="card">
			<h2 class="border-b border-slate-200 px-4 py-3 font-semibold">
				{m.search_instructors()} ({data.instructors.length})
			</h2>
			<ul class="divide-y divide-slate-100">
				{#each data.instructors as i (i.id)}
					<li class="px-4 py-2"><a href="/hoca/{i.slug}">{instructorName(i)}</a></li>
				{:else}
					<li class="px-4 py-3 text-slate-500">{m.search_no_results()}</li>
				{/each}
			</ul>
		</section>
	</div>
{/if}
