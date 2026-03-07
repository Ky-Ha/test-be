import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import fs from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'

// Helper to save images locally
// async function debugSave(base64: string, name: string) {
//   const dir = path.join(process.cwd(), 'debug_uploads')
//   await fs.mkdir(dir, { recursive: true })
//   const data = base64.replace(/^data:image\/\w+;base64,/, '')
//   await fs.writeFile(path.join(dir, name), Buffer.from(data, 'base64'))
// }

export async function POST(req: Request) {
  try {
    const { bodyImages, itemImages, description } = await req.json()
    // const timestamp = Date.now()

    // 1. Local Debug Saving (Inputs)
    // await Promise.all([
    //   ...bodyImages.map((img: string, i: number) =>
    //     debugSave(img, `in_body_${timestamp}_${i}.png`),
    //   ),
    //   ...itemImages.map((img: string, i: number) =>
    //     debugSave(img, `in_item_${timestamp}_${i}.png`),
    //   ),
    // ])

    // 2. Call Gemini via AI SDK
    const { files } = await generateText({
      model: google("gemini-2.5-flash-image"),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Virtual Try-On Request: ${description}. Please generate a realistic image of the person wearing these items.`,
            },
            // Add body images
            ...bodyImages.map((img: string) => ({
              type: 'image' as const,
              image: img.split(',')[1], // SDK accepts base64 or URL
              mediaType: 'image/png',
            })),
            // Add item images
            ...itemImages.map((img: string) => ({
              type: 'image' as const,
              image: img.split(',')[1],
              mediaType: 'image/png',
            })),
          ],
        },
      ],
    })

    // 3. Extract the generated image from 'files'
    const generatedFile = files?.find((f) => f.mediaType.startsWith('image/'))

    if (!generatedFile) {
      throw new Error('AI did not return an image.')
    }

    // 4. Local Debug Saving (Output)
    // AI SDK returns uint8Array in 'files'
    const outputBuffer = Buffer.from(generatedFile.uint8Array)
    const outputBase64 = outputBuffer.toString('base64')
    // await fs.writeFile(
    //   path.join(process.cwd(), 'debug_uploads', `out_${timestamp}.png`),
    //   outputBuffer,
    // )

    return NextResponse.json({
      image: `data:image/png;base64,${outputBase64}`,
    })
  } catch (error: any) {
    console.error('AI SDK Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
