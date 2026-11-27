<script lang="ts">
	import { COURSE_KINDS } from '#lib/constants.ts';
	import type { CourseFields } from '#lib/course-form.ts';
	import DepartmentSelect, { type DepartmentOption } from './DepartmentSelect.svelte';
	import { kindName } from '#lib/i18n.ts';
	import { m } from '#lib/paraglide/messages.js';

	let {
		values,
		departments,
		errors = {}
	}: {
		values: Partial<CourseFields>;
		departments: DepartmentOption[];
		errors?: Partial<Record<string, string>>;
	} = $props();

	// svelte-ignore state_referenced_locally
	let department = $state(values.department ?? '');

	// 'exists' (aynı kodda ders var) sayfanın üstünde bağlantıyla gösterilir
	const err = (k: string) =>
		errors[k] === 'exists'
			? null
			: errors[k] === 'required'
				? m.error_required()
				: errors[k] === 'too_long'
					? m.error_too_long()
					: errors[k] === 'profanity'
						? m.error_profanity()
						: errors[k]
							? m.error_invalid()
							: null;
</script>

<div class="grid gap-4 sm:grid-cols-2">
	<div class="sm:col-span-2">
		<label class="label" for="department">{m.field_department()}</label>
		<DepartmentSelect
			id="department"
			name="department"
			required
			{departments}
			bind:value={department}
			emptyLabel="–"
		/>
		<p class="mt-1 text-xs text-slate-500">{m.field_department_hint()}</p>
		{#if err('department')}<p class="mt-1 text-sm text-red-700">{err('department')}</p>{/if}
	</div>
	<div>
		<label class="label" for="code">{m.field_code()}</label>
		<input
			id="code"
			name="code"
			required
			value={values.code ?? ''}
			placeholder="MAT 123"
			class="w-full"
		/>
		{#if err('code')}<p class="mt-1 text-sm text-red-700">{err('code')}</p>{/if}
	</div>
	<div>
		<label class="label" for="kind">{m.filter_kind()}</label>
		<select id="kind" name="kind" value={values.kind ?? ''} class="w-full">
			<option value="">–</option>
			{#each COURSE_KINDS as k (k)}<option value={k}>{kindName(k)}</option>{/each}
		</select>
	</div>
	<div>
		<label class="label" for="nameTr">{m.field_name_tr()}</label>
		<input id="nameTr" name="nameTr" required value={values.nameTr ?? ''} class="w-full" />
		{#if err('nameTr')}<p class="mt-1 text-sm text-red-700">{err('nameTr')}</p>{/if}
	</div>
	<div>
		<label class="label" for="nameEn">{m.field_name_en()}</label>
		<input id="nameEn" name="nameEn" value={values.nameEn ?? ''} class="w-full" />
	</div>
	<div class="grid grid-cols-3 gap-3 sm:col-span-2">
		<div>
			<label class="label" for="credits">{m.field_credits()}</label>
			<input
				id="credits"
				name="credits"
				type="number"
				min="0"
				max="30"
				value={values.credits ?? ''}
				class="w-full"
			/>
		</div>
		<div>
			<label class="label" for="ects">{m.field_ects()}</label>
			<input
				id="ects"
				name="ects"
				type="number"
				min="0"
				max="60"
				value={values.ects ?? ''}
				class="w-full"
			/>
		</div>
		<div>
			<label class="label" for="yearLevel">{m.filter_year_level()}</label>
			<input
				id="yearLevel"
				name="yearLevel"
				type="number"
				min="1"
				max="6"
				value={values.yearLevel ?? ''}
				class="w-full"
			/>
		</div>
	</div>
	<div class="sm:col-span-2">
		<label class="label" for="prerequisites">{m.field_prerequisites()}</label>
		<input
			id="prerequisites"
			name="prerequisites"
			value={values.prerequisites ?? ''}
			placeholder="MAT 123, CMP 101"
			class="w-full"
		/>
	</div>
	<div>
		<label class="label" for="descriptionTr">{m.field_description_tr()}</label>
		<textarea id="descriptionTr" name="descriptionTr" rows="5" class="w-full"
			>{values.descriptionTr ?? ''}</textarea
		>
	</div>
	<div>
		<label class="label" for="descriptionEn">{m.field_description_en()}</label>
		<textarea id="descriptionEn" name="descriptionEn" rows="5" class="w-full"
			>{values.descriptionEn ?? ''}</textarea
		>
	</div>
</div>
