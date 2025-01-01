import { hasStoredConsent, storeConsent, getStoredEmail } from '../services/storage/consent';

export function createConsentSection() {
    // Don't show consent form if already consented
    if (hasStoredConsent()) {
        return '';
    }

    return `
    <div class="consent-form">
      <div class="form-group">
        <input 
          type="email" 
          id="consentEmail" 
          placeholder="Enter your email"
          value="${getStoredEmail() || ''}"
          class="consent-email"
        />
      </div>
        <div id="emailError" class="error-message"> Email is required</div>
      <div class="consent-checkbox">
        <input type="checkbox" id="consentCheckbox" />
        <label for="consentCheckbox">
          I consent to Bluebinit storing and using this image to improve the AI model's ability to identify recyclable items.
          
        </label>
      </div>
    </div>
  `;
}

export function setupConsentHandlers(feedbackButtons) {
    // If already consented, enable buttons immediately
    if (hasStoredConsent()) {
        feedbackButtons.forEach(btn => btn.disabled = false);
        return;
    }

    const consentCheckbox = document.getElementById('consentCheckbox');
    const emailInput = document.getElementById('consentEmail');
    const emailError = document.getElementById('emailError');

    if (!consentCheckbox || !emailInput) return;

    function validateForm() {
        const isChecked = consentCheckbox.checked;
        const email = emailInput.value.trim();

        if (!email) {
            document.querySelector("." + "error-message").style.display = "block";
            emailError.textContent = 'Email is required';
            return false;
        }

        emailError.style.display="none"
        emailError.textContent = '';
        return isChecked && email;
    }

    function updateButtons() {
        const isValid = validateForm();
        feedbackButtons.forEach(btn => btn.disabled = !isValid);

        if (isValid) {
            storeConsent(emailInput.value.trim());
        }
    }

    consentCheckbox.addEventListener('change', updateButtons);
    emailInput.addEventListener('input', updateButtons);
}