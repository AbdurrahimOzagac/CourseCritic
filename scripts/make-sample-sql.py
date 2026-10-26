"""Yerel geliştirme için örnek veri üretir: seed/*.sample.csv + rastgele örnek değerlendirmeler.

Kullanım: python3 scripts/make-sample-sql.py > seed/sample.sql && npm run db:seed:local
Bu veriler SADECE yerel geliştirme içindir. Gerçek dersler admin panelinden CSV ile yüklenir.
"""
import csv, random, re, unicodedata, uuid

random.seed(42)

def fold(s):
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

def uid(name):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, 'coursecritic-sample:' + name))

out = ['-- Otomatik üretildi: scripts/make-sample-sql.py. SADECE yerel geliştirme için örnek veri.', 'PRAGMA foreign_keys = ON;']
dep = uid('dep')
out.append(f"INSERT OR IGNORE INTO departments (id, code, university, name_tr, name_en) VALUES ({q(dep)}, 'HU-BBM', 'Hacettepe Üniversitesi', 'Bilgisayar Mühendisliği', 'Computer Engineering');")
dep_sel = "(SELECT id FROM departments WHERE code = 'HU-BBM')"

courses = list(csv.DictReader(open('seed/courses.sample.csv', encoding='utf-8')))
kinds = {'zorunlu': 'compulsory', 'seçmeli': 'elective'}
for c in courses:
    cid = uid('course:' + c['code'])
    slug = fold(c['code']).replace(' ', '')
    out.append(
        'INSERT OR IGNORE INTO courses (id, department_id, code, slug, name_tr, name_en, credits, ects, year_level, kind, prerequisites) VALUES '
        f"({q(cid)}, {dep_sel}, {q(c['code'])}, {q(slug)}, {q(c['name_tr'])}, {q(c['name_en'])}, {int(c['credits'])}, {int(c['ects'])}, {int(c['year_level'])}, {q(kinds.get(c['kind']))}, {q(c['prerequisites'])});"
    )

instructors = list(csv.DictReader(open('seed/instructors.sample.csv', encoding='utf-8')))
links = []
for i in instructors:
    iid = uid('instructor:' + i['name'])
    out.append(
        f"INSERT OR IGNORE INTO instructors (id, title, name, slug, status) VALUES ({q(iid)}, {q(i['title'])}, {q(i['name'])}, {q(fold(i['name']).replace(' ', '-'))}, 'approved');"
    )
    for code in i['courses'].split(';'):
        links.append((uid('course:' + code.strip()), iid))
        out.append(f"INSERT OR IGNORE INTO course_instructors (course_id, instructor_id) VALUES ({q(uid('course:' + code.strip()))}, {q(iid)});")

users = [uid(f'user:{n}') for n in range(12)]
for n, u in enumerate(users):
    out.append(f"INSERT OR IGNORE INTO users (id, email_hash, role) VALUES ({q(u)}, {q('sample-hash-' + str(n))}, 'user');")

comments = [
    'Hoca konuyu çok net anlatıyor, slaytlar yeterli. Ödevler uzun ama öğretici.',
    'İlk dönem almayın, ikinci sınıfta daha rahat geçiyor.',
    'Projeler çok zaman alıyor ama gerçek hayatta en çok işime yarayan ders oldu.',
    'Sınavlar derste anlatılandan zor, geçmiş yılların sorularına mutlaka bakın.',
    'Hoca çok yardımsever, ofis saatlerinde her soruyu cevaplıyor.',
    'Ders büyük ölçüde Türkçe işleniyor, kaynaklar İngilizce.',
    'Yoklama yok ama derse gitmeden geçmek zor.',
    None, None, None,
]
for (cid, iid) in links:
    for n in random.sample(range(len(users)), random.randint(0, 6)):
        year = random.choice([2022, 2023, 2024, 2025])
        term = random.choice(['fall', 'spring'])
        base = random.randint(2, 6)
        r = lambda: max(1, min(7, base + random.randint(-2, 2)))
        rid = uid(f'review:{cid}:{iid}:{n}')
        out.append(
            'INSERT OR IGNORE INTO reviews (id, user_id, course_id, instructor_id, academic_year, term, difficulty, workload, teaching_value, '
            'instructor_clarity, instructor_attitude, instructor_expertise, attempts, outcome, class_average, curve, comment) VALUES '
            f"({q(rid)}, {q(users[n])}, {q(cid)}, {q(iid)}, {year}, {q(term)}, {r()}, {r()}, {r()}, {r()}, {r()}, {r()}, "
            f"{q(random.choice([None, 1, 1, 2]))}, {q(random.choice([None, 'passed', 'passed', 'failed', 'dropped']))}, "
            f"{q(random.choice([None, 45, 55, 62]))}, {q(random.choice([None, 'yes', 'no']))}, {q(random.choice(comments))});"
        )

print('\n'.join(out))
