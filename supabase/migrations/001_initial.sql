-- ============================================================
-- SEKOLAHIN — Initial Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Schools
CREATE TABLE IF NOT EXISTS public.schools (
  id            SERIAL PRIMARY KEY,
  name          TEXT    NOT NULL,
  npsn          TEXT    NOT NULL,
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  logo          TEXT,
  principal_name TEXT,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Permissions (global)
CREATE TABLE IF NOT EXISTS public.permissions (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Roles
CREATE TABLE IF NOT EXISTS public.roles (
  id          SERIAL PRIMARY KEY,
  school_id   INT REFERENCES public.schools(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Role-Permission junction
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id       INT NOT NULL REFERENCES public.roles(id)       ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 5. Academic Years
CREATE TABLE IF NOT EXISTS public.academic_years (
  id         SERIAL PRIMARY KEY,
  school_id  INT  NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  active     BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Semesters
CREATE TABLE IF NOT EXISTS public.semesters (
  id               SERIAL PRIMARY KEY,
  school_id        INT  NOT NULL REFERENCES public.schools(id)        ON DELETE CASCADE,
  academic_year_id INT  NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  active           BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Majors
CREATE TABLE IF NOT EXISTS public.majors (
  id         SERIAL PRIMARY KEY,
  school_id  INT  NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id         SERIAL PRIMARY KEY,
  school_id  INT  NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Teachers
CREATE TABLE IF NOT EXISTS public.teachers (
  id         SERIAL PRIMARY KEY,
  school_id  INT  NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  nip        TEXT NOT NULL,
  name       TEXT NOT NULL,
  gender     TEXT,
  birthdate  DATE,
  address    TEXT,
  phone      TEXT,
  photo      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Classrooms
CREATE TABLE IF NOT EXISTS public.classrooms (
  id                  SERIAL PRIMARY KEY,
  school_id           INT  NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  grade               TEXT,
  homeroom_teacher_id INT  REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Parent Guardians
CREATE TABLE IF NOT EXISTS public.parent_guardians (
  id         SERIAL PRIMARY KEY,
  school_id  INT  NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  address    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Students
CREATE TABLE IF NOT EXISTS public.students (
  id                 SERIAL PRIMARY KEY,
  school_id          INT  NOT NULL REFERENCES public.schools(id)          ON DELETE CASCADE,
  nis                TEXT NOT NULL,
  nisn               TEXT NOT NULL,
  name               TEXT NOT NULL,
  gender             TEXT,
  birthdate          DATE,
  address            TEXT,
  classroom_id       INT  REFERENCES public.classrooms(id)       ON DELETE SET NULL,
  parent_guardian_id INT  REFERENCES public.parent_guardians(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Schedules
CREATE TABLE IF NOT EXISTS public.schedules (
  id           SERIAL PRIMARY KEY,
  school_id    INT  NOT NULL REFERENCES public.schools(id)    ON DELETE CASCADE,
  classroom_id INT  NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  subject_id   INT  NOT NULL REFERENCES public.subjects(id)   ON DELETE CASCADE,
  teacher_id   INT  NOT NULL REFERENCES public.teachers(id)   ON DELETE CASCADE,
  day          TEXT NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Student Attendances
CREATE TABLE IF NOT EXISTS public.student_attendances (
  id         SERIAL PRIMARY KEY,
  school_id  INT  NOT NULL REFERENCES public.schools(id)  ON DELETE CASCADE,
  student_id INT  NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'sick', 'permission')),
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, student_id, date)
);

-- 15. Teacher Attendances
CREATE TABLE IF NOT EXISTS public.teacher_attendances (
  id           SERIAL PRIMARY KEY,
  school_id    INT  NOT NULL REFERENCES public.schools(id)  ON DELETE CASCADE,
  teacher_id   INT  NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  check_in_at  TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  status       TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'sick', 'permission')),
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 16. PPDB Applications
CREATE TABLE IF NOT EXISTS public.ppdb_applications (
  id                  SERIAL PRIMARY KEY,
  school_id           INT  NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL,
  name                TEXT NOT NULL,
  gender              TEXT,
  birthdate           DATE,
  address             TEXT,
  phone               TEXT,
  email               TEXT,
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected')),
  guardian_name       TEXT,
  guardian_phone      TEXT,
  guardian_relation   TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id           SERIAL PRIMARY KEY,
  school_id    INT  NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Letters
CREATE TABLE IF NOT EXISTS public.letters (
  id         SERIAL PRIMARY KEY,
  school_id  INT  NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  number     TEXT NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  issued_at  DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Payment Types
CREATE TABLE IF NOT EXISTS public.payment_types (
  id          SERIAL PRIMARY KEY,
  school_id   INT  NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id               SERIAL PRIMARY KEY,
  school_id        INT           NOT NULL REFERENCES public.schools(id)        ON DELETE CASCADE,
  student_id       INT           NOT NULL REFERENCES public.students(id)       ON DELETE CASCADE,
  payment_type_id  INT           NOT NULL REFERENCES public.payment_types(id)  ON DELETE CASCADE,
  month            INT           NOT NULL,
  year             INT           NOT NULL,
  amount           NUMERIC(15,2) NOT NULL DEFAULT 0,
  late_fee         NUMERIC(15,2) DEFAULT 0,
  due_date         DATE,
  status           TEXT          NOT NULL DEFAULT 'belum_lunas' CHECK (status IN ('belum_lunas', 'lunas', 'cicilan')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id             SERIAL PRIMARY KEY,
  school_id      INT           NOT NULL REFERENCES public.schools(id)  ON DELETE CASCADE,
  invoice_id     INT           NOT NULL REFERENCES public.invoices(id)  ON DELETE CASCADE,
  date           DATE          NOT NULL,
  amount         NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_method TEXT          NOT NULL,
  receipt_path   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Inventory Items
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id         SERIAL PRIMARY KEY,
  school_id  INT  NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  category   TEXT NOT NULL,
  name       TEXT NOT NULL,
  quantity   INT  NOT NULL DEFAULT 0,
  condition  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Inventory Mutations
CREATE TABLE IF NOT EXISTS public.inventory_mutations (
  id                SERIAL PRIMARY KEY,
  school_id         INT  NOT NULL REFERENCES public.schools(id)         ON DELETE CASCADE,
  inventory_item_id INT  NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('in', 'out')),
  quantity          INT  NOT NULL,
  note              TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Canteen Accounts
CREATE TABLE IF NOT EXISTS public.canteen_accounts (
  id         SERIAL PRIMARY KEY,
  school_id  INT           NOT NULL REFERENCES public.schools(id)  ON DELETE CASCADE,
  student_id INT           NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  balance    NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Canteen Transactions
CREATE TABLE IF NOT EXISTS public.canteen_transactions (
  id                 SERIAL PRIMARY KEY,
  school_id          INT           NOT NULL REFERENCES public.schools(id)           ON DELETE CASCADE,
  canteen_account_id INT           NOT NULL REFERENCES public.canteen_accounts(id)  ON DELETE CASCADE,
  amount             NUMERIC(15,2) NOT NULL,
  type               TEXT          NOT NULL CHECK (type IN ('debit', 'credit')),
  status             TEXT          NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'failed')),
  description        TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 26. Profiles (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         SERIAL PRIMARY KEY,
  user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id  INT  REFERENCES public.schools(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL DEFAULT '',
  role_id    INT  REFERENCES public.roles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Trigger: auto-create profile on new auth user ───────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.schools              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majors               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_guardians     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppdb_applications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_types        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_mutations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canteen_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canteen_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;

-- Authenticated users: full access (school_id filtering done at app level)
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'schools','permissions','roles','role_permissions','academic_years',
    'semesters','majors','subjects','teachers','classrooms','parent_guardians',
    'students','schedules','student_attendances','teacher_attendances',
    'ppdb_applications','announcements','letters','payment_types','invoices',
    'payments','inventory_items','inventory_mutations','canteen_accounts',
    'canteen_transactions'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE POLICY "authenticated_all" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;

-- Profiles: users can read all, update own, service_role manages all
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO service_role USING (true);

-- ─── Seed: Default Permissions ───────────────────────────────────────────────
-- Uncomment and run after creating the schema if you want default permissions

/*
INSERT INTO public.permissions (name, description) VALUES
  ('view-dashboard',           'Lihat dashboard'),
  ('view-schools',             'Lihat sekolah'),      ('create-schools',   'Tambah sekolah'),   ('edit-schools',   'Edit sekolah'),   ('delete-schools',   'Hapus sekolah'),
  ('view-academic-years',      'Lihat tahun ajaran'), ('create-academic-years', 'Tambah'),       ('edit-academic-years', 'Edit'),       ('delete-academic-years', 'Hapus'),
  ('view-semesters',           'Lihat semester'),     ('create-semesters', 'Tambah'),            ('edit-semesters', 'Edit'),            ('delete-semesters', 'Hapus'),
  ('view-majors',              'Lihat jurusan'),      ('create-majors',    'Tambah'),            ('edit-majors',    'Edit'),            ('delete-majors',    'Hapus'),
  ('view-classrooms',          'Lihat kelas'),        ('create-classrooms','Tambah'),            ('edit-classrooms','Edit'),            ('delete-classrooms','Hapus'),
  ('view-subjects',            'Lihat mapel'),        ('create-subjects',  'Tambah'),            ('edit-subjects',  'Edit'),            ('delete-subjects',  'Hapus'),
  ('view-teachers',            'Lihat guru'),         ('create-teachers',  'Tambah'),            ('edit-teachers',  'Edit'),            ('delete-teachers',  'Hapus'),
  ('view-parent-guardians',    'Lihat wali'),         ('create-parent-guardians','Tambah'),      ('edit-parent-guardians','Edit'),      ('delete-parent-guardians','Hapus'),
  ('view-students',            'Lihat siswa'),        ('create-students',  'Tambah'),            ('edit-students',  'Edit'),            ('delete-students',  'Hapus'),
  ('view-schedules',           'Lihat jadwal'),       ('create-schedules', 'Tambah'),            ('edit-schedules', 'Edit'),            ('delete-schedules', 'Hapus'),
  ('view-student-attendances', 'Lihat absensi siswa'),('create-student-attendances','Tambah'),  ('edit-student-attendances','Edit'),  ('delete-student-attendances','Hapus'),
  ('view-teacher-attendances', 'Lihat absensi guru'), ('create-teacher-attendances','Tambah'),  ('edit-teacher-attendances','Edit'),  ('delete-teacher-attendances','Hapus'),
  ('view-ppdb-applications',   'Lihat PPDB'),         ('create-ppdb','Tambah'),                  ('edit-ppdb','Edit'),                  ('delete-ppdb','Hapus'),
  ('view-announcements',       'Lihat pengumuman'),   ('create-announcements','Tambah'),         ('edit-announcements','Edit'),         ('delete-announcements','Hapus'),
  ('view-letters',             'Lihat surat'),        ('create-letters','Tambah'),               ('edit-letters','Edit'),               ('delete-letters','Hapus'),
  ('view-payment-types',       'Lihat jenis bayar'),  ('create-payment-types','Tambah'),         ('edit-payment-types','Edit'),         ('delete-payment-types','Hapus'),
  ('view-invoices',            'Lihat tagihan'),      ('create-invoices','Tambah'),              ('edit-invoices','Edit'),              ('delete-invoices','Hapus'),
  ('view-payments',            'Lihat pembayaran'),   ('create-payments','Tambah'),              ('edit-payments','Edit'),              ('delete-payments','Hapus'),
  ('view-inventory-items',     'Lihat inventaris'),   ('create-inventory-items','Tambah'),       ('edit-inventory-items','Edit'),       ('delete-inventory-items','Hapus'),
  ('view-inventory-mutations', 'Lihat mutasi'),       ('create-inventory-mutations','Tambah'),  ('edit-inventory-mutations','Edit'),  ('delete-inventory-mutations','Hapus'),
  ('view-canteen-accounts',    'Lihat akun kantin'),  ('create-canteen-accounts','Tambah'),      ('edit-canteen-accounts','Edit'),      ('delete-canteen-accounts','Hapus'),
  ('view-canteen-transactions','Lihat transaksi'),    ('create-canteen-transactions','Tambah'), ('edit-canteen-transactions','Edit'), ('delete-canteen-transactions','Hapus'),
  ('view-users',               'Lihat pengguna'),     ('create-users','Tambah'),                 ('edit-users','Edit'),                 ('delete-users','Hapus'),
  ('view-roles',               'Lihat roles'),        ('create-roles','Tambah'),                 ('edit-roles','Edit'),                 ('delete-roles','Hapus'),
  ('view-reports',             'Lihat laporan')
ON CONFLICT (name) DO NOTHING;
*/
