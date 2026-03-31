import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Task, TimeBlock, Schedule, WorkStyle } from '@/types'

export function getGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey)
}

const WORK_STYLE_PROMPTS: Record<WorkStyle, string> = {
  flow: '- Use extended focus blocks: 45-minute focus sessions with 15-minute breaks\n- After every 3 focus blocks, add a 30-minute long break',
  balanced: '- Use classic Pomodoro technique: 25-minute focus blocks with 5-minute breaks\n- After every 4 Pomodoros, add a 15-minute long break',
  sprint: '- Use high-intensity sprint blocks: 50-minute focus sessions with 10-minute breaks\n- After every 4 sprint blocks, add a 20-minute long break',
}

export async function generateSchedule(
  apiKey: string,
  model: string,
  tasks: Task[],
  endOfDay: string,
  bufferPercent: number,
  startTime?: string,
  workStyle: WorkStyle = 'balanced',
  taskSpreadEnabled: boolean = false,
): Promise<Schedule> {
  const ai = getGeminiClient(apiKey)
  const genModel = ai.getGenerativeModel({ model })

  const pendingTasks = tasks.filter(t => t.status !== 'finished')
  const now = new Date()
  const currentTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const startFrom = startTime || currentTimeStr

  const spreadInstruction = taskSpreadEnabled
    ? '- Alternate tasks from different categories where possible to provide variety'
    : ''

  const prompt = `You are an AI productivity scheduler. Given the following tasks, create an optimal daily schedule.

Tasks (JSON):
${JSON.stringify(pendingTasks.map(t => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    timeEstimate: t.timeEstimate || 30,
    category: t.category,
  })), null, 2)}

Constraints:
- Start scheduling from: ${startFrom}
- Working hours end at: ${endOfDay}
- Buffer percentage between tasks: ${bufferPercent}%
- Schedule higher priority tasks first
- Add a "buffer" block between high-priority tasks
${WORK_STYLE_PROMPTS[workStyle]}
${spreadInstruction}

Return ONLY a JSON object with this exact structure (no markdown, no code blocks):
{
  "blocks": [
    {
      "id": "unique-id",
      "taskId": "task-id-if-applicable",
      "title": "Block Title",
      "type": "task|break|buffer|lunch",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "duration": 30,
      "locked": false
    }
  ],
  "backlog": [
    {
      "task": { "id": "task-id", "title": "Task Title" },
      "reason": "Why it didn't fit"
    }
  ]
}

Current time is ${currentTimeStr}.`

  try {
    const result = await genModel.generateContent(prompt)
    const text = result.response.text()
    // Extract JSON from response, handling potential markdown wrapping
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in AI response')

    const parsed = JSON.parse(jsonMatch[0])

    const today = now.toISOString().split('T')[0]

    return {
      date: today,
      blocks: parsed.blocks || [],
      backlog: parsed.backlog || [],
      workStyle,
      startTime: startFrom,
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('AI Schedule generation failed:', error)
    throw new Error('Failed to generate schedule. Check your API key and try again.')
  }
}
