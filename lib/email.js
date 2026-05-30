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

/**
 * Send order status update notification to customer
 */
export async function sendOrderStatusNotification(order) {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
  const FROM_EMAIL = process.env.EMAIL_FROM || 'no-reply@vm-cart.com'

  if (!SENDGRID_API_KEY) {
    console.log('[OrderEmail] SENDGRID_API_KEY not set, skipping order status email')
    return
  }

  if (!order || !order.user || !order.user.email) {
    console.warn('[OrderEmail] Missing order or customer email')
    return
  }

  // Format status with friendly names
  const statusMessages = {
    ORDER_PLACED: 'Your order has been placed successfully!',
    PROCESSING: 'We are processing your order.',
    SHIPPED: 'Your order has been shipped!',
    DELIVERED: 'Your order has been delivered!',
    CANCELLED: 'Your order has been cancelled.'
  }

  const statusMessage = statusMessages[order.status] || `Your order status has been updated to ${order.status}`
  const statusColor = order.status === 'DELIVERED' ? '#22c55e' : order.status === 'CANCELLED' ? '#ef4444' : '#3b82f6'

  // Build product list HTML
  const productsHTML = order.orderItems
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 10px; text-align: left;">${item.product?.name || 'Product'}</td>
      <td style="padding: 10px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; text-align: right;">₹${item.price.toFixed(2)}</td>
      <td style="padding: 10px; text-align: right;">₹${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `
    )
    .join('')

  // Build email HTML
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Order Status Update</h1>
      </div>

      <!-- Main Content -->
      <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Status Badge -->
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="background: ${statusColor}; color: white; padding: 12px 20px; border-radius: 20px; display: inline-block; font-weight: bold;">
            ${order.status.replace(/_/g, ' ')}
          </div>
        </div>

        <!-- Greeting -->
        <p style="margin: 0 0 15px 0; font-size: 16px; color: #374151;">
          Hi <strong>${order.user.name}</strong>,
        </p>

        <!-- Status Message -->
        <p style="margin: 0 0 20px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
          ${statusMessage}
        </p>

        <!-- Order Details -->
        <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;"><strong>Order ID:</strong> ${order.id}</p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        </div>

        <!-- Products Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left; font-weight: bold; color: #374151;">Product</th>
              <th style="padding: 10px; text-align: center; font-weight: bold; color: #374151;">Qty</th>
              <th style="padding: 10px; text-align: right; font-weight: bold; color: #374151;">Price</th>
              <th style="padding: 10px; text-align: right; font-weight: bold; color: #374151;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${productsHTML}
          </tbody>
        </table>

        <!-- Price Summary -->
        <div style="border-top: 2px solid #e5e7eb; padding-top: 15px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280;">Subtotal:</span>
            <span style="color: #374151; font-weight: bold;">₹${(order.total - (order.discount || 0)).toFixed(2)}</span>
          </div>
          ${order.discount ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #22c55e;">
            <span>Discount:</span>
            <span>-₹${order.discount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #667eea;">
            <span>Total:</span>
            <span>₹${order.total.toFixed(2)}</span>
          </div>
        </div>

        <!-- Delivery Address -->
        ${order.address ? `
        <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #374151;">Delivery Address:</p>
          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
            ${order.address.street}<br>
            ${order.address.city}, ${order.address.state} ${order.address.zip}<br>
            ${order.address.country}<br>
            <strong>Phone:</strong> ${order.address.phone}
          </p>
        </div>
        ` : ''}

        <!-- Tracking Info -->
        ${order.trackingNumber || order.tracking ? `
        <div style="background: #eff6ff; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e40af;">📦 Tracking Information</p>
          ${order.trackingNumber ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #1e3a8a;"><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
          ${order.currentLocation ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #1e3a8a;"><strong>Current Location:</strong> ${order.currentLocation}</p>` : ''}
          ${order.estimatedDelivery ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #1e3a8a;"><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString()}</p>` : ''}
          ${order.trackingUrl ? `<p style="margin: 0; font-size: 14px;"><a href="${order.trackingUrl}" style="color: #3b82f6; text-decoration: none; font-weight: bold;">Track your package →</a></p>` : ''}
        </div>
        ` : ''}

        <!-- Footer -->
        <p style="margin: 20px 0 0 0; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #9ca3af; text-align: center;">
          If you have any questions, please contact our support team.
        </p>
      </div>
    </div>
  `

  const body = {
    personalizations: [
      {
        to: [{ email: order.user.email, name: order.user.name }],
        subject: `Order ${order.status.replace(/_/g, ' ')} - Order #${order.id.substring(0, 8).toUpperCase()}`,
      },
    ],
    from: { email: FROM_EMAIL },
    content: [
      {
        type: 'text/html',
        value: htmlContent,
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
      console.error(`[OrderEmail] SendGrid failed: ${response.status} ${response.statusText} - ${text}`)
    } else {
      console.log(`[OrderEmail] Order status notification sent to ${order.user.email}`)
    }
  } catch (error) {
    console.error('[OrderEmail] Failed to send order status notification:', error)
  }
}
