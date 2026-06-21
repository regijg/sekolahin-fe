-- ============================================================
-- SEKOLAHIN — Migration 003: Student Grades
-- ============================================================

-- 1. Tabel student_grades
CREATE TABLE IF NOT EXISTS public.student_grades (
  id               SERIAL PRIMARY KEY,
  school_id        INT           NOT NULL REFERENCES public.schools(id)   ON DELETE CASCADE,
  student_id       INT           NOT NULL REFERENCES public.students(id)  ON DELETE CASCADE,
  subject_id       INT           NOT NULL REFERENCES public.subjects(id)  ON DELETE RESTRICT,
  semester_id      INT           NOT NULL REFERENCES public.semesters(id) ON DELETE RESTRICT,
  assignment_score NUMERIC(5,2),
  mid_exam_score   NUMERIC(5,2),
  final_exam_score NUMERIC(5,2),
  final_grade      NUMERIC(5,2),
  predicate        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (student_id, subject_id, semester_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_grades_school     ON public.student_grades (school_id);
CREATE INDEX IF NOT EXISTS idx_grades_student    ON public.student_grades (student_id);
CREATE INDEX IF NOT EXISTS idx_grades_semester   ON public.student_grades (semester_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject    ON public.student_grades (subject_id);

-- 3. Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_grades_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER grades_updated_at
  BEFORE UPDATE ON public.student_grades
  FOR EACH ROW EXECUTE FUNCTION public.update_grades_updated_at();

-- 4. RLS
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "authenticated_all" ON public.student_grades
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Permissions
INSERT INTO public.permissions (name, description) VALUES
  ('view-grades',   'Lihat nilai siswa'),
  ('create-grades', 'Tambah nilai siswa'),
  ('edit-grades',   'Edit nilai siswa'),
  ('delete-grades', 'Hapus nilai siswa')
ON CONFLICT (name) DO NOTHING;
