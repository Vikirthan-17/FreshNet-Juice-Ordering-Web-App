const AUTH_API_URL = "https://freshnet-juice-ordering-web-app-production.up.railway.app/api/auth/login";

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  try {
    const response = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Login failed.");
      return;
    }

    localStorage.setItem("freshnestAdminToken", data.token);
    localStorage.setItem("freshnestAdminName", data.admin.name);
    localStorage.setItem("freshnestAdminEmail", data.admin.email);

    alert("Login successful!");
    window.location.href = "admin.html";
  } catch (error) {
    console.error("Login error:", error);
    alert("Backend connection failed. Make sure server is running.");
  }
});