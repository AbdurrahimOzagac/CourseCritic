<script lang="ts">
	import { enhance } from '$app/forms';
	import CourseFieldsForm from '#lib/components/CourseFieldsForm.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>{m.add_course()} · {m.site_name()}</title>
</svelte:head>

<h1 class="mb-2 text-2xl font-semibold text-brand-900">
	{m.add_course()}
</h1>
<p class="mb-6 max-w-2xl text-slate-600">{m.suggest_new_course_intro()}</p>

{#if data.courseAdds?.remaining === 0 || form?.errors?.limit}
	<p class="max-w-3xl card p-6 text-red-700">
		{m.course_adds_exhausted({ limit: data.courseAdds?.limit ?? 0 })}
	</p>
{:else}
	{#if data.courseAdds?.warn}
		<p class="mb-4 text-sm text-slate-600">
			{m.course_adds_remaining({
				used: data.courseAdds.used,
				remaining: data.courseAdds.remaining
			})}
		</p>
	{/if}
	{#if form?.existing}
		<p class="mb-4 text-sm text-amber-800">
			{m.course_already_exists()} <a href="/ders/{form.existing}">{m.go_to_course()}</a>
		</p>
	{/if}
	<form method="POST" class="flex max-w-3xl flex-col gap-4 card p-5" use:enhance>
		<CourseFieldsForm
			values={{ department: data.preselected || null }}
			departments={data.departments}
			errors={form?.errors}
		/>
		<div class="flex justify-end gap-3">
			<a href="/" class="btn btn-secondary">{m.cancel()}</a>
			<button class="btn btn-primary">{m.add_course()}</button>
		</div>
	</form>
{/if}
