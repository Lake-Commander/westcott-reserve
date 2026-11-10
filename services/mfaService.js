import { supabase } from './supabaseClient';

export async function getTotpFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data?.totp || [];
}

export async function getVerifiedTotpFactor() {
  const factors = await getTotpFactors();
  return factors.find((factor) => factor.status === 'verified') || null;
}

export async function requiresTotpChallenge() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data.currentLevel !== 'aal2' && data.nextLevel === 'aal2';
}

export async function verifyTotpCode(factorId, code) {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });
  if (challengeError) throw challengeError;

  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: code.trim(),
  });
  if (error) throw error;
  return data;
}

export async function verifyCurrentTotpCode(code) {
  const factor = await getVerifiedTotpFactor();
  if (!factor) {
    throw new Error('No verified authenticator is linked to this account.');
  }
  return verifyTotpCode(factor.id, code);
}
