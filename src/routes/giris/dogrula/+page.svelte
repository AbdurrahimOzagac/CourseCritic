<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const errorText = $derived(
		(
			{
				wrong_code: m.verify_error_wrong(),
				expired: m.verify_error_expired(),
				too_many_attempts: m.verify_error_too_many(),
				banned: m.login_error_banned()
			} as Record<string, string>
		)[form?.error ?? ''] ?? null
	);
	const restart = $derived(form?.error && form.error !== 'wrong_code');
</script>

<svelte:head>
	<title>{m.verify_title()} · {m.site_name()}</title>
</svelte:head>

<div class="mx-auto max-w-md">
	<h1 class="mb-2 text-2xl font-semibold text-brand-900">{m.verify_title()}</h1>
	<p class="mb-6 text-slate-600">{m.verify_intro()}</p>

	<form method="POST" class="flex flex-col gap-4 card p-5" use:enhance>
		<div>
			<label class="label" for="code">{m.verify_code()}</label>
			<input
				id="code"
				name="code"
				required
				inputmode="numeric"
				autocomplete="one-time-code"
				pattern="[0-9 ]{'{6,7}'}"
				maxlength="7"
				class="w-full text-center text-2xl tracking-[0.5em]"
				disabled={!!restart}
			/>
		</div>
		{#if errorText}<p class="text-sm text-red-700">{errorText}</p>{/if}
		{#if restart}
			<a href="/giris" class="btn btn-primary">{m.verify_restart()}</a>
		{:else}
			<button class="btn btn-primary">{m.verify_submit()}</button>
		{/if}
	</form>
	<p class="mt-4 text-sm text-slate-500">
		{m.verify_spam_hint()} <a href="/giris">{m.verify_resend()}</a>
	</p>
</div>
