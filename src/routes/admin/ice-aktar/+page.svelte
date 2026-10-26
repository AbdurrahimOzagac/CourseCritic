<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const sections = [
		{
			action: 'courses',
			title: m.admin_import_courses,
			header:
				'code,name_tr,name_en,credits,ects,year_level,kind,prerequisites,description_tr,description_en',
			example: 'BBM 342,İşletim Sistemleri,Operating Systems,3,6,3,zorunlu,BBM 201,,'
		},
		{
			action: 'instructors',
			title: m.admin_import_instructors,
			header: 'title,name,courses',
			example: 'Prof. Dr.,Ad Soyad,BBM 342;BBM 101'
		}
	] as const;
</script>

<p class="mb-6 max-w-3xl text-sm text-slate-600">{m.admin_import_intro()}</p>

<div class="grid gap-6 lg:grid-cols-2">
	{#each sections as s (s.action)}
		<form
			method="POST"
			action="?/{s.action}"
			enctype="multipart/form-data"
			class="flex flex-col gap-3 card p-4"
			use:enhance
		>
			<h2 class="font-semibold text-brand-900">{s.title()}</h2>
			<pre class="overflow-x-auto rounded bg-slate-100 p-2 text-xs">{s.header}
{s.example}</pre>
			<input type="file" name="file" accept=".csv,text/csv" class="text-sm" />
			<textarea
				name="csv"
				rows="8"
				class="w-full font-mono text-xs"
				placeholder={m.admin_import_paste()}></textarea>
			<button class="btn self-end btn-primary">{m.admin_import_run()}</button>

			{#if form?.kind === s.action}
				<div class="rounded bg-slate-50 p-3 text-sm">
					{#if 'error' in form && form.error}
						<p class="text-red-700">{m.admin_import_empty()}</p>
					{:else if 'created' in form}
						<p>
							{m.admin_import_courses_result({
								created: form.created ?? 0,
								updated: form.updated ?? 0
							})}
						</p>
					{:else if 'processed' in form}
						<p>
							{m.admin_import_instructors_result({
								processed: form.processed ?? 0,
								links: form.links ?? 0
							})}
						</p>
					{/if}
					{#if 'errors' in form && form.errors?.length}
						<ul class="mt-2 list-disc pl-5 text-red-700">
							{#each form.errors as err, i (i)}<li>{err}</li>{/each}
						</ul>
					{/if}
				</div>
			{/if}
		</form>
	{/each}
</div>
