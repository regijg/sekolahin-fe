'use client'

import { use } from 'react'
import RoleFormPage from '../../_components/RoleFormPage'

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <RoleFormPage roleId={Number(id)} />
}
