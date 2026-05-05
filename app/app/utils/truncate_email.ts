export function truncateEmail(email: string, maxLength: number = 20): string {
  if (!email || !email.includes('@')) return email;

  const [localPart, domain] = email.split('@');

  // If it's already short enough, return as is
  if (email.length <= maxLength) return email;

  // Truncate the local part (before @)
  let truncatedLocal = localPart;

  if (localPart.length > 8) {
    truncatedLocal = localPart.slice(0, 4) + '...' + localPart.slice(-2);
  }

  const result = `${truncatedLocal}@${domain}`;

  // Final safety check
  return result.length > maxLength 
    ? `${localPart.slice(0, 3)}...@${domain}` 
    : result;
}