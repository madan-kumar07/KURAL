// ReminderManager.ts — Real browser notification reminder management

import { reminderRepository } from '../data/ReminderRepository'
import type { ReminderRecord } from '../data/ReminderRepository'
import { activityRepository } from '../data/ActivityRepository'

export interface CreateReminderParams {
  title: string
  message?: string
  triggerTime: number // Unix ms
  fileId?: string
  fileName?: string
}

export interface ReminderCreateResult {
  success: boolean
  reminder?: ReminderRecord
  notificationSupported: boolean
  notificationPermission: NotificationPermission | 'unavailable'
  message: string
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unavailable'> {
  if (!('Notification' in window)) return 'unavailable'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const result = await Notification.requestPermission()
    return result
  } catch {
    return 'denied'
  }
}

export async function createReminder(params: CreateReminderParams): Promise<ReminderCreateResult> {
  const notificationSupported = 'Notification' in window
  const permission = notificationSupported
    ? Notification.permission as NotificationPermission
    : 'unavailable' as const

  // Save to IndexedDB regardless of notification support
  const reminder = await reminderRepository.add({
    title: params.title,
    message: params.message,
    triggerTime: params.triggerTime,
    fileId: params.fileId,
    fileName: params.fileName,
  })

  // Log activity
  await activityRepository.add({
    type: 'create_reminder',
    description: `Reminder created: "${params.title}"`,
    detail: new Date(params.triggerTime).toLocaleString(),
    fileId: params.fileId,
    fileName: params.fileName,
  })

  // Schedule in-browser notification if possible
  if (notificationSupported && permission === 'granted') {
    scheduleNotification(reminder)
  }

  const triggerStr = new Date(params.triggerTime).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  const noticeMessage = !notificationSupported
    ? 'Reminder saved locally. Notifications are not supported in this browser.'
    : permission === 'denied'
    ? 'Reminder saved locally. Browser notifications are blocked — enable them in browser settings for alerts.'
    : permission === 'granted'
    ? `Reminder set for ${triggerStr}. You'll be notified when this browser tab is open.`
    : `Reminder saved for ${triggerStr}. Enable notifications for browser alerts.`

  return {
    success: true,
    reminder,
    notificationSupported,
    notificationPermission: permission,
    message: noticeMessage,
  }
}

function scheduleNotification(reminder: ReminderRecord): void {
  const delay = reminder.triggerTime - Date.now()
  if (delay <= 0) return
  // Browser timeout — only works if tab stays open
  // For a real PWA you'd use a Service Worker with Push API
  setTimeout(async () => {
    try {
      const updated = await reminderRepository.getAll()
      const r = updated.find(x => x.id === reminder.id)
      if (r && !r.fired) {
        new Notification(r.title, {
          body: r.message || r.title,
          icon: '/kural-icon.svg',
          tag: r.id,
        })
        await reminderRepository.markFired(r.id)
      }
    } catch {
      // Notification may fail silently
    }
  }, Math.min(delay, 2_147_483_647)) // setTimeout max ~24.8 days
}
