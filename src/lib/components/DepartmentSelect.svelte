<script lang="ts" module>
	export interface DepartmentOption {
		code: string;
		nameTr: string;
		nameEn: string;
		facultyTr: string | null;
		facultyEn: string | null;
	}
</script>

<script lang="ts">
	import { departmentName, facultyName } from '#lib/i18n.ts';

	/** Fakültelere göre gruplanmış bölüm listesi. `emptyLabel` verilirse ilk seçenek "boş" olur. */
	let {
		departments,
		value = $bindable(''),
		id,
		name,
		required = false,
		emptyLabel,
		onchange
	}: {
		departments: DepartmentOption[];
		value?: string;
		id: string;
		name?: string;
		required?: boolean;
		emptyLabel?: string;
		onchange?: (value: string) => void;
	} = $props();

	const groups = $derived.by(() => {
		const map = new Map<string, DepartmentOption[]>();
		for (const d of departments) {
			const f = facultyName(d);
			if (!map.has(f)) map.set(f, []);
			map.get(f)!.push(d);
		}
		return [...map.entries()]
			.map(([faculty, items]) => ({
				faculty,
				items: items.sort((a, b) => departmentName(a).localeCompare(departmentName(b), 'tr'))
			}))
			.sort((a, b) => a.faculty.localeCompare(b.faculty, 'tr'));
	});
</script>

<select {id} {name} {required} bind:value class="w-full" onchange={() => onchange?.(value)}>
	{#if emptyLabel !== undefined}<option value="">{emptyLabel}</option>{/if}
	{#each groups as g (g.faculty)}
		<optgroup label={g.faculty}>
			{#each g.items as d (d.code)}
				<option value={d.code}>{departmentName(d)}</option>
			{/each}
		</optgroup>
	{/each}
</select>
