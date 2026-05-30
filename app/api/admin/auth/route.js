import { NextResponse } from 'next/server'
import { isAdminUser } from '@/lib/security'

export async function GET() {
  try {
    const isAdmin = await isAdminUser()
    if (!isAdmin) {
      return NextResponse.json({ isAdmin: false, message: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ isAdmin: true })
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json({ isAdmin: false, message: error.message }, { status: 500 })
  }
}
