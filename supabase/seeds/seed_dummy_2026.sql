-- ============================================================
-- SEKOLAHIN — Dummy Seed Data
-- Tahun Ajaran 2026/2027 | SMP | 45 Siswa
-- Jalankan di Supabase SQL Editor (setelah 001 & 002 migrations)
-- ============================================================

-- ─── RESET: Bersihkan semua data & restart sequence ke 1 ─────
-- ⚠️  Ini akan menghapus SEMUA data di tabel-tabel berikut!
TRUNCATE TABLE
  public.student_grades,
  public.payments,
  public.invoices,
  public.payment_types,
  public.student_attendances,
  public.teacher_attendances,
  public.schedules,
  public.enrollments,
  public.students,
  public.parent_guardians,
  public.classrooms,
  public.teachers,
  public.subjects,
  public.majors,
  public.semesters,
  public.academic_years,
  public.schools
RESTART IDENTITY CASCADE;

-- ─── 0. Tabel Nilai (belum ada di schema — tambahkan dulu) ────
CREATE TABLE IF NOT EXISTS public.student_grades (
  id               SERIAL PRIMARY KEY,
  school_id        INT           NOT NULL REFERENCES public.schools(id)   ON DELETE CASCADE,
  student_id       INT           NOT NULL REFERENCES public.students(id)  ON DELETE CASCADE,
  subject_id       INT           NOT NULL REFERENCES public.subjects(id)  ON DELETE CASCADE,
  semester_id      INT           NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
  assignment_score NUMERIC(5,2),
  mid_exam_score   NUMERIC(5,2),
  final_exam_score NUMERIC(5,2),
  final_grade      NUMERIC(5,2),
  predicate        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, subject_id, semester_id)
);

ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'student_grades' AND policyname = 'authenticated_all'
  ) THEN
    EXECUTE 'CREATE POLICY "authenticated_all" ON public.student_grades FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;


-- ─── 1. SEKOLAH ───────────────────────────────────────────────
INSERT INTO public.schools (id, name, npsn, address, phone, email, principal_name, active) VALUES
(1, 'SMP Negeri 1 Sekolahan', '20123456', 'Jl. Pendidikan No. 1, Bandung Utara', '021-1234567', 'smpn1sekolahan@edu.id', 'Drs. Dadang Santoso, M.Pd.', true)
ON CONFLICT (id) DO NOTHING;


-- ─── 2. TAHUN AJARAN ──────────────────────────────────────────
INSERT INTO public.academic_years (id, school_id, name, start_date, end_date, active) VALUES
(1, 1, '2026/2027', '2026-07-15', '2027-06-30', true)
ON CONFLICT (id) DO NOTHING;


-- ─── 3. SEMESTER ──────────────────────────────────────────────
INSERT INTO public.semesters (id, school_id, academic_year_id, name, active) VALUES
(1, 1, 1, 'Semester 1', true),
(2, 1, 1, 'Semester 2', false)
ON CONFLICT (id) DO NOTHING;


-- ─── 4. MATA PELAJARAN ────────────────────────────────────────
INSERT INTO public.subjects (id, school_id, code, name) VALUES
(1,  1, 'MTK',  'Matematika'),
(2,  1, 'BIND', 'Bahasa Indonesia'),
(3,  1, 'BING', 'Bahasa Inggris'),
(4,  1, 'IPA',  'Ilmu Pengetahuan Alam'),
(5,  1, 'IPS',  'Ilmu Pengetahuan Sosial'),
(6,  1, 'PKN',  'Pendidikan Kewarganegaraan'),
(7,  1, 'PAI',  'Pendidikan Agama Islam'),
(8,  1, 'PJOK', 'Pendidikan Jasmani'),
(9,  1, 'SBK',  'Seni Budaya'),
(10, 1, 'INF',  'Informatika')
ON CONFLICT (id) DO NOTHING;


-- ─── 5. GURU ─────────────────────────────────────────────────
INSERT INTO public.teachers (id, school_id, nip, name, gender, birthdate, phone) VALUES
(1, 1, '198501012010011001', 'Dewi Rahmawati, S.Pd.',      'P', '1985-01-01', '081200000001'),
(2, 1, '197803152005012002', 'Agus Prasetyo, S.Pd.',        'L', '1978-03-15', '081200000002'),
(3, 1, '198912202015031003', 'Sari Indah Lestari, S.Pd.',   'P', '1989-12-20', '081200000003'),
(4, 1, '197601102003011004', 'Muhammad Fauzi, M.Pd.',       'L', '1976-01-10', '081200000004'),
(5, 1, '199003052018031005', 'Rini Susanti, S.Pd.',         'P', '1990-03-05', '081200000005'),
(6, 1, '198208222008011006', 'Hendra Wijaya, S.Pd.',        'L', '1982-08-22', '081200000006')
ON CONFLICT (id) DO NOTHING;


-- ─── 6. KELAS ─────────────────────────────────────────────────
INSERT INTO public.classrooms (id, school_id, name, grade, homeroom_teacher_id) VALUES
(1, 1, 'Kelas 7A', '7', 1),
(2, 1, 'Kelas 8A', '8', 2),
(3, 1, 'Kelas 9A', '9', 3)
ON CONFLICT (id) DO NOTHING;


-- ─── 7. WALI MURID ────────────────────────────────────────────
INSERT INTO public.parent_guardians (id, school_id, name, phone, address) VALUES
-- Wali murid kelas 7A (id 1–15)
(1,  1, 'Suparman',       '081311110001', 'Jl. Melati No. 1, Bandung'),
(2,  1, 'Siti Rahmah',    '081311110002', 'Jl. Melati No. 2, Bandung'),
(3,  1, 'Hartono',        '081311110003', 'Jl. Melati No. 3, Bandung'),
(4,  1, 'Wati Anggraini', '081311110004', 'Jl. Melati No. 4, Bandung'),
(5,  1, 'Bambang Permana','081311110005', 'Jl. Melati No. 5, Bandung'),
(6,  1, 'Sri Dewi',       '081311110006', 'Jl. Melati No. 6, Bandung'),
(7,  1, 'Joko Pratama',   '081311110007', 'Jl. Melati No. 7, Bandung'),
(8,  1, 'Eni Rahayu',     '081311110008', 'Jl. Melati No. 8, Bandung'),
(9,  1, 'Sutarno',        '081311110009', 'Jl. Melati No. 9, Bandung'),
(10, 1, 'Marni Safitri',  '081311110010', 'Jl. Melati No. 10, Bandung'),
(11, 1, 'Tatang Nugroho',   '081311110011', 'Jl. Melati No. 11, Bandung'),
(12, 1, 'Yuli Handayani', '081311110012', 'Jl. Melati No. 12, Bandung'),
(13, 1, 'Hasan Ramadan',  '081311110013', 'Jl. Melati No. 13, Bandung'),
(14, 1, 'Tutik Cahyani',  '081311110014', 'Jl. Melati No. 14, Bandung'),
(15, 1, 'Wahyu Kusuma',   '081311110015', 'Jl. Melati No. 15, Bandung'),
-- Wali murid kelas 8A (id 16–30)
(16, 1, 'Agung Saputra',  '081311110016', 'Jl. Mawar No. 1, Bandung'),
(17, 1, 'Rina Permata',   '081311110017', 'Jl. Mawar No. 2, Bandung'),
(18, 1, 'Ridwan Maulana', '081311110018', 'Jl. Mawar No. 3, Bandung'),
(19, 1, 'Lina Kusuma',    '081311110019', 'Jl. Mawar No. 4, Bandung'),
(20, 1, 'Sugeng Purnomo', '081311110020', 'Jl. Mawar No. 5, Bandung'),
(21, 1, 'Ani Wulandari',  '081311110021', 'Jl. Mawar No. 6, Bandung'),
(22, 1, 'Denny Pratama',  '081311110022', 'Jl. Mawar No. 7, Bandung'),
(23, 1, 'Wulan Sari',     '081311110023', 'Jl. Mawar No. 8, Bandung'),
(24, 1, 'Santoso',        '081311110024', 'Jl. Mawar No. 9, Bandung'),
(25, 1, 'Ika Rahmawati',  '081311110025', 'Jl. Mawar No. 10, Bandung'),
(26, 1, 'Arif Ardiansyah','081311110026', 'Jl. Mawar No. 11, Bandung'),
(27, 1, 'Yani Indah',     '081311110027', 'Jl. Mawar No. 12, Bandung'),
(28, 1, 'Zulkifli',       '081311110028', 'Jl. Mawar No. 13, Bandung'),
(29, 1, 'Dewi Fitria',    '081311110029', 'Jl. Mawar No. 14, Bandung'),
(30, 1, 'Firmansyah',     '081311110030', 'Jl. Mawar No. 15, Bandung'),
-- Wali murid kelas 9A (id 31–45)
(31, 1, 'Teguh Wijaya',   '081311110031', 'Jl. Kenanga No. 1, Bandung'),
(32, 1, 'Susi Ayu',       '081311110032', 'Jl. Kenanga No. 2, Bandung'),
(33, 1, 'Maulana',        '081311110033', 'Jl. Kenanga No. 3, Bandung'),
(34, 1, 'Ratna Dewi',     '081311110034', 'Jl. Kenanga No. 4, Bandung'),
(35, 1, 'Eko Aditya',     '081311110035', 'Jl. Kenanga No. 5, Bandung'),
(36, 1, 'Fitri',          '081311110036', 'Jl. Kenanga No. 6, Bandung'),
(37, 1, 'Permana Sr.',    '081311110037', 'Jl. Kenanga No. 7, Bandung'),
(38, 1, 'Rahayu',         '081311110038', 'Jl. Kenanga No. 8, Bandung'),
(39, 1, 'Hidayat',        '081311110039', 'Jl. Kenanga No. 9, Bandung'),
(40, 1, 'Salmah',         '081311110040', 'Jl. Kenanga No. 10, Bandung'),
(41, 1, 'Suryanto',       '081311110041', 'Jl. Kenanga No. 11, Bandung'),
(42, 1, 'Vera',           '081311110042', 'Jl. Kenanga No. 12, Bandung'),
(43, 1, 'Prasetyo',       '081311110043', 'Jl. Kenanga No. 13, Bandung'),
(44, 1, 'Setiawati',      '081311110044', 'Jl. Kenanga No. 14, Bandung'),
(45, 1, 'Tono Santoso',   '081311110045', 'Jl. Kenanga No. 15, Bandung')
ON CONFLICT (id) DO NOTHING;


-- ─── 8. SISWA ─────────────────────────────────────────────────
-- Kelas 7A (classroom_id=1, id 1–15, lahir 2013)
INSERT INTO public.students (id, school_id, nis, nisn, name, gender, birthdate, classroom_id, parent_guardian_id) VALUES
(1,  1, '267001', '10267001', 'Ahmad Fauzan',       'L', '2013-03-15', 1, 1),
(2,  1, '267002', '10267002', 'Aisyah Putri',        'P', '2013-05-22', 1, 2),
(3,  1, '267003', '10267003', 'Tatang Setiawan',       'L', '2013-07-08', 1, 3),
(4,  1, '267004', '10267004', 'Bunga Anggraini',     'P', '2013-02-14', 1, 4),
(5,  1, '267005', '10267005', 'Chandra Permana',     'L', '2013-11-30', 1, 5),
(6,  1, '267006', '10267006', 'Citra Dewi',          'P', '2013-08-17', 1, 6),
(7,  1, '267007', '10267007', 'Dimas Pratama',       'L', '2013-04-25', 1, 7),
(8,  1, '267008', '10267008', 'Dina Rahayu',         'P', '2013-09-12', 1, 8),
(9,  1, '267009', '10267009', 'Eko Wahyudi',         'L', '2013-01-06', 1, 9),
(10, 1, '267010', '10267010', 'Erlin Safitri',       'P', '2013-06-20', 1, 10),
(11, 1, '267011', '10267011', 'Fajar Nugroho',       'L', '2013-10-03', 1, 11),
(12, 1, '267012', '10267012', 'Fitri Handayani',     'P', '2013-12-28', 1, 12),
(13, 1, '267013', '10267013', 'Gilang Ramadan',      'L', '2013-09-01', 1, 13),
(14, 1, '267014', '10267014', 'Gita Cahyani',        'P', '2013-04-11', 1, 14),
(15, 1, '267015', '10267015', 'Hendra Kusuma',       'L', '2013-07-19', 1, 15),
-- Kelas 8A (classroom_id=2, id 16–30, lahir 2012)
(16, 1, '268016', '10268016', 'Handoko Saputra',     'L', '2012-02-10', 2, 16),
(17, 1, '268017', '10268017', 'Hana Permata',        'P', '2012-06-18', 2, 17),
(18, 1, '268018', '10268018', 'Irwan Maulana',       'L', '2012-03-25', 2, 18),
(19, 1, '268019', '10268019', 'Intan Kusuma',        'P', '2012-08-07', 2, 19),
(20, 1, '268020', '10268020', 'Joko Purnomo',        'L', '2012-11-14', 2, 20),
(21, 1, '268021', '10268021', 'Jasmine Wulandari',   'P', '2012-01-29', 2, 21),
(22, 1, '268022', '10268022', 'Kevin Pratama',       'L', '2012-05-05', 2, 22),
(23, 1, '268023', '10268023', 'Kirana Sari',         'P', '2012-09-22', 2, 23),
(24, 1, '268024', '10268024', 'Luki Santoso',        'L', '2012-04-16', 2, 24),
(25, 1, '268025', '10268025', 'Layla Rahmawati',     'P', '2012-12-03', 2, 25),
(26, 1, '268026', '10268026', 'Miko Ardiansyah',     'L', '2012-07-27', 2, 26),
(27, 1, '268027', '10268027', 'Maya Indah',          'P', '2012-03-08', 2, 27),
(28, 1, '268028', '10268028', 'Naufal Rahman',       'L', '2012-10-11', 2, 28),
(29, 1, '268029', '10268029', 'Nadya Fitria',        'P', '2012-02-23', 2, 29),
(30, 1, '268030', '10268030', 'Oki Firmansyah',      'L', '2012-06-30', 2, 30),
-- Kelas 9A (classroom_id=3, id 31–45, lahir 2011)
(31, 1, '269031', '10269031', 'Pandu Wijaya',        'L', '2011-01-17', 3, 31),
(32, 1, '269032', '10269032', 'Putri Ayu',           'P', '2011-05-04', 3, 32),
(33, 1, '269033', '10269033', 'Qodri Maulana',       'L', '2011-08-21', 3, 33),
(34, 1, '269034', '10269034', 'Riana Dewi',          'P', '2011-03-13', 3, 34),
(35, 1, '269035', '10269035', 'Rizky Aditya',        'L', '2011-11-09', 3, 35),
(36, 1, '269036', '10269036', 'Salma Fitria',        'P', '2011-07-26', 3, 36),
(37, 1, '269037', '10269037', 'Sandi Permana',       'L', '2011-04-02', 3, 37),
(38, 1, '269038', '10269038', 'Tika Rahayu',         'P', '2011-09-15', 3, 38),
(39, 1, '269039', '10269039', 'Taufik Hidayat',      'L', '2011-02-28', 3, 39),
(40, 1, '269040', '10269040', 'Ulfa Sari',           'P', '2011-06-07', 3, 40),
(41, 1, '269041', '10269041', 'Udi Suryanto',        'L', '2011-10-24', 3, 41),
(42, 1, '269042', '10269042', 'Vera Wulandari',      'P', '2011-01-31', 3, 42),
(43, 1, '269043', '10269043', 'Vicky Prasetyo',      'L', '2011-12-16', 3, 43),
(44, 1, '269044', '10269044', 'Wini Setiawati',      'P', '2011-05-19', 3, 44),
(45, 1, '269045', '10269045', 'Yoga Santoso',        'L', '2011-08-08', 3, 45)
ON CONFLICT (id) DO NOTHING;


-- ─── 9. ENROLLMENTS ───────────────────────────────────────────
INSERT INTO public.enrollments (school_id, student_id, classroom_id, academic_year_id, status)
SELECT
  1,
  s.id,
  s.classroom_id,
  1,
  'active'
FROM public.students s
WHERE s.school_id = 1
ON CONFLICT (student_id, academic_year_id) DO NOTHING;


-- ─── 10. ABSENSI SISWA (Agustus 2026, 21 hari sekolah) ───────
-- Strategi: ROW_NUMBER PARTITION per siswa → rank 1-21 per siswa
-- Status di-assign berdasarkan rank, bukan modulo hari
-- GARANSI: setiap siswa TEPAT 21 baris, tidak bisa lebih tidak bisa kurang
--
-- Distribusi berdasarkan (id % 3):
--   id%3=0 → 4 sakit + 1 izin + 1 terlambat + 1 alpha + 14 hadir = 21
--   id%3=1 → 3 sakit + 1 izin + 1 terlambat + 1 alpha + 15 hadir = 21
--   id%3=2 → 2 sakit + 1 izin + 1 terlambat + 1 alpha + 16 hadir = 21
--
-- DELETE digabung ke dalam CTE → satu blok, tidak bisa dipisah

WITH _clean AS (
  DELETE FROM public.student_attendances WHERE school_id = 1
)
INSERT INTO public.student_attendances (school_id, student_id, date, status, note)
SELECT
  1,
  student_id,
  dt,
  CASE
    WHEN rnk <= sick_count                     THEN 'sick'
    WHEN rnk =  sick_count + 1                 THEN 'permission'
    WHEN rnk =  sick_count + 2                 THEN 'late'
    WHEN rnk =  sick_count + 3                 THEN 'absent'
    ELSE 'present'
  END,
  CASE
    WHEN rnk <= sick_count THEN
      CASE (student_id + rnk) % 3
        WHEN 0 THEN 'Demam'
        WHEN 1 THEN 'Flu'
        ELSE       'Sakit kepala'
      END
    WHEN rnk = sick_count + 1 THEN
      CASE student_id % 2
        WHEN 0 THEN 'Keperluan keluarga'
        ELSE       'Acara keluarga'
      END
    ELSE NULL
  END
FROM (
  SELECT
    s.id                                          AS student_id,
    d.dt,
    -- hash unik per (siswa, hari): mod 211 (prima > 21) → tidak repeat dalam 21 langkah
    ROW_NUMBER() OVER (
      PARTITION BY s.id
      ORDER BY (s.id * 31 + d.day_idx * 37) % 211
    )                                             AS rnk,
    CASE s.id % 3 WHEN 0 THEN 4 WHEN 1 THEN 3 ELSE 2 END AS sick_count
  FROM public.students s
  CROSS JOIN (
    SELECT
      gs::date                          AS dt,
      ROW_NUMBER() OVER (ORDER BY gs)   AS day_idx
    FROM generate_series('2026-08-01'::date, '2026-08-31'::date, '1 day') gs
    WHERE EXTRACT(DOW FROM gs) BETWEEN 1 AND 5
  ) d
  WHERE s.school_id = 1
) ranked;


-- ─── 11. JENIS PEMBAYARAN ─────────────────────────────────────
INSERT INTO public.payment_types (id, school_id, code, name, description, is_periodic) VALUES
(1, 1, 'SPP',     'SPP Bulanan',     'Sumbangan Pembinaan Pendidikan per bulan', true),
(2, 1, 'SERAGAM', 'Seragam Sekolah', 'Pembelian seragam tahun ajaran baru',      false),
(3, 1, 'OSIS',    'Iuran OSIS',      'Iuran kegiatan OSIS per semester',         true)
ON CONFLICT (id) DO NOTHING;


-- ─── 12. INVOICE SPP (45 siswa × bulan 7–12 tahun 2026) ───────
INSERT INTO public.invoices (school_id, student_id, payment_type_id, month, year, amount, due_date, status)
SELECT
  1,
  s.id,
  1,
  m.bulan,
  2026,
  350000,
  make_date(2026, m.bulan, 10),
  CASE
    WHEN m.bulan <= 9                              THEN 'lunas'
    WHEN m.bulan = 10 AND s.id % 6 = 0            THEN 'belum_lunas'
    WHEN m.bulan = 10                              THEN 'lunas'
    WHEN m.bulan = 11 AND s.id % 4 = 0            THEN 'cicilan'
    WHEN m.bulan = 11 AND s.id % 4 != 0           THEN 'belum_lunas'
    ELSE 'belum_lunas'
  END
FROM public.students s
CROSS JOIN (SELECT generate_series(7, 12) AS bulan) m
WHERE s.school_id = 1;

-- Invoice Seragam: kelas 7A saja (Juli 2026)
INSERT INTO public.invoices (school_id, student_id, payment_type_id, month, year, amount, due_date, status)
SELECT
  1,
  s.id,
  2,
  7,
  2026,
  500000,
  '2026-08-31',
  CASE
    WHEN s.id % 5 = 0 THEN 'cicilan'
    WHEN s.id % 7 = 0 THEN 'belum_lunas'
    ELSE 'lunas'
  END
FROM public.students s
WHERE s.school_id = 1 AND s.classroom_id = 1;

-- Invoice OSIS: semua siswa (Oktober 2026)
INSERT INTO public.invoices (school_id, student_id, payment_type_id, month, year, amount, due_date, status)
SELECT
  1,
  s.id,
  3,
  10,
  2026,
  100000,
  '2026-10-31',
  CASE WHEN s.id % 5 = 0 THEN 'belum_lunas' ELSE 'lunas' END
FROM public.students s
WHERE s.school_id = 1;


-- ─── 13. PEMBAYARAN (untuk semua invoice berstatus 'lunas') ───
INSERT INTO public.payments (school_id, invoice_id, date, amount, payment_method)
SELECT
  i.school_id,
  i.id,
  make_date(i.year, i.month, 5 + (i.student_id % 5)),
  i.amount,
  CASE i.student_id % 3
    WHEN 0 THEN 'transfer'
    WHEN 1 THEN 'tunai'
    ELSE        'qris'
  END
FROM public.invoices i
WHERE i.status = 'lunas'
  AND i.school_id = 1;

-- Pembayaran cicilan (sebagian dari invoice 'cicilan')
INSERT INTO public.payments (school_id, invoice_id, date, amount, payment_method)
SELECT
  i.school_id,
  i.id,
  make_date(i.year, i.month, 3),
  ROUND(i.amount * 0.5),
  'transfer'
FROM public.invoices i
WHERE i.status = 'cicilan'
  AND i.school_id = 1;


-- ─── 14. NILAI SISWA (Semester 1, semua mapel) ────────────────
-- Skor bervariasi berdasarkan ID siswa & mata pelajaran (deterministik)
INSERT INTO public.student_grades
  (school_id, student_id, subject_id, semester_id,
   assignment_score, mid_exam_score, final_exam_score,
   final_grade, predicate)
SELECT
  1,
  s.id,
  sub.id,
  1,
  -- Tugas: 65–94
  LEAST(100, 65 + ((s.id * 7 + sub.id * 3) % 30))::numeric(5,2) AS assignment_score,
  -- UTS: 60–94
  LEAST(100, 60 + ((s.id * 5 + sub.id * 11) % 35))::numeric(5,2) AS mid_exam_score,
  -- UAS: 63–94
  LEAST(100, 63 + ((s.id * 9 + sub.id * 7)  % 32))::numeric(5,2) AS final_exam_score,
  -- Nilai Akhir = Tugas 30% + UTS 30% + UAS 40%
  ROUND(
    (LEAST(100, 65 + ((s.id * 7 + sub.id * 3) % 30)) * 0.30 +
     LEAST(100, 60 + ((s.id * 5 + sub.id * 11) % 35)) * 0.30 +
     LEAST(100, 63 + ((s.id * 9 + sub.id * 7)  % 32)) * 0.40)::numeric,
    2
  ) AS final_grade,
  -- Predikat
  CASE
    WHEN (LEAST(100, 65 + ((s.id * 7 + sub.id * 3) % 30)) * 0.30 +
          LEAST(100, 60 + ((s.id * 5 + sub.id * 11) % 35)) * 0.30 +
          LEAST(100, 63 + ((s.id * 9 + sub.id * 7)  % 32)) * 0.40) >= 90 THEN 'A'
    WHEN (LEAST(100, 65 + ((s.id * 7 + sub.id * 3) % 30)) * 0.30 +
          LEAST(100, 60 + ((s.id * 5 + sub.id * 11) % 35)) * 0.30 +
          LEAST(100, 63 + ((s.id * 9 + sub.id * 7)  % 32)) * 0.40) >= 75 THEN 'B'
    WHEN (LEAST(100, 65 + ((s.id * 7 + sub.id * 3) % 30)) * 0.30 +
          LEAST(100, 60 + ((s.id * 5 + sub.id * 11) % 35)) * 0.30 +
          LEAST(100, 63 + ((s.id * 9 + sub.id * 7)  % 32)) * 0.40) >= 60 THEN 'C'
    ELSE 'D'
  END AS predicate
FROM public.students s
CROSS JOIN public.subjects sub
WHERE s.school_id = 1 AND sub.school_id = 1
ON CONFLICT (student_id, subject_id, semester_id) DO NOTHING;


-- ─── 15. RESET SEQUENCES ──────────────────────────────────────
SELECT setval('public.schools_id_seq',              (SELECT MAX(id) FROM public.schools));
SELECT setval('public.academic_years_id_seq',        (SELECT MAX(id) FROM public.academic_years));
SELECT setval('public.semesters_id_seq',             (SELECT MAX(id) FROM public.semesters));
SELECT setval('public.subjects_id_seq',              (SELECT MAX(id) FROM public.subjects));
SELECT setval('public.teachers_id_seq',              (SELECT MAX(id) FROM public.teachers));
SELECT setval('public.classrooms_id_seq',            (SELECT MAX(id) FROM public.classrooms));
SELECT setval('public.parent_guardians_id_seq',      (SELECT MAX(id) FROM public.parent_guardians));
SELECT setval('public.students_id_seq',              (SELECT MAX(id) FROM public.students));
SELECT setval('public.enrollments_id_seq',           (SELECT MAX(id) FROM public.enrollments));
SELECT setval('public.payment_types_id_seq',         (SELECT MAX(id) FROM public.payment_types));
SELECT setval('public.invoices_id_seq',              (SELECT MAX(id) FROM public.invoices));
SELECT setval('public.payments_id_seq',              (SELECT MAX(id) FROM public.payments));
SELECT setval('public.student_attendances_id_seq',   (SELECT MAX(id) FROM public.student_attendances));
SELECT setval('public.student_grades_id_seq',        (SELECT MAX(id) FROM public.student_grades));
