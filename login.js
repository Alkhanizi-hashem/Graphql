function renderLogin() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="fade-in">
     
      <form id="loginForm">
      <h2 style="color: #6366f1;">Sign In</h2>
        <div class="form-group">
          <input type="text" id="identifier" placeholder=" " required>
          <label for="identifier">Username or Email</label>
        </div>
        
        <div class="form-group">
          <input type="password" id="password" placeholder=" " required>
          <label for="password">Password</label>
        </div>
        
        <button type="submit" id="loginBtn">
          <span class="btn-text">Sign In</span>
        </button>
        
        <div id="error"></div>
      </form>
    </div>
  `;
  document.getElementById("error").style.display = "none";
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const errorDiv = document.getElementById("error");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Add loading state
    loginBtn.classList.add("loading");
    loginBtn.querySelector(".btn-text").textContent = "Signing In...";
    errorDiv.textContent = "";
    
    const id = document.getElementById("identifier").value;
    const pw = document.getElementById("password").value;
    const creds = btoa(`${id}:${pw}`);

    try {
      const res = await fetch("https://learn.reboot01.com/api/auth/signin", {
        method: "POST",
        headers: { Authorization: `Basic ${creds}` }
      });
      
      if (!res.ok) {
        throw new Error("Invalid credentials. Please check your username and password.");
      }

      const data = await res.json();
      const token = typeof data === "string" ? data : (data.token || data.jwt);
      
      if (!token) {
        throw new Error("Authentication failed. No token received.");
      }
      
      localStorage.setItem("jwt", token);
      
      // Show success state briefly
      loginBtn.querySelector(".btn-text").textContent = "Success!";
      
      // Add success notification
      showNotification("Login successful! Loading your profile...", "success");
      
      setTimeout(() => {
        loadProfile(token);
      }, 1000);
      
    } catch (err) {
      // Remove loading state
      loginBtn.classList.remove("loading");
      loginBtn.querySelector(".btn-text").textContent = "Sign In";
      
      // Show error
      errorDiv.textContent = err.message;
      
      // Add error notification
      showNotification(err.message, "error");
      
      // Add shake animation to form
      loginForm.style.animation = "shake 0.5s ease-in-out";
      setTimeout(() => {
        loginForm.style.animation = "";
      }, 500);
    }
  });
}

// Utility function for notifications
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach(n => n.remove());
  
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.classList.add("show");
  }, 100);
  
  // Hide notification after 4 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 4000);
}
