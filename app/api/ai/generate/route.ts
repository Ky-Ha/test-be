import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'
import { doesUserBuyApp } from '@/actions/users/get-user-paid'
import { db } from '@/lib/db'
import {
  generationResults,
  users,
  errorGenerationRequests,
} from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  // 1. Initialize variables outside the try block for the catch block to access
  let requestData: {
    bodyImages?: string[]
    itemImages?: string[]
    description?: string
  } = {}
  let userId: string | undefined

  try {
    requestData = await req.json()
    const { bodyImages, itemImages, description } = requestData

    const { isPaid, isFreeGeneration, currentUser } = await doesUserBuyApp()
    userId = currentUser?.id

    // Check authorization
    if (!currentUser || !userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check credits
    if (!isPaid && !isFreeGeneration) {
      return NextResponse.json(
        { success: true, needToBuy: true },
        { status: 201 },
      )
    }

    // 2. AI Generation Call
    const { files } = await generateText({
      model: google('gemini-2.5-flash-image'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Virtual Try-On Task: ${description}. 
              CRITICAL INSTRUCTION: You must strictly RETAIN the exact face, identity, and body shape of the person in the provided body image. 
              Only modify the clothing to match the provided item images. 
              Do not alter the person's features, ethnicity, or background. 
              The goal is a realistic composite where the person is now wearing the new items.`,
            },
            ...(bodyImages?.map((img: string) => ({
              type: 'image' as const,
              image: img.split(',')[1] || img,
              mediaType: 'image/png',
            })) || []),
            ...(itemImages?.map((img: string) => ({
              type: 'image' as const,
              image: img.split(',')[1] || img,
              mediaType: 'image/png',
            })) || []),
          ],
        },
      ],
    })

    const generatedFile = files?.find((f) => f.mediaType.startsWith('image/'))

    if (!generatedFile) {
      throw new Error('AI did not return an image.')
    }

    const outputBuffer = Buffer.from(generatedFile.uint8Array)
    const outputBase64 = outputBuffer.toString('base64')
    const resultImagebase64 = `data:image/png;base64,${outputBase64}`

    // 3. Log Success to DB
    await db.insert(generationResults).values({
      userId: userId, // TypeScript is happy now because of the !userId check above
      bodyImageBase64: bodyImages ? JSON.stringify(bodyImages) : null,
      itemImageBase64: itemImages ? JSON.stringify(itemImages) : null,
      resultImagebase64,
      description: description || '',
      isFreeGeneration: !isPaid,
    })

    // 4. Update Free Usage
    if (!isPaid && isFreeGeneration) {
      await db
        .update(users)
        .set({ freeGenerationUsed: true })
        .where(eq(users.id, userId))
    }

    return NextResponse.json({ image: resultImagebase64 })
  } catch (error: any) {
    console.error('AI SDK Error:', error)

    // 5. Log Error to DB
    // We only log if we have a userId to reference
    if (userId) {
      try {
        await db.insert(errorGenerationRequests).values({
          userId: userId,
          bodyImageBase64: requestData.bodyImages
            ? JSON.stringify(requestData.bodyImages)
            : null,
          itemImageBase64: requestData.itemImages
            ? JSON.stringify(requestData.itemImages)
            : null,
          description: requestData.description || null,
          error: error.message || 'Unknown generation error',
        })
      } catch (dbError) {
        console.error(
          'Failed to log error to errorGenerationRequests table:',
          dbError,
        )
      }
    }

    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 },
    )
  }
}
