<form onSubmit={handleSubmit} style={{ maxWidth: "500px", display: "flex", flexDirection: "column", gap: "1rem" }}>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
    <input type="text" name="firstName" required placeholder="First Name" />
    <input type="text" name="lastName" required placeholder="Last Name" />
  </div>
  <input type="email" name="email" required placeholder="Email" />
  <input type="tel" name="phone" required placeholder="Phone" pattern="[0-9]{10,}" />
  <textarea name="experience" required placeholder="Describe your experience..."></textarea>
  <select name="availability" required>
    <option value="">Select Availability</option>
    <option value="full-time">Full Time</option>
    <option value="part-time">Part Time</option>
    <option value="contract">Contract</option>
  </select>
  <label><input type="checkbox" name="remote" /> Open to remote work</label>
  <button type="submit">Submit Application</button>
</form>