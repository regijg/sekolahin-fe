'use client'

import { use } from 'react'
import UserFormPage from '../../_components/UserFormPage'

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <UserFormPage userId={Number(id)} />
}
