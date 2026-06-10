'use client'

import { useState, useEffect } from 'react'
import { getSchoolId } from '@/lib/auth'

export function useSchoolId(): number | null {
  const [schoolId, setSchoolId] = useState<number | null>(null)
  useEffect(() => {
    setSchoolId(getSchoolId())
  }, [])
  return schoolId
}
