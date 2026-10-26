<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
</script>

<svelte:head><title>{page.status} · {m.site_name()}</title></svelte:head>

<div class="mx-auto max-w-lg py-16 text-center">
	<div class="text-5xl font-semibold text-brand-300">{page.status}</div>
	<h1 class="mt-4 text-xl font-semibold text-brand-900">
		{page.status === 404 ? m.error_not_found() : m.error_generic()}
	</h1>
	{#if page.status !== 404 && page.error?.message}<p class="mt-2 text-sm text-slate-500">
			{page.error.message}
		</p>{/if}
	<a href="/" class="mt-6 btn btn-primary">{m.nav_courses()}</a>
</div>
