<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const c = $derived(data.counts);

	const todo = $derived([
		{ href: '/admin/bildirimler', label: m.admin_reports(), n: c.reported },
		{ href: '/admin/hocalar', label: m.admin_pending_instructors(), n: c.pendingInstructors },
		{ href: '/admin/oneriler', label: m.admin_suggestions(), n: c.suggestions }
	]);
	const stats = $derived([
		[m.stat_courses(), c.courses],
		[m.stat_instructors(), c.instructors],
		[m.stat_reviews(), c.reviews],
		[m.stat_users(), c.users],
		[m.stat_banned(), c.banned]
	] as const);
</script>

<div class="mb-8 grid gap-3 sm:grid-cols-3">
	{#each todo as t (t.href)}
		<a
			href={t.href}
			class="card p-4 hover:no-underline {t.n ? 'border-amber-300 bg-amber-50' : ''}"
		>
			<div class="text-sm text-slate-600">{t.label}</div>
			<div class="text-3xl font-semibold {t.n ? 'text-amber-800' : 'text-slate-400'}">{t.n}</div>
		</a>
	{/each}
</div>
<dl class="grid grid-cols-2 gap-4 card p-4 sm:grid-cols-5">
	{#each stats as [label, n] (label)}
		<div>
			<dt class="text-sm text-slate-500">{label}</dt>
			<dd class="text-xl font-semibold text-brand-800">{n}</dd>
		</div>
	{/each}
</dl>
