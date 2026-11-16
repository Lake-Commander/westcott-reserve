import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

export const config = {
  api: { bodyParser: { sizeLimit: '8mb' } },
};

const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const authorization = req.headers.authorization || '';
    const accessToken = authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : '';
    if (!accessToken) return json(res, 401, { error: 'Authentication is required.' });

    const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_ANON_KEY ||
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.EXPO_PUBLIC_SUPABASE_KEY;
    if (!supabaseUrl || !supabaseKey || !process.env.BLOB_READ_WRITE_TOKEN) {
      return json(res, 503, { error: 'Profile photo storage is not configured on the server.' });
    }

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
    if (userError || !userData.user) return json(res, 401, { error: 'Your session is invalid.' });

    const { base64, mimeType } = req.body || {};
    const extension = allowedTypes.get(mimeType);
    if (!extension || typeof base64 !== 'string' || !base64) {
      return json(res, 400, { error: 'Choose a JPEG, PNG, or WebP image.' });
    }

    const image = Buffer.from(base64, 'base64');
    if (!image.length || image.length > 5 * 1024 * 1024) {
      return json(res, 413, { error: 'Profile photos must be 5 MB or smaller.' });
    }

    const blob = await put(
      `profile-avatars/${userData.user.id}/${crypto.randomUUID()}.${extension}`,
      image,
      { access: 'public', contentType: mimeType, token: process.env.BLOB_READ_WRITE_TOKEN }
    );
    const { error: profileError } = await userClient
      .from('profiles')
      .update({ avatar_url: blob.url })
      .eq('id', userData.user.id);
    if (profileError) throw profileError;

    return json(res, 200, { avatarUrl: blob.url });
  } catch (error) {
    console.error('Profile avatar upload failed:', error);
    return json(res, 500, { error: error.message || 'Unable to save the profile photo.' });
  }
}
