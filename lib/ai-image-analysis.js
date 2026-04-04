import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY)

/**
 * Analyze an image using Google Gemini's vision capabilities
 * Returns: description, tags, quality score, flagged content
 */
export async function analyzeImage(imageBuffer, mimeType = 'image/jpeg') {
    try {
        if (!process.env.GOOGLE_AI_KEY) {
            console.warn('GOOGLE_AI_KEY not set. Image analysis skipped.')
            return {
                description: '',
                tags: [],
                quality: 0,
                contentSafe: true,
                error: 'AI API key not configured'
            }
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

        // Convert buffer to base64
        const base64Image = imageBuffer.toString('base64')

        // First prompt: Get description and object detection
        const descriptionResult = await model.generateContent([
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            },
            {
                text: `Analyze this product image and provide:
1. A concise product description (2-3 sentences)
2. Main objects/items visible
3. Color scheme
4. Image quality assessment (excellent/good/fair/poor)

Format as JSON:
{
  "description": "...",
  "objects": ["item1", "item2"],
  "colors": ["color1", "color2"],
  "quality": "excellent|good|fair|poor"
}`
            }
        ])

        let analysisData = {
            description: '',
            objects: [],
            colors: [],
            quality: 'good'
        }

        try {
            const responseText = descriptionResult.response.text()
            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                analysisData = JSON.parse(jsonMatch[0])
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError)
        }

        // Second prompt: Generate product tags/categories
        const tagsResult = await model.generateContent([
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            },
            {
                text: `Based on this product image, suggest relevant categories and tags. Return as JSON:
{
  "categories": ["category1", "category2"],
  "tags": ["tag1", "tag2", "tag3"],
  "suggestions": ["use case 1", "use case 2"]
}`
            }
        ])

        let tagsData = {
            categories: [],
            tags: [],
            suggestions: []
        }

        try {
            const responseText = tagsResult.response.text()
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                tagsData = JSON.parse(jsonMatch[0])
            }
        } catch (parseError) {
            console.error('Error parsing tags response:', parseError)
        }

        // Third prompt: Content safety check
        const safetyResult = await model.generateContent([
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            },
            {
                text: `Analyze if this image is appropriate for an e-commerce product listing. Check for:
1. Inappropriate content
2. Offensive material
3. Image clarity issues
Return as JSON:
{
  "isSafe": true|false,
  "concerns": ["concern1"],
  "recommendedAction": "approve|review|reject",
  "confidence": 0-100
}`
            }
        ])

        let safetyData = {
            isSafe: true,
            concerns: [],
            recommendedAction: 'approve',
            confidence: 95
        }

        try {
            const responseText = safetyResult.response.text()
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                safetyData = JSON.parse(jsonMatch[0])
            }
        } catch (parseError) {
            console.error('Error parsing safety response:', parseError)
        }

        return {
            success: true,
            description: analysisData.description,
            objects: analysisData.objects || [],
            colors: analysisData.colors || [],
            quality: analysisData.quality,
            categories: tagsData.categories || [],
            tags: tagsData.tags || [],
            suggestions: tagsData.suggestions || [],
            isSafe: safetyData.isSafe,
            concerns: safetyData.concerns || [],
            recommendedAction: safetyData.recommendedAction,
            confidence: safetyData.confidence
        }
    } catch (error) {
        console.error('Image analysis error:', error)
        return {
            success: false,
            description: '',
            objects: [],
            colors: [],
            quality: 'unknown',
            categories: [],
            tags: [],
            suggestions: [],
            isSafe: true,
            concerns: [],
            recommendedAction: 'review',
            error: error.message
        }
    }
}

/**
 * Validate if image analysis suggests approval
 */
export function shouldApproveImage(analysis) {
    return (
        analysis.success &&
        analysis.isSafe &&
        analysis.recommendedAction !== 'reject' &&
        analysis.quality !== 'poor'
    )
}
