const MAX_RECIPIENTS = 500;
const EMAIL_BATCH_SIZE = 50;

function jsonResponse(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function validUuid(value) {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function supabaseHeaders(key) {
  return { apikey: key, Authorization: `Bearer ${key}` };
}

async function writeAudit(serviceKey, actorId, action, details) {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/admin_audit_log`,
    {
      method: 'POST',
      headers: {
        ...supabaseHeaders(serviceKey),
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        actor_id: actorId,
        action,
        entity_type: 'email',
        details,
      }),
    }
  );
  if (!response.ok) throw new Error('Audit log write failed.');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return jsonResponse(res, 405, { error: 'Method not allowed.' });
  }

  const { EXPO_PUBLIC_SUPABASE_URL: supabaseUrl, EXPO_PUBLIC_SUPABASE_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey, BREVO_API_KEY: brevoKey,
    BREVO_SENDER_EMAIL: senderEmail, BREVO_SENDER_NAME: senderName } = process.env;
  if (!supabaseUrl || !anonKey || !serviceKey || !brevoKey || !senderEmail || !senderName) {
    return jsonResponse(res, 503, { error: 'Email service is not configured on the server.' });
  }

  const authorization = req.headers.authorization || '';
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) return jsonResponse(res, 401, { error: 'Sign-in is required.' });

  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${tokenMatch[1]}` },
    });
    if (!authResponse.ok) return jsonResponse(res, 401, { error: 'Admin session is invalid.' });
    const actor = await authResponse.json();
    if (!validUuid(actor.id)) return jsonResponse(res, 401, { error: 'Admin session is invalid.' });

    const adminResponse = await fetch(
      `${supabaseUrl}/rest/v1/admin_users?select=user_id&user_id=eq.${actor.id}`,
      { headers: supabaseHeaders(serviceKey) }
    );
    if (!adminResponse.ok) {
      return jsonResponse(res, 503, { error: 'Unable to verify admin permissions.' });
    }
    const admins = await adminResponse.json();
    if (!admins.some((admin) => admin.user_id === actor.id)) {
      return jsonResponse(res, 403, { error: 'Admin access required.' });
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!payload || !['support_reply', 'notification', 'transfer_restriction'].includes(payload.type)) {
      return jsonResponse(res, 400, { error: 'Unsupported email request.' });
    }

    let subject;
    let textContent;
    let recipients;
    let replyToEmail = process.env.BREVO_REPLY_TO_EMAIL || 'support@westcottreserve.com';
    if (payload.type === 'support_reply') {
      if (!validUuid(payload.messageId)) {
        return jsonResponse(res, 400, { error: 'A valid support message is required.' });
      }
      const messageResponse = await fetch(
        `${supabaseUrl}/rest/v1/customer_care_messages?select=id,user_id,subject,admin_reply&id=eq.${payload.messageId}`,
        { headers: supabaseHeaders(serviceKey) }
      );
      if (!messageResponse.ok) throw new Error('Unable to load the support reply.');
      const messages = await messageResponse.json();
      const message = messages[0];
      if (!message?.admin_reply || !validUuid(message.user_id)) {
        return jsonResponse(res, 409, { error: 'Save a reply before sending its email.' });
      }
      const customerResponse = await fetch(
        `${supabaseUrl}/auth/v1/admin/users/${message.user_id}`,
        { headers: supabaseHeaders(serviceKey) }
      );
      if (!customerResponse.ok) throw new Error('Unable to load the customer email address.');
      const customer = await customerResponse.json();
      if (!customer.email) {
        return jsonResponse(res, 409, { error: 'This customer has no email address on file.' });
      }
      recipients = [{ email: customer.email }];
      subject = `Re: ${message.subject}`;
      textContent = `Hello,\n\n${message.admin_reply}\n\nWestcott Reserve Support`;
    } else if (payload.type === 'transfer_restriction') {
      if (!validUuid(payload.audienceUserId)) {
        return jsonResponse(res, 400, { error: 'A valid account is required.' });
      }
      const restrictionResponse = await fetch(
        `${supabaseUrl}/rest/v1/account_transfer_restrictions?select=user_id&user_id=eq.${payload.audienceUserId}`,
        { headers: supabaseHeaders(serviceKey) }
      );
      if (!restrictionResponse.ok) throw new Error('Unable to verify the transfer restriction.');
      const restrictions = await restrictionResponse.json();
      if (restrictions.length === 0) {
        return jsonResponse(res, 409, { error: 'This account does not currently have a transfer restriction.' });
      }
      const profileResponse = await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=email,name&id=eq.${payload.audienceUserId}`,
        { headers: supabaseHeaders(serviceKey) }
      );
      if (!profileResponse.ok) throw new Error('Unable to load the account email address.');
      const profiles = await profileResponse.json();
      const customer = profiles[0];
      if (!customer?.email) {
        return jsonResponse(res, 409, { error: 'This account has no email address on file.' });
      }
      recipients = [{ email: customer.email }];
      subject = 'Outgoing transfers temporarily unavailable';
      textContent =
        `Hello${customer.name ? ` ${customer.name}` : ''},\n\n` +
        'Outgoing transfers on your account are currently unavailable. Transfers submitted while this restriction is active will not be processed.\n\n' +
        'Please contact support@westcott.com for assistance. Do not retry the transfer until you have spoken with customer support.\n\n' +
        'Westcott Reserve';
      replyToEmail = 'support@westcott.com';
    } else {
      const title = typeof payload.title === 'string' ? payload.title.trim() : '';
      const message = typeof payload.message === 'string' ? payload.message.trim() : '';
      if (title.length < 1 || title.length > 160 || message.length < 1 || message.length > 5000) {
        return jsonResponse(res, 400, { error: 'Notification title or message is invalid.' });
      }
      let recipientResponse;
      if (payload.audienceUserId === 'all') {
        recipientResponse = await fetch(
          `${supabaseUrl}/rest/v1/profiles?select=email&limit=${MAX_RECIPIENTS + 1}`,
          { headers: supabaseHeaders(serviceKey) }
        );
      } else if (validUuid(payload.audienceUserId)) {
        recipientResponse = await fetch(
          `${supabaseUrl}/rest/v1/profiles?select=email&id=eq.${payload.audienceUserId}`,
          { headers: supabaseHeaders(serviceKey) }
        );
      } else {
        return jsonResponse(res, 400, { error: 'A valid notification audience is required.' });
      }
      if (!recipientResponse.ok) throw new Error('Unable to load notification recipients.');
      const profiles = await recipientResponse.json();
      const uniqueEmails = [...new Set(profiles.map((profile) => profile.email).filter(Boolean))];
      if (uniqueEmails.length === 0) {
        return jsonResponse(res, 409, { error: 'There are no email recipients for this notification.' });
      }
      if (uniqueEmails.length > MAX_RECIPIENTS) {
        return jsonResponse(res, 413, { error: `Email broadcasts are limited to ${MAX_RECIPIENTS} accounts.` });
      }
      recipients = uniqueEmails.map((email) => ({ email }));
      subject = title;
      textContent = `${message}\n\nThis notification does not change account or transaction records.\nWestcott Reserve`;
    }

    let emailsSent = 0;
    for (let offset = 0; offset < recipients.length; offset += EMAIL_BATCH_SIZE) {
      const batch = recipients.slice(offset, offset + EMAIL_BATCH_SIZE);
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': brevoKey, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          sender: { email: senderEmail, name: senderName },
          replyTo: {
            email: replyToEmail,
            name: 'Westcott Reserve Support',
          },
          to: batch,
          subject,
          textContent,
          htmlContent: `<p>${escapeHtml(textContent).replace(/\n/g, '<br>')}</p>`,
        }),
      });
      if (!brevoResponse.ok) {
        await writeAudit(serviceKey, actor.id, 'email_notification_failed', {
          type: payload.type,
          recipient_count: recipients.length,
          accepted_count: emailsSent,
        });
        const detail = emailsSent
          ? `Brevo accepted ${emailsSent} of ${recipients.length} emails before a later batch failed.`
          : 'Brevo did not accept the email. Check server configuration and try again.';
        return jsonResponse(res, 502, { error: detail });
      }
      emailsSent += batch.length;
    }

    try {
      await writeAudit(serviceKey, actor.id, 'email_notification_sent', {
        type: payload.type,
        recipient_count: recipients.length,
      });
    } catch (error) {
      return jsonResponse(res, 502, {
        error: 'Brevo accepted the email, but the audit log could not be written. Check Brevo before retrying.',
      });
    }

    return jsonResponse(res, 200, { sent: recipients.length });
  } catch (error) {
    console.error('Admin email request failed:', error.message);
    return jsonResponse(res, 500, { error: 'Unable to complete the email request.' });
  }
};
