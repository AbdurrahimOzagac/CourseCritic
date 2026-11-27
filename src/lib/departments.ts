import { slugify } from './text';

/** Ana sayfadaki "son baktığın bölüm" kısayolu. Sadece bu tarayıcıda tutulur, sunucuya gitmez. */
export const LAST_DEPARTMENT_KEY = 'derssec:bolum';

/**
 * Bölüm olmayan birimler (Ortak Zorunlu Dersler, SEC) bu fakülte adı altında durur. Ana sayfada fakülte listesinde
 * değil, ayrı bir "bölüm dışı dersler" başlığında gösterilir.
 */
export const NON_DEPARTMENT_FACULTY = 'Rektörlük';

export interface DepartmentLike {
	code: string;
	nameTr: string;
	nameEn: string;
	facultyTr: string | null;
	facultyEn: string | null;
	courseCount: number;
}

/** Fakültenin adresteki anahtarı (`/?fakulte=muhendislik-fakultesi`). Türkçe ada göre: dil değişince bozulmaz. */
export function facultyKey(d: { facultyTr: string | null }): string {
	return slugify(d.facultyTr ?? '') || 'diger';
}

export interface FacultyGroup<D extends DepartmentLike> {
	key: string;
	departments: D[];
	courseCount: number;
}

/** Bölümleri fakültelere ayırır. Fakülte ve bölüm adları gösterim diline göre sıralanır (`name` ile). */
export function groupByFaculty<D extends DepartmentLike>(
	departments: D[],
	name: (d: D) => string,
	faculty: (d: D) => string
): { faculties: FacultyGroup<D>[]; other: D[] } {
	const map = new Map<string, FacultyGroup<D> & { label: string }>();
	const other: D[] = [];
	for (const d of departments) {
		if (d.facultyTr === NON_DEPARTMENT_FACULTY) {
			other.push(d);
			continue;
		}
		const key = facultyKey(d);
		if (!map.has(key)) map.set(key, { key, label: faculty(d), departments: [], courseCount: 0 });
		const g = map.get(key)!;
		g.departments.push(d);
		g.courseCount += d.courseCount;
	}
	const byName = (a: D, b: D) => name(a).localeCompare(name(b), 'tr');
	const faculties = [...map.values()]
		.sort((a, b) => a.label.localeCompare(b.label, 'tr'))
		.map(({ label: _label, ...g }) => ({ ...g, departments: g.departments.sort(byName) }));
	return { faculties, other: other.sort(byName) };
}
