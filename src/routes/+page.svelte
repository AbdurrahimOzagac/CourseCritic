<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { departmentName, facultyName } from '#lib/i18n.ts';
	import { groupByFaculty, LAST_DEPARTMENT_KEY } from '#lib/departments.ts';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const groups = $derived(groupByFaculty(data.departments, departmentName, facultyName));
	const selectedKey = $derived(page.url.searchParams.get('fakulte') ?? '');
	const selected = $derived(groups.faculties.find((f) => f.key === selectedKey) ?? null);

	// "Son baktığın bölüm" kısayolu: bölüm sayfası bu tarayıcıya yazar, sunucuya gitmez
	let lastDepartment = $state<(typeof data.departments)[number] | null>(null);
	onMount(() => {
		try {
			const code = localStorage.getItem(LAST_DEPARTMENT_KEY);
			lastDepartment = data.departments.find((d) => d.code === code) ?? null;
		} catch {
			// Tarayıcı depolaması kapalıysa kısayol gösterilmez
		}
	});

	// Fakülte seçilince bölüm listesi görünür alanda değilse (ör. telefonda) oraya kaydırılır
	let departmentsEl = $state<HTMLElement>();
	afterNavigate(async ({ type }) => {
		if (type !== 'link' || !selectedKey) return;
		await tick();
		const top = departmentsEl?.getBoundingClientRect().top ?? 0;
		if (top > innerHeight * 0.6)
			departmentsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	});

	const courseCount = (n: number) => (n ? m.course_count({ count: n }) : m.no_courses_short());
</script>

<svelte:head>
	<title>{m.site_name()} · {m.site_scope()}</title>
</svelte:head>

<div class="mb-6">
	<h1 class="text-2xl font-semibold text-brand-900">{m.pick_title()}</h1>
	<p class="mt-1 max-w-2xl text-slate-600">{m.pick_intro()}</p>
	{#if lastDepartment}
		<p class="mt-3 text-sm">
			<span class="text-slate-500">{m.last_department()}:</span>
			<a href="/bolum/{lastDepartment.code}" class="font-medium"
				>{departmentName(lastDepartment)} →</a
			>
		</p>
	{/if}
</div>

<section class="mb-8">
	<h2 class="mb-3 text-sm font-semibold text-slate-500">
		1. {m.pick_faculty()}
	</h2>
	<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
		{#each groups.faculties as f (f.key)}
			{@const active = f.key === selectedKey}
			<a
				href={active ? '/' : `/?fakulte=${f.key}`}
				data-sveltekit-noscroll
				data-sveltekit-replacestate
				aria-current={active ? 'true' : undefined}
				class="flex items-center justify-between gap-3 card px-4 py-3 no-underline hover:border-brand-700 {active
					? 'border-brand-800 bg-brand-50 ring-1 ring-brand-800'
					: ''}"
			>
				<span class="font-medium text-slate-900">{facultyName(f.departments[0])}</span>
				<span class="shrink-0 text-xs text-slate-500"
					>{m.department_count({ count: f.departments.length })}</span
				>
			</a>
		{/each}
	</div>
</section>

{#if selected}
	<section class="mb-8 scroll-mt-4" aria-live="polite" bind:this={departmentsEl}>
		<h2 class="mb-3 text-sm font-semibold text-slate-500">
			2. {m.pick_department()} · {facultyName(selected.departments[0])}
		</h2>
		<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
			{#each selected.departments as d (d.code)}
				<a
					href="/bolum/{d.code}"
					class="flex items-center justify-between gap-3 card px-4 py-3 no-underline hover:border-brand-700"
				>
					<span class="font-medium text-brand-900">{departmentName(d)}</span>
					<span
						class="shrink-0 text-xs {d.courseCount ? 'text-slate-500' : 'text-slate-400 italic'}"
						>{courseCount(d.courseCount)}</span
					>
				</a>
			{/each}
		</div>
	</section>
{/if}

{#if groups.other.length}
	<section>
		<h2 class="mb-1 text-sm font-semibold text-slate-500">
			{m.other_courses()}
		</h2>
		<p class="mb-3 text-sm text-slate-500">{m.other_courses_hint()}</p>
		<div class="grid gap-2 sm:grid-cols-2">
			{#each groups.other as d (d.code)}
				<a
					href="/bolum/{d.code}"
					class="flex items-center justify-between gap-3 card px-4 py-3 no-underline hover:border-brand-700"
				>
					<span class="font-medium text-brand-900">{departmentName(d)}</span>
					<span class="shrink-0 text-xs text-slate-500">{courseCount(d.courseCount)}</span>
				</a>
			{/each}
		</div>
	</section>
{/if}
