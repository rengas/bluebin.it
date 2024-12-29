export function ContactForm() {
    return `
    <form 
      name="contact" 
      method="POST" 
      netlify
      class="contact-form"
      data-netlify="true"
    >
      <input type="hidden" name="form-name" value="contact" />
      
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