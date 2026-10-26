<script lang="ts">
	import { enhance } from '$app/forms';
	import CourseFieldsForm from '#lib/components/CourseFieldsForm.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>{m.suggest_course()} · {m.site_name()}</title>
</svelte:head>

<h1 class="mb-2 text-2xl font-semibold text-brand-900">
	{data.isAdmin ? m.add_course() : m.suggest_course()}
</h1>
{#if !data.isAdmin}<p class="mb-6 max-w-2xl text-slate-600">{m.suggest_new_course_intro()}</p>{/if}

{#if form?.suggested}
	<div class="max-w-3xl card p-6">
		<p class="text-green-800">{m.suggestion_thanks()}</p>
		<a href="/" class="mt-3 inline-block">{m.nav_courses()}</a>
	</div>
{:else}
	{#if form?.existing}
		<p class="mb-4 text-sm text-amber-800">
			{m.course_already_exists()} <a href="/ders/{form.existing}">{m.go_to_course()}</a>
		</p>
	{/if}
	<form method="POST" class="flex max-w-3xl flex-col gap-4 card p-5" use:enhance>
		<CourseFieldsForm values={{}} errors={form?.errors} />
		{#if !data.isAdmin}
			<div>
				<label class="label" for="note">{m.suggestion_note()}</label>
				<textarea id="note" name="note" rows="2" maxlength="1000" class="w-full"></textarea>
			</div>
		{/if}
		<div class="flex justify-end gap-3">
			<a href="/" class="btn btn-secondary">{m.cancel()}</a>
			<button class="btn btn-primary">{data.isAdmin ? m.save() : m.send_suggestion()}</button>
		</div>
	</form>
{/if}
