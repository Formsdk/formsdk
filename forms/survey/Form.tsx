<form onSubmit={handleSubmit} style={{ maxWidth: "500px", display: "flex", flexDirection: "column", gap: "1rem" }}>
  <input type="text" name="name" required placeholder="Your name" />
  <input type="email" name="email" required placeholder="Email" />
  <div>
    <label className="block text-sm font-medium mb-2">Rating (1-5)</label>
    <div style={{ display: "flex", gap: "0.5rem" }}>
      {[1,2,3,4,5].map(r => (
        <label key={r} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <input type="radio" name="rating" value={r} required /> {r}
        </label>
      ))}
    </div>
  </div>
  <textarea name="feedback" required placeholder="Your feedback..."></textarea>
  <button type="submit">Submit Survey</button>
</form>