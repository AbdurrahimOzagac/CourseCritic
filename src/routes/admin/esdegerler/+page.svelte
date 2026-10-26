<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<p class="mb-4 max-w-2xl text-sm text-slate-600">{m.admin_equivalents_intro()}</p>

<form method="POST" action="?/add" class="mb-6 flex flex-wrap items-end gap-3 card p-4" use:enhance>
	<div>
		<label class="label" for="eq-a">{m.admin_old_code()}</label><input
			id="eq-a"
			name="a"
			required
			placeholder="BBM 342"
		/>
	</div>
	<span class="pb-2 text-slate-400">↔</span>
	<div>
		<label class="label" for="eq-b">{m.admin_new_code()}</label><input
			id="eq-b"
			name="b"
			required
			placeholder="BİL 342"
		/>
	</div>
	<button class="btn btn-primary">{m.add()}</button>
	{#if form?.error}
		<p class="w-full text-sm text-red-700">
			{form.error === 'same' ? m.admin_equiv_same() : m.admin_equiv_not_found()}
		</p>
	{/if}
</form>

<div class="overflow-x-auto card">
	<table class="data-table">
		<tbody>
			{#each data.pairs as p (p.a + p.b)}
				<tr>
					<td><a href="/ders/{p.aSlug}">{p.aCode}</a> ↔ <a href="/ders/{p.bSlug}">{p.bCode}</a></td>
					<td class="text-right">
						<form method="POST" action="?/remove" use:enhance>
							<input type="hidden" name="a" value={p.a} /><input
								type="hidden"
								name="b"
								value={p.b}
							/>
							<button class="text-red-700 hover:underline">{m.delete()}</button>
						</form>
					</td>
				</tr>
			{:else}
				<tr><td class="py-6 text-center text-slate-500">{m.admin_nothing_here()}</td></tr>
			{/each}
		</tbody>
	</table>
</div>
