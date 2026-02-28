import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  console.log('Received request ')
  try {
    const body = await req.json()
    const { bodyImages, itemImages, description } = body

    const data = { ok: true }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[RECENT_TRANSACTIONS_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
