<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, setLocale } from '#lib/paraglide/runtime.js';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const locale = getLocale();
	const q = $derived(page.url.pathname === '/ara' ? (page.url.searchParams.get('q') ?? '') : '');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{m.site_name()}</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<header class="border-b-4 border-brand-700 bg-white">
		<div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
			<a href="/" class="flex flex-col leading-tight text-brand-800 hover:no-underline">
				<span class="text-xl font-bold tracking-tight">{m.site_name()}</span>
				<span class="text-xs text-slate-500">{m.site_scope()}</span>
			</a>

			<form
				action="/ara"
				method="get"
				role="search"
				class="order-last w-full sm:order-none sm:w-auto sm:flex-1"
			>
				<label class="sr-only" for="site-search">{m.search_label()}</label>
				<input
					id="site-search"
					name="q"
					type="search"
					value={q}
					placeholder={m.search_placeholder()}
					class="w-full sm:max-w-md"
					autocomplete="off"
				/>
			</form>

			<nav class="ml-auto flex items-center gap-4 text-sm">
				<a href="/">{m.nav_courses()}</a>
				{#if data.user}
					<a href="/hesabim">{m.nav_account()}</a>
					{#if data.user.role === 'admin'}
						<a href="/admin">{m.nav_admin()}</a>
					{/if}
				{:else}
					<a
						href="/giris?r={encodeURIComponent(page.url.pathname + page.url.search)}"
						class="btn btn-primary py-1.5">{m.nav_login()}</a
					>
				{/if}
				<div
					class="flex overflow-hidden rounded border border-slate-300 text-xs"
					role="group"
					aria-label={m.language()}
				>
					{#each ['tr', 'en'] as const as l (l)}
						<button
							type="button"
							class="px-2 py-1 {locale === l
								? 'bg-brand-700 text-white'
								: 'bg-white text-slate-600 hover:bg-slate-50'}"
							aria-pressed={locale === l}
							onclick={() => setLocale(l)}>{l.toUpperCase()}</button
						>
					{/each}
				</div>
			</nav>
		</div>
	</header>

	<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
		{@render children()}
	</main>

	<footer class="border-t border-slate-200 bg-white">
		<div class="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-4 py-6 text-sm text-slate-500">
			<span>{m.site_name()} · {m.footer_tagline()}</span>
			<span class="flex-1"></span>
			<a href="/hakkinda">{m.nav_about()}</a>
			<a href="/kosullar">{m.nav_terms()}</a>
			<a href="/gizlilik">{m.nav_privacy()}</a>
		</div>
	</footer>
</div>
