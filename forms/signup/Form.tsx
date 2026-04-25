<form onSubmit={handleSubmit} style={{ maxWidth: "400px", display: "flex", flexDirection: "column", gap: "1rem" }}>
  <input type="text" name="name" required placeholder="Full Name" minLength={2} />
  <input type="email" name="email" required placeholder="Email" />
  <input type="password" name="password" required placeholder="Password (min 8 chars)" minLength={8} />
  <button type="submit">Create Account</button>
</form>