import type { Env } from '../index'

export async function runSocialContentQueue(env: Env): Promise<void> {
  // Query this week's stats for social content
  const stats = await env.DB.prepare(`
    SELECT
      COUNT(DISTINCT i.id) as inspection_count,
      COUNT(DISTINCT CASE WHEN i.overall_result = 'pass' THEN i.id END) as pass_count,
      COUNT(DISTINCT p.id) as project_count
    FROM inspections i
    JOIN projects p ON i.project_id = p.id
    WHERE i.conducted_date >= datetime('now', '-7 days')
  `).first() as { inspection_count: number; pass_count: number; project_count: number } | null

  if (!stats || stats.inspection_count === 0) return

  const passRate = stats.inspection_count > 0
    ? Math.round((stats.pass_count / stats.inspection_count) * 100)
    : 0

  const posts = [
    {
      platforms: ['linkedin', 'facebook'],
      content: `This week our Qualified Persons completed ${stats.inspection_count} building inspections across ${stats.project_count} projects, achieving a ${passRate}% pass rate. 🏗️\n\nBuilding compliance done right, every time.\n\n#BuildingCompliance #NZBuilding #QualifiedPerson #NZBC`,
    },
    {
      platforms: ['instagram'],
      content: `${stats.inspection_count} inspections. ${passRate}% pass rate. ${stats.project_count} projects. This is what building safety looks like. 📋✅\n\n#FrameworkNZ #BuildingCompliance #QualifiedInspector`,
    },
  ]

  const baseTime = Date.now() + 60 * 60 * 1000 // 1 hour from now

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    if (!post) continue
    await env.TASK_QUEUE.send({
      type: 'post_social',
      payload: {
        content: post.content,
        platforms: post.platforms,
        scheduledTime: new Date(baseTime + i * 30 * 60 * 1000).toISOString(),
      },
    })
  }

  console.log(`Social content queue filled: ${posts.length} posts scheduled`)
}
