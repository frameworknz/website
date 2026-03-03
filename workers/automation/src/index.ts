/**
 * Framework Automation Worker
 *
 * Handles:
 * - Cron-triggered scheduled tasks (reminders, stats, token refresh)
 * - Queue consumer for async task processing
 */

import type { Task, TaskType } from './types'
import { handleGenerateReport } from './handlers/generate-report'
import { handleSendReport } from './handlers/send-report'
import { handleSyncZoho } from './handlers/sync-zoho'
import { handleSendNotification } from './handlers/send-notification'
import { handlePostSocial } from './handlers/post-social'
import { handleTriggerInvoice } from './handlers/trigger-invoice'
import { runWeeklyStats } from './crons/weekly-stats'
import { runDailyReminders } from './crons/daily-reminders'
import { runZohoTokenRefresh } from './crons/zoho-token-refresh'
import { runLicenceExpiryCheck } from './crons/licence-expiry'
import { runSocialContentQueue } from './crons/social-content'

export interface Env {
  DB: D1Database
  STORAGE: R2Bucket
  SESSIONS: KVNamespace
  TASK_QUEUE: Queue
  ENVIRONMENT: string
  APP_URL: string
  ZOHO_REGION: string
  ZOHO_CLIENT_ID: string
  ZOHO_CLIENT_SECRET: string
  ZOHO_REFRESH_TOKEN: string
  JWT_SECRET: string
  SENDGRID_API_KEY: string
  R2_PUBLIC_URL: string
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
  TWILIO_PHONE_NUMBER: string
}

export default {
  // Cron trigger handler
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const { cron } = event
    console.log(`Cron triggered: ${cron}`)

    ctx.waitUntil(
      (async () => {
        switch (cron) {
          case '0 6 * * 1': // Monday 6am — weekly stats
            await runWeeklyStats(env)
            break
          case '0 8 * * *': // Daily 8am — inspection reminders
            await runDailyReminders(env)
            break
          case '*/55 * * * *': // Every 55 min — Zoho token refresh
            await runZohoTokenRefresh(env)
            break
          case '0 0 1 * *': // Monthly — licence expiry check
            await runLicenceExpiryCheck(env)
            break
          case '30 17 * * 5': // Friday 5:30pm — social content queue
            await runSocialContentQueue(env)
            break
          default:
            console.warn(`Unknown cron: ${cron}`)
        }
      })()
    )
  },

  // Queue consumer
  async queue(batch: MessageBatch<Task>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await processTask(message.body, env)
        message.ack()
      } catch (err) {
        console.error(`Task failed [${message.body.type}]:`, err)
        message.retry()
      }
    }
  },

  async fetch(_request: Request, _env: Env): Promise<Response> {
    return new Response('Automation Worker', { status: 200 })
  },
}

async function processTask(task: Task, env: Env): Promise<void> {
  switch (task.type as TaskType) {
    case 'generate_report':
      await handleGenerateReport(task.payload, env)
      break
    case 'send_report':
      await handleSendReport(task.payload, env)
      break
    case 'sync_zoho_contact':
      await handleSyncZoho(task.payload, env)
      break
    case 'send_notification':
      await handleSendNotification(task.payload, env)
      break
    case 'post_social':
      await handlePostSocial(task.payload, env)
      break
    case 'trigger_invoice':
      await handleTriggerInvoice(task.payload, env)
      break
    default:
      console.warn(`Unknown task type: ${(task as Task).type}`)
  }
}
