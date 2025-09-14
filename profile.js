async function loadProfile(token) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="loading-profile fade-in">
      <div class="loading-spinner"></div>
      <h2>Loading your profile...</h2>
      <p>Please wait while we fetch your data</p>
    </div>
  `;

  try {
    // User info
    const userData = await gqlFetch(`{
        user {
            id
            attrs
            login
            campus
        }
    }`, {}, token);
    const user = userData.user[0];
    console.log(user);


    // Transactions (XP)
    const txData = await gqlFetch(`{
      transaction(where: { type: {_eq:"xp"} }) {
        id amount type createdAt path
      }
    }`, {}, token);
     res=[];

    txData.transaction.forEach(element => {
      category = element.path.split("/");
      if((category.includes('bh-module')&&category.length==4)||category.includes('checkpoint')){;
        res.push(element);
      }
     
  });
  


    // Results
    const resultData = await gqlFetch(`{
      progress { id grade userId createdAt path }
    }`, {}, token);
   
    const results = resultData.progress.filter(r => r.userId == user.id);
    re=[];

    results.forEach(element => {
       moudule = element.path.split("/");
      if((moudule.includes('bh-module')&&moudule.length==4)){;
        re.push(element);
      }

    })

     const RatioData = await gqlFetch(`{
      transaction {
        id amount type createdAt path
      }
    }`, {}, token);

    let filtered = RatioData.transaction.filter(t => {
    const parts = t.path.split("/");
    return t.path.includes("bh-module") && parts.length === 4;
    });

    // keep only type = up or down
    let filteredByType = filtered.filter(t => t.type === "up" || t.type === "down");

    // group into up and down
    let upTransactions = filteredByType.filter(t => t.type === "up");
    let downTransactions = filteredByType.filter(t => t.type === "down");

    // totals
    let upSum = ((upTransactions.reduce((acc, t) => acc + t.amount, 0))/1000000).toFixed(2);
    let downSum = ((downTransactions.reduce((acc, t) => acc + t.amount, 0))/1000000).toFixed(2);

    // Clear and render UI
    app.innerHTML = `
  <div class="fade-in">
  <nav class="navbar">
    <ul class="navbar-list">
      <li class="navbar-title">
        <h2>Graphql</h2>
      </li>
      <li class="navbar-action">
        <button id="logoutBtn" class="fab">
          Logout
        </button>
      </li>
    </ul>
  </nav>
</div>


    <header class="text-center" style="text-align: center; margin-bottom: 2rem;">
      <h1>Welcome, ${user.login}</h1>
    </header>

    <div class="grid-container">
    <div class="profile-grid">
      <!-- Personal Information -->
      <div class="grid-item">
        <div class="grid-item-content">
          <div class="grid-item-icon">
            <span style="font-size: 1.5rem;">👤</span>
          </div>
          <h3>Personal Information</h3>
          <div class="profile-details">
            <div class="profile-item"><strong>Full Name:</strong> <span id="fullName" class="profile-value"></span></div>
            <div class="profile-item"><strong>Date of Birth:</strong> <span id="dob" class="profile-value"></span></div>
            <div class="profile-item"><strong>Gender:</strong> <span id="gender" class="profile-value"></span></div>
            <div class="profile-item"><strong>Country:</strong> <span id="country" class="profile-value"></span></div>
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="grid-item">
        <div class="grid-item-content">
          <div class="grid-item-icon"><span style="font-size: 1.5rem;">📞</span></div>
          <h3>Contact Information</h3>
          <div class="profile-details">
            <div class="profile-item"><strong>Email:</strong> <span id="email" class="profile-value email-value"></span></div>
            <div class="profile-item"><strong>Phone:</strong> <span id="phoneNumber" class="profile-value phone-value"></span></div>
            <div class="profile-item"><strong>CPR Number:</strong> <span id="cprNumber" class="profile-value cpr-value"></span></div>
          </div>
        </div>
      </div>

      <!-- Academic Information -->
      <div class="grid-item">
        <div class="grid-item-content">
          <div class="grid-item-icon"><span style="font-size: 1.5rem;">🎓</span></div>
          <h3>Academic Information</h3>
          <div class="profile-details">
            <div class="profile-item"><strong>Degree Program:</strong> <span id="degreeInfo" class="profile-value degree-value"></span></div>
            <div class="profile-item"><strong>Campus Location:</strong> <span class="profile-value campus-value">${user.campus}</span></div>
            <div class="profile-item"><strong>Graduation Year:</strong> <span id="gradYear" class="profile-value grad-year-value">${user.attrs.graddate}</span></div>
          </div>
        </div>
      </div>

     <div class="grid-container charts-row" style="
    margin-top: 2rem;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1rem;
">
</div>
  </div>
  <div class="charts-container" style="
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
 
">

  <!-- XP Progress Line Chart -->
  <div class="chart-box" style="
    background:rgba(248, 248, 248, 0.1);
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  ">
    <h3 style="margin-bottom: 1rem;">XP Progress</h3>
    <div id="xpChart" style="height: 400px;"></div>
  </div>

  <!-- Audit Ratio Bar Chart -->
  <div class="chart-box" style="
    background:rgba(248, 248, 248, 0.1);
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  ">
    <h3 style="margin-bottom: 1rem;">Audit Ratio</h3>
    <div id="pfChart" style="height: 400px;"></div>
  </div>

</div>
  

`;


// Populate the profile
document.getElementById("fullName").textContent = `${user.attrs.firstName} ${user.attrs.lastName}`;
document.getElementById("dob").textContent = new Date(user.attrs.dateOfBirth).toLocaleDateString();
document.getElementById("cprNumber").textContent = user.attrs.CPRnumber || 'Not provided';
document.getElementById("gender").textContent = user.attrs.genders || 'Not specified';
document.getElementById("phoneNumber").textContent = user.attrs.PhoneNumber || 'Not provided';
document.getElementById("email").textContent = user.attrs.email;
document.getElementById("degreeInfo").textContent = user.attrs.Degree || 'Not specified';
document.getElementById("country").textContent = user.attrs.country || 'Not specified';



document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("jwt");
  location.reload();
};



    drawXPChart("xpChart", res);
    drawXpLines("pfChart", upSum, downSum);
    


 
  }

  catch (err) {
    console.log(err);
  }}
