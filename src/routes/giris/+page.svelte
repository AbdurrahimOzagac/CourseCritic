<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);

	const errorText = $derived(
		form?.error === 'domain'
			? m.login_error_domain({ domains: data.domains.map((d) => '@' + d).join(', ') })
			: form?.error === 'tagged'
				? m.login_error_tagged()
				: form?.error === 'rate_limited'
					? m.login_error_rate_limited()
					: form?.error === 'mail_failed'
						? m.login_error_mail()
						: null
	);
</script>

<svelte:head>
	<title>{m.nav_login()} · {m.site_name()}</title>
</svelte:head>

<div class="mx-auto max-w-md">
	<h1 class="mb-2 text-2xl font-semibold text-brand-900">{m.login_title()}</h1>
	<p class="mb-6 text-slate-600">
		{m.login_intro({ domains: data.domains.map((d) => '@' + d).join(', ') })}
	</p>

	<form
		method="POST"
		class="flex flex-col gap-4 card p-5"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<input type="hidden" name="r" value={data.r} />
		<div>
			<label class="label" for="email">{m.login_email()}</label>
			<input
				id="email"
				name="email"
				type="email"
				required
				autocomplete="email"
				placeholder="ad.soyad@{data.domains[0] ?? 'hacettepe.edu.tr'}"
				value={form?.email ?? ''}
				class="w-full"
			/>
		</div>
		{#if errorText}<p class="text-sm text-red-700">{errorText}</p>{/if}
		<button class="btn btn-primary" disabled={submitting}>{m.login_send_code()}</button>
	</form>

	<div class="mt-6 rounded border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
		<p class="font-semibold">{m.privacy_box_title()}</p>
		<p class="mt-1">{m.privacy_box_body()}</p>
		<a href="/gizlilik" class="mt-2 inline-block">{m.privacy_more()}</a>
	</div>
</div>
