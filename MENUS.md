# Daftar Menu Sekolahin

## Utama
| Label | Route | Permission |
|-------|-------|------------|
| Dashboard | `/dashboard` | `view-dashboard` |

## Manajemen Sekolah
| Label | Route | Permission | Catatan |
|-------|-------|------------|---------|
| Sekolah | `/schools` | `view-schools` | Super Admin Only |
| Tahun Ajaran | `/academic-years` | `view-academic-years` | |
| Semester | `/semesters` | `view-semesters` | |
| Jurusan | `/majors` | `view-majors` | |
| Kelas | `/classrooms` | `view-classrooms` | |
| Pendaftaran Kelas | `/enrollments` | `view-enrollments` | |
| Mata Pelajaran | `/subjects` | `view-subjects` | |

## Sumber Daya Manusia
| Label | Route | Permission |
|-------|-------|------------|
| Guru | `/teachers` | `view-teachers` |
| Orang Tua / Wali | `/parent-guardians` | `view-parent-guardians` |
| Siswa | `/students` | `view-students` |

## Akademik
| Label | Route | Permission |
|-------|-------|------------|
| Jadwal | `/schedules` | `view-schedules` |
| Absensi Siswa | `/student-attendances` | `view-student-attendances` |
| Absensi Guru | `/teacher-attendances` | `view-teacher-attendances` |

## PPDB
| Label | Route | Permission |
|-------|-------|------------|
| Pendaftaran (PPDB) | `/ppdb-applications` | `view-ppdb-applications` |

## Komunikasi
| Label | Route | Permission |
|-------|-------|------------|
| Pengumuman | `/announcements` | `view-announcements` |
| Surat Keterangan | `/letters` | `view-letters` |

## Keuangan
| Label | Route | Permission |
|-------|-------|------------|
| Jenis Pembayaran | `/payment-types` | `view-payment-types` |
| Tagihan | `/invoices` | `view-invoices` |
| Pembayaran | `/payments` | `view-payments` |

## Inventaris
| Label | Route | Permission |
|-------|-------|------------|
| Barang Inventaris | `/inventory-items` | `view-inventory-items` |
| Mutasi Inventaris | `/inventory-mutations` | `view-inventory-mutations` |

## Kantin
| Label | Route | Permission |
|-------|-------|------------|
| Akun Kantin | `/canteen-accounts` | `view-canteen-accounts` |
| Transaksi Kantin | `/canteen-transactions` | `view-canteen-transactions` |

## Laporan
| Label | Route | Permission |
|-------|-------|------------|
| Laporan | `/reports` | `view-reports` |

### Sub-halaman Laporan
| Label | Route |
|-------|-------|
| Penerimaan | `/reports/penerimaan` |
| Kantin | `/reports/kantin` |
| Absensi Guru | `/reports/absensi-guru` |
| PPDB | `/reports/ppdb` |
| Daftar Siswa | `/reports/daftar-siswa` |
| Inventaris | `/reports/inventaris` |
| Tunggakan | `/reports/tunggakan` |
| Tagihan Siswa | `/reports/tagihan-siswa` |
| Absensi Siswa | `/reports/absensi-siswa` |

## Akses & Hak
| Label | Route | Permission | Catatan |
|-------|-------|------------|---------|
| Pengguna | `/users` | `view-users` | |
| Roles | `/roles` | `view-roles` | |
| Permissions | `/permissions` | `view-permissions` | Super Admin Only |
