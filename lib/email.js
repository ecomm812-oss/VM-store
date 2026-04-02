export async function sendLoginNotification(userEmail) {
  const ADMIN_EMAILS = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || ''
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
  const FROM_EMAIL = process.env.EMAIL_FROM || 'no-reply@vm-cart.com'

  if (!ADMIN_EMAILS) {
    console.log(`[Newsletter] Admin notifications disabled (ADMIN_EMAILS not set). User login from: ${userEmail}`)
    return
  }

  if (!SENDGRID_API_KEY) {
    console.log(`[Newsletter] SENDGRID_API_KEY not set, skipping email send. User login from: ${userEmail}`)
    return
  }

  const recipients = ADMIN_EMAILS.split(',').map((email) => email.trim()).filter(Boolean)

  if (!recipients.length) {
    console.log(`[Newsletter] No valid ADMIN_EMAILS recipients. User login from: ${userEmail}`)
    return
  }

  const body = {
    personalizations: [
      {
        to: recipients.map((email) => ({ email })),
        subject: 'User login alert',
      },
    ],
    from: { email: FROM_EMAIL },
    content: [
      {
        type: 'text/plain',
        value: `User logged in: ${userEmail} at ${new Date().toISOString()}`,
      },
    ],
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[Newsletter] SendGrid failed: ${response.status} ${response.statusText} - ${text}`)
    } else {
      console.log(`[Newsletter] Login notification sent for ${userEmail}`)
    }
  } catch (error) {
    console.error('[Newsletter] Failed to send login notification:', error)
  }
}
