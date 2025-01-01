// Constants
const CONSENT_KEY = 'recycling-consent';
const EMAIL_KEY = 'recycling-email';

export function hasStoredConsent() {
    return localStorage.getItem(CONSENT_KEY) === 'true';
}

export function getStoredEmail() {
    return localStorage.getItem(EMAIL_KEY);
}

export function storeConsent(email) {
    localStorage.setItem(CONSENT_KEY, 'true');
    localStorage.setItem(EMAIL_KEY, email);
}

export function clearConsent() {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(EMAIL_KEY);
}