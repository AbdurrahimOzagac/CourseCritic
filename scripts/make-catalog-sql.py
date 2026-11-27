"""Hacettepe kataloğunu (bölümler, dersler, SEC hocaları) veritabanına yükleyen SQL'i üretir.

Kullanım:
  python3 scripts/make-catalog-sql.py > /tmp/catalog.sql
  npx wrangler d1 execute DB --local --file=/tmp/catalog.sql    # yerel
  npx wrangler d1 execute DB --remote --file=/tmp/catalog.sql   # canlı

Tekrar çalıştırılabilir:
  - Bölümler koda göre eklenir ya da adları güncellenir.
  - Dersler ve hocalar sadece yoksa eklenir; var olanlara (öğrencilerin ya da admin'in düzelttiklerine) dokunulmaz.

Kaynaklar (Kasım 2026):
  - seed/departments.hacettepe.csv: Hacettepe Bologna Bilgi Paketi (bilsis.hacettepe.edu.tr/oibs/bologna),
    lisans programları; eski kodlu ve tekrar eden programlar birleştirildi.
  - seed/courses.cmp.csv: Bilgisayar Mühendisliği bölüm sitesi (yeni müfredat, CMP).
  - seed/courses.hacettepe.csv: Bologna ders planları (Yapay Zeka ve Veri Müh. 2026 AID, Elektrik-Elektronik Müh.
    2025 ELE, Matematik 2026 MTK) ve bu programlardaki MAT/FİZ/İST/ortak dersler; SEC dersleri Seçmeli Dersler
    Koordinatörlüğü'nün "SEC kodlu verilen tüm derslerin listesi" sayfasından (secmeli.hacettepe.edu.tr).
  - seed/instructors.sec.csv: aynı SEC listesindeki ders sorumluları (ünvanlar çıkarıldı).
"""
import csv, re, time, unicodedata, uuid

UNIVERSITY = 'Hacettepe Üniversitesi'
DEFAULT_DEPARTMENT = 'bilgisayar-muhendisligi'
KINDS = {'zorunlu': 'compulsory', 'compulsory': 'compulsory', 'seçmeli': 'elective', 'elective': 'elective'}


def fold(s):
    """src/lib/text.ts foldText ile aynı sonucu verir."""
    s = s.replace('I', 'ı').replace('İ', 'i').lower()
    for a, b in zip('çğıöşü', 'cgiosu'):
        s = s.replace(a, b)
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def q(v):
    if v is None or v == '':
        return 'NULL'
    if isinstance(v, int):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def num(v):
    return int(v) if str(v).strip() else None


def rows(path):
    return list(csv.DictReader(open(path, encoding='utf-8')))


today = int(time.time()) // 86400 * 86400  # güne yuvarlanmış (bkz. src/lib/server/time.ts)
out = [f'-- Otomatik üretildi: scripts/make-catalog-sql.py', 'PRAGMA foreign_keys = ON;']

for d in rows('seed/departments.hacettepe.csv'):
    out.append(
        'INSERT INTO departments (id, code, university, name_tr, name_en, faculty_tr, faculty_en) VALUES '
        f"({q(str(uuid.uuid4()))}, {q(d['code'])}, {q(UNIVERSITY)}, {q(d['name_tr'])}, {q(d['name_en'])}, "
        f"{q(d['faculty_tr'])}, {q(d['faculty_en'])}) ON CONFLICT(code) DO UPDATE SET name_tr = excluded.name_tr, "
        'name_en = excluded.name_en, faculty_tr = excluded.faculty_tr, faculty_en = excluded.faculty_en;'
    )

for path in ['seed/courses.cmp.csv', 'seed/courses.hacettepe.csv']:
    for c in rows(path):
        dep = c.get('department') or DEFAULT_DEPARTMENT
        out.append(
            'INSERT INTO courses (id, department_id, code, slug, name_tr, name_en, credits, ects, year_level, kind, '
            'prerequisites, description_tr, description_en, created_at) VALUES '
            f"({q(str(uuid.uuid4()))}, (SELECT id FROM departments WHERE code = {q(dep)}), {q(c['code'])}, "
            f"{q(fold(c['code']).replace(' ', ''))}, {q(c['name_tr'])}, {q(c['name_en'])}, {q(num(c['credits']))}, "
            f"{q(num(c['ects']))}, {q(num(c['year_level']))}, {q(KINDS.get(c['kind'].strip().lower()))}, "
            f"{q(c['prerequisites'])}, {q(c['description_tr'])}, {q(c['description_en'])}, {today}) "
            'ON CONFLICT(slug) DO NOTHING;'
        )

for i in rows('seed/instructors.sec.csv'):
    slug = fold(i['name']).replace(' ', '-')
    out.append(
        'INSERT INTO instructors (id, name, slug, status, created_at) VALUES '
        f"({q(str(uuid.uuid4()))}, {q(i['name'])}, {q(slug)}, 'approved', {today}) ON CONFLICT(slug) DO NOTHING;"
    )
    for code in filter(None, re.split(r'[;|]', i['courses'])):
        out.append(
            'INSERT OR IGNORE INTO course_instructors (course_id, instructor_id) '
            f"SELECT c.id, i.id FROM courses c, instructors i WHERE c.slug = {q(fold(code).replace(' ', ''))} "
            f'AND i.slug = {q(slug)};'
        )

print('\n'.join(out))
