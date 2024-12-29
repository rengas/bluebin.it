export function ContactForm() {
    return `
    <form name="contact" id="contactForm" class="contact-form" netlify>
      <div class="form-group">
        <label for="name">Name</label>
        <input type="text" id="name" name="name" required>
      </div>
      
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required>
      </div>
      
      <div class="form-group">
        <label for="message">Message</label>
        <textarea id="message" name="message" rows="4" required></textarea>
      </div>
      
      <button type="submit" class="submit-btn">Send Message</button>
    </form>
  `;
}