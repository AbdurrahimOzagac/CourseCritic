<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';

	let { children } = $props();

	const tabs = [
		['/admin', m.admin_overview],
		['/admin/bildirimler', m.admin_reports],
		['/admin/hocalar', m.admin_instructors],
		['/admin/oneriler', m.admin_suggestions],
		['/admin/esdegerler', m.admin_equivalents],
		['/admin/ice-aktar', m.admin_import]
	] as const;
</script>

<svelte:head>
	<title>{m.nav_admin()} · {m.site_name()}</title>
</svelte:head>

<h1 class="mb-4 text-2xl font-semibold text-brand-900">{m.nav_admin()}</h1>
<nav class="mb-6 flex flex-wrap gap-1 border-b border-slate-200 text-sm">
	{#each tabs as [href, label] (href)}
		<a
			{href}
			class="-mb-px border-b-2 px-3 py-2 hover:no-underline {page.url.pathname === href
				? 'border-brand-700 font-semibold text-brand-800'
				: 'border-transparent text-slate-600 hover:text-brand-700'}">{label()}</a
		>
	{/each}
</nav>
{@render children()}
