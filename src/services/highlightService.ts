import OpenAI from 'openai';
import { SubtitleSegment } from '../types/video';
import { HighlightSegment } from '../types/highlight';

/**
 * AI Content Strategist - Analyzes transcriptions to find viral segments
 * and generates ready-to-use social media captions
 */
export async function analyzeHighlights(
    segments: SubtitleSegment[],
    videoDuration: number,
    apiKey: string,
    onProgress?: (progress: number) => void
): Promise<HighlightSegment[]> {
    if (!apiKey) {
        throw new Error('OpenAI API key is required');
    }

    const openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
    });

    try {
        onProgress?.(10);

        // Prepare transcript with timestamps
        const transcript = segments.map(seg => ({
            start: seg.start,
            end: seg.end,
            text: seg.text,
        }));

        console.log('🎯 Analyzing transcript for viral highlights...');
        console.log('📝 Total segments:', segments.length);
        console.log('⏱️ Video duration:', videoDuration, 'seconds');

        onProgress?.(30);

        // Create AI prompt for highlight analysis - AGGRESSIVE VERSION
        const systemPrompt = `You are a high-energy Social Media Growth Hacker. Your goal is to extract EVERY potential viral nugget from the transcript. Be aggressive. Don't look for 'perfect' segments; look for 'hooks', 'hot takes', 'emotional peaks', and 'high-retention segments'.

Requirements:
- Duration: 10-60 seconds.
- Quantity: Find at least 7-10 segments if the transcript is long enough.
- Emotional Peaks: prioritize moments with high emotional intensity or strong reactions.
- Retention: Prioritize segments that keep the viewer watching (curiosity gaps, strong hooks).
- Hooks over Logic: Prioritize segments that start with a strong statement, even if the thought isn't 'perfectly finished'.
- Curiosity Gap: It's OK if the segment leaves the user wanting more.

Output: Return ONLY a valid JSON array of objects (title, start, end, viral_score, social_caption).`;

        const userPrompt = `Analyze this video transcript and find 7-10 viral-worthy highlights (be aggressive, find as many as possible):

Video Duration: ${videoDuration} seconds

Transcript:
${transcript.map(seg => `[${seg.start.toFixed(1)}s - ${seg.end.toFixed(1)}s] ${seg.text}`).join('\n')}

Return JSON array of highlights with this exact structure:
[
  {
    "title": "Секрет быстрой верстки",
    "start": 45.2,
    "end": 68.5,
    "viral_score": 85,
    "social_caption": "🪝 Хотите верстать в 2 раза быстрее?\\n\\n📝 Этот простой трюк изменил мой подход к CSS. Теперь я экономлю часы на каждом проекте.\\n\\n🚀 Сохраните этот пост и попробуйте сегодня!\\n\\n#webdev #css #coding #frontenddeveloper #программирование"
  }
]`;

        onProgress?.(50);

        // Call OpenAI API
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.8,
            max_tokens: 2000,
        });

        onProgress?.(80);

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No response from AI');
        }

        console.log('🤖 AI Response:', content);

        // Parse JSON response
        let highlights: HighlightSegment[];
        try {
            // Remove markdown code blocks if present
            const cleanedContent = content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            highlights = JSON.parse(cleanedContent);
        } catch (parseError) {
            console.error('❌ Failed to parse AI response:', content);
            throw new Error('Invalid AI response format');
        }

        // Validate and enrich highlights
        const validatedHighlights = highlights
            .filter(h => {
                const duration = h.end - h.start;
                return duration >= 15 && duration <= 60 && h.start >= 0 && h.end <= videoDuration;
            })
            .map(h => ({
                ...h,
                duration: h.end - h.start,
            }))
            .sort((a, b) => b.viral_score - a.viral_score); // Sort by viral score

        onProgress?.(100);

        console.log('✅ Found', validatedHighlights.length, 'viral highlights');
        console.log('🏆 Top highlight:', validatedHighlights[0]?.title, `(${validatedHighlights[0]?.viral_score}/100)`);

        return validatedHighlights;

    } catch (error) {
        console.error('❌ Highlight analysis error:', error);
        throw new Error(`Failed to analyze highlights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Generate a single caption for a specific segment
 */
export async function generateCaption(
    text: string,
    apiKey: string
): Promise<string> {
    const openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
    });

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: 'You are a social media caption writer. Create engaging Instagram/TikTok captions with hook, context, CTA, and hashtags.'
            },
            {
                role: 'user',
                content: `Create a caption for this content: "${text}"`
            }
        ],
        temperature: 0.7,
        max_tokens: 300,
    });

    return response.choices[0]?.message?.content || '';
}
