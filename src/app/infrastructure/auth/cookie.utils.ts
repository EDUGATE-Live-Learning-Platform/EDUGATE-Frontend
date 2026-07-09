/**
 * Set a cookie in the document securely.
 * @param name Name of the cookie
 * @param value Token value
 * @param expiresAtIso Optional ISO string indicating absolute expiration date
 */
export function setCookie(name: string, value: string, expiresAtIso?: string): void {
  let expires = "";
  if (expiresAtIso) {
    const date = new Date(expiresAtIso);
    expires = `; expires=${date.toUTCString()}`;
  }
  // Secure flag is omitted for local development (http) unless requested, 
  // but we enforce SameSite=Strict for CSRF protection.
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Strict`;
}

/**
 * Get a cookie value by name.
 */
export function getCookie(name: string): string | null {
  const nameEQ = `${name}=`;
  const cookiesArray = document.cookie.split(';');
  for (let i = 0; i < cookiesArray.length; i++) {
    let c = cookiesArray[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
}

/**
 * Erase a cookie by name.
 */
export function eraseCookie(name: string): void {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict`;
}
