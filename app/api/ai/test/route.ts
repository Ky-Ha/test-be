import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(req: Request) {
  try {
    await req.json() // keep same contract as real AI

    // Path to fake image in /public
    const imagePath = path.join(
      process.cwd(),
      'public',
      'fake-ai-result',
      // 'fake-result.png',
      'strawberry.jpg',
    )

    // Read file
    const fileBuffer = fs.readFileSync(imagePath)

    // Convert to base64
    const base64 = fileBuffer.toString('base64')

    // Add data URI prefix (IMPORTANT)
    const base64Image = `data:image/png;base64,${base64}`

    return NextResponse.json(
      {
        image: base64Image,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('[AI_GENERATE_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
