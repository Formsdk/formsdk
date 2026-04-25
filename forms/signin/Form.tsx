<form id="signin-form" style={{ maxWidth: "400px", display: "flex", flexDirection: "column", gap: "1rem" }}>
  <input type="email" name="email" required placeholder="Email address" autocomplete="email" />
  <input type="password" name="password" required placeholder="Password" autocomplete="current-password" />
  <button type="submit">Sign In</button>
  <p style={{ textAlign: "center" }}>
    Don't have an account? <a href="/sign-up">Sign up</a>
  </p>
</form>

<script>
  const form = document.getElementById("signin-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const result = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(data)),
    }).then(r => r.json());
    
    if (result.data) {
      window.location.href = "/dashboard";
    } else if (result.error) {
      alert(result.error.message);
    }
  });
</script>