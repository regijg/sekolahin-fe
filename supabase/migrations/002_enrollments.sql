-- ============================================================
-- SEKOLAHIN — Migration 002: Enrollments
-- ============================================================

-- 1. Tabel enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
  id               SERIAL PRIMARY KEY,
  school_id        INT  NOT NULL REFERENCES public.schools(id)        ON DELETE CASCADE,
  student_id       INT  NOT NULL REFERENCES public.students(id)       ON DELETE CASCADE,
  classroom_id     INT  NOT NULL REFERENCES public.classrooms(id)     ON DELETE RESTRICT,
  academic_year_id INT  NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'graduated', 'transferred', 'dropped')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),

  -- Satu siswa hanya punya satu enrollment per tahun ajaran
  UNIQUE (student_id, academic_year_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_school_year ON public.enrollments (school_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student      ON public.enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_classroom    ON public.enrollments (classroom_id);

-- 3. Trigger: sync students.classroom_id otomatis ketika enrollment berubah
CREATE OR REPLACE FUNCTION public.sync_student_classroom()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE public.students
    SET classroom_id = NEW.classroom_id, updated_at = NOW()
    WHERE id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enrollment_sync_classroom
  AFTER INSERT OR UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.sync_student_classroom();

-- 4. Migrate data existing: enroll siswa yang sudah punya classroom_id
-- ke tahun ajaran yang sedang aktif (jika ada)
INSERT INTO public.enrollments (school_id, student_id, classroom_id, academic_year_id, status)
SELECT
  s.school_id,
  s.id,
  s.classroom_id,
  ay.id,
  'active'
FROM public.students s
JOIN public.academic_years ay
  ON ay.school_id = s.school_id AND ay.active = true
WHERE s.classroom_id IS NOT NULL
ON CONFLICT (student_id, academic_year_id) DO NOTHING;

-- 5. RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON public.enrollments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Permissions (jalankan jika sudah ada tabel permissions)
INSERT INTO public.permissions (name, description) VALUES
  ('view-enrollments',   'Lihat pendaftaran kelas'),
  ('create-enrollments', 'Tambah pendaftaran kelas'),
  ('edit-enrollments',   'Edit pendaftaran kelas'),
  ('delete-enrollments', 'Hapus pendaftaran kelas')
ON CONFLICT (name) DO NOTHING;
