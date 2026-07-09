// Database connection simulation
let isConnectedToDatabase = false
let currentUser = null // Tracks the logged-in username for user-specific storage

// Sample data (only used when connected to database)
const sampleCertificates = [
  {
    id: 1,
    title: "Certificate of Completion - Advanced Mathematics",
    issuer: "Issued by National University, 2023",
    image: "/mathematics-certificate.jpg",
  },
  {
    id: 2,
    title: "Certificate of Achievement - Physics Olympiad",
    issuer: "Issued by National Science Council, 2022",
    image: "/physics-certificate.jpg",
  },
]

const sampleHistory = [
  {
    institution: "Global Tech Inc.",
    certificate: "Certificate of Completion - Advanced Mathematics",
    date: "July 25, 2024",
  },
  {
    institution: "Innovate Solutions Ltd.",
    certificate: "Certificate of Achievement - Physics Olympiad",
    date: "July 22, 2024",
  },
  {
    institution: "Future Enterprises",
    certificate: "Certificate of Completion - Advanced Mathematics",
    date: "July 20, 2024",
  },
  {
    institution: "Quantum Innovations",
    certificate: "Certificate of Achievement - Physics Olympiad",
    date: "July 18, 2024",
  },
]

// DOM Elements
const mobileMenuToggle = document.getElementById("mobileMenuToggle")
const sidebar = document.getElementById("sidebar")
const navLinks = document.querySelectorAll(".nav-link")
const contentSections = document.querySelectorAll(".content-section")
const logoutBtn = document.getElementById("logoutBtn")
const certificatesGrid = document.getElementById("certificatesGrid")
const historyTableBody = document.getElementById("historyTableBody")
const certificateForm = document.getElementById("certificateForm")
const fileUploadArea = document.getElementById("fileUploadArea")
const uploadLink = document.getElementById("uploadLink")
const certificateFile = document.getElementById("certificateFile")
const filePreview = document.getElementById("filePreview")
const fileName = document.getElementById("fileName")
const removeFileBtn = document.getElementById("removeFileBtn")
const themeSelect = document.getElementById("themeSelect")
const languageSelect = document.getElementById("languageSelect")
const emailNotifications = document.getElementById("emailNotifications")
const logoutSettingsBtn = document.getElementById("logoutSettingsBtn")

// Translations and settings
const translations = {
  english: {
    dashboard: "Dashboard",
    myCertificates: "My Certificates",
    verifyCertificate: "Get Certificate",
    accessHistory: "Upload Certificate",
    settings: "Settings",
    logout: "Logout",
    welcome: "Welcome, Sophia Clark",
    welcomeSubtitle: "Here's a summary of your academic achievements and profile.",
    verifiedCertificates: "Verified Certificates",
    certificateAccessHistory: "Certificate Access History",
    noCertificates: "No certificates verified yet.",
    institution: "Institution",
    certificateAccessed: "Certificate Accessed",
    dateOfAccess: "Date of Access",
    viewDetails: "View Details",
    account: "Account",
    email: "Email",
    password: "Password",
    edit: "Edit",
    change: "Change",
    save: "Save",
    cancel: "Cancel",
    notifications: "Notifications",
    emailNotifications: "Email Notifications",
    emailNotificationsDesc: "Receive email notifications about certificate updates",
    appSettings: "App Settings",
    language: "Language",
    languageDesc: "Choose your preferred language",
    theme: "Theme",
    themeDesc: "Select your preferred app theme",
    light: "Light",
    dark: "Dark",
    logOut: "Log Out",
  },
  hindi: {
    dashboard: "डैशबोर्ड",
    myCertificates: "मेरे प्रमाणपत्र",
    verifyCertificate: "प्रमाणपत्र सत्यापित करें",
    accessHistory: "पहुंच इतिहास",
    settings: "सेटिंग्स",
    logout: "लॉगआउट",
    welcome: "स्वागत है, सोफिया क्लार्क",
    welcomeSubtitle: "यहाँ आपकी शैक्षणिक उपलब्धियों और प्रोफ़ाइल का सारांश है।",
    verifiedCertificates: "सत्यापित प्रमाणपत्र",
    certificateAccessHistory: "प्रमाणपत्र पहुंच इतिहास",
    noCertificates: "अभी तक कोई प्रमाणपत्र सत्यापित नहीं हुआ।",
    institution: "संस्थान",
    certificateAccessed: "प्रमाणपत्र एक्सेस किया गया",
    dateOfAccess: "पहुंच की तारीख",
    viewDetails: "विवरण देखें",
    account: "खाता",
    email: "ईमेल",
    password: "पासवर्ड",
    edit: "संपादित करें",
    change: "बदलें",
    save: "सेव करें",
    cancel: "रद्द करें",
    notifications: "सूचनाएं",
    emailNotifications: "ईमेल सूचनाएं",
    emailNotificationsDesc: "प्रमाणपत्र अपडेट के बारे में ईमेल सूचनाएं प्राप्त करें",
    appSettings: "ऐप सेटिंग्स",
    language: "भाषा",
    languageDesc: "अपनी पसंदीदा भाषा चुनें",
    theme: "थीम",
    themeDesc: "अपनी पसंदीदा ऐप थीम चुनें",
    light: "हल्का",
    dark: "गहरा",
    logOut: "लॉग आउट",
  },
}

let currentLanguage = "english"
let currentTheme = "light"

// Initialize the dashboard
document.addEventListener("DOMContentLoaded", async () => {
  initializeNavigation()
  setupEventListeners()
  initializeSettings()
  loadUserPreferences()
  await loadUserProfile()  // Load user first so currentUser is set
  await loadCertificates()       // Now uses correct user-specific storage key
  await loadHistory()
})

// Navigation functionality
function initializeNavigation() {
  const links = document.querySelectorAll(".nav-link")
  const sections = document.querySelectorAll(".content-section")

  links.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()

      // Remove active class from all nav items
      document.querySelectorAll(".nav-item").forEach((item) => {
        item.classList.remove("active")
      })

      // Add active class to clicked nav item
      this.parentElement.classList.add("active")

      // Hide all content sections
      sections.forEach((section) => {
        section.classList.remove("active")
      })

      // Show selected content section
      const targetSection = this.getAttribute("data-section") + "-section"
      const targetElement = document.getElementById(targetSection)
      if (targetElement) {
        targetElement.classList.add("active")
      }

      // Close mobile menu if open
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("open")
      }
    })
  })
}

async function loadCertificates() {
  const myCertificatesGrid = document.getElementById("myCertificatesGrid");
  let certificates = [];
  try {
    const response = await fetch('/api/student/certificates');
    if (response.ok) {
      const data = await response.json();
      certificates = data.certificates || [];
    }
  } catch (error) {
    console.error("Error fetching certificates:", error);
  }

  if (certificates.length === 0) {
    const emptyMsg = `
      <div class="no-data-message">
          <p>${translations[currentLanguage].noCertificates}</p>
      </div>
    `;
    if (certificatesGrid) certificatesGrid.innerHTML = emptyMsg;
    if (myCertificatesGrid) myCertificatesGrid.innerHTML = emptyMsg;
    return;
  }

  const renderedHtml = certificates
    .map(
      (cert) => `
        <div class="certificate-card" style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-card);">
            <div class="certificate-info">
                <h3 class="certificate-title" style="margin-top:0;">${cert.certName || cert.title || 'Certificate'}</h3>
                <p class="certificate-issuer"><strong>Type:</strong> ${cert.certType || cert.type || 'N/A'}</p>
                <p class="certificate-issuer"><strong>Issued by:</strong> ${cert.issuingAuthority || cert.issuer || 'N/A'}</p>
                <p class="certificate-issuer"><strong>Issue Date:</strong> ${cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <a href="${cert.fileUrl}" target="_blank" class="view-details-btn" style="flex:1; text-decoration:none; text-align:center; background:#2563eb; color:white; padding:0.5rem 1rem; border-radius:4px;">
                    View
                </a>
                <a href="${cert.fileUrl}?download=1" download class="view-details-btn" style="flex:1; text-decoration:none; text-align:center; background:#10b981; color:white; padding:0.5rem 1rem; border-radius:4px;">
                    Download
                </a>
                <button onclick="deleteCertificate('${cert.certificateId}')" class="view-details-btn" style="flex:1; border:none; cursor:pointer; text-align:center; background:#ef4444; color:white; padding:0.5rem 1rem; border-radius:4px;">
                    Delete
                </button>
            </div>
        </div>
    `,
    )
    .join("");

  if (certificatesGrid) certificatesGrid.innerHTML = renderedHtml;
  if (myCertificatesGrid) myCertificatesGrid.innerHTML = renderedHtml;
}

async function loadHistory() {
  let certificates = [];
  try {
    const response = await fetch('/api/student/certificates');
    if (response.ok) {
      const data = await response.json();
      certificates = data.certificates || [];
    }
  } catch (error) {
    console.error("Error fetching history:", error);
  }

  if (certificates.length === 0) {
    historyTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="no-data-message">
                    ${translations[currentLanguage].noCertificates}
                </td>
            </tr>
        `
    return
  }

  historyTableBody.innerHTML = certificates
    .map(
      (cert) => `
        <tr>
            <td>${cert.issuingAuthority || cert.issuer || 'N/A'}</td>
            <td>${cert.certName || cert.title || 'Certificate'}</td>
            <td>${cert.uploadDate ? new Date(cert.uploadDate).toLocaleDateString() : (cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'N/A')}</td>
        </tr>
    `,
    )
    .join("")
}

// Setup event listeners
function setupEventListeners() {
  // Mobile menu toggle
  mobileMenuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open")
  })

  // Close mobile menu when clicking outside
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        sidebar.classList.remove("open")
      }
    }
  })

  // Logout functionality
  logoutBtn.addEventListener("click", () => {
    if (confirm(translations[currentLanguage].logOut + "?")) {
      // Redirect to login page
      window.location.href = "/student-login/student-login.html"
    }
  })

  // Handle window resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove("open")
    }
  })

  setupCertificateForm()
}

function setupCertificateForm() {
  const searchForm = document.getElementById("certificateSearchForm")
  if (!searchForm) return

  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    const submitBtn = document.getElementById("searchSubmitBtn")
    const studentName = document.getElementById("searchStudentName").value
    const certificateId = document.getElementById("searchCertificateId").value
    const resultArea = document.getElementById("searchResultArea")
    const resultContent = document.getElementById("searchResultContent")
    const downloadBtn = document.getElementById("downloadCertBtn")

    submitBtn.disabled = true
    submitBtn.textContent = "Searching..."
    resultArea.style.display = "none"

    try {
      const response = await fetch('/api/certificates/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, certificateId })
      })

      const data = await response.json()

      if (response.ok) {
        const cert = data.certificate
        resultContent.innerHTML = `
          <p><strong>Certificate Name:</strong> ${cert.certName}</p>
          <p><strong>Type:</strong> ${cert.certType}</p>
          <p><strong>Issuing Authority:</strong> ${cert.issuingAuthority}</p>
          <p><strong>Issue Date:</strong> ${cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'N/A'}</p>
        `
        downloadBtn.href = cert.fileUrl + "?download=1"
        downloadBtn.style.background = "#2563eb"
        downloadBtn.style.color = "white"
        downloadBtn.style.textDecoration = "none"
        downloadBtn.style.padding = "0.75rem 1.5rem"
        resultArea.style.display = "block"

        await loadCertificates();
        await loadHistory();
      } else {
        showToast(data.error || "Certificate not found. Please check your details.", "error")
      }
    } catch (error) {
      console.error("Search error:", error)
      showToast("An error occurred while searching. Please try again.", "error")
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = "Search Certificate"
    }
  })
}

const uploadForm = document.getElementById("uploadCertificateForm");
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById("uploadSubmitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";
    const resultArea = document.getElementById("uploadResultArea");
    const resultContent = document.getElementById("uploadResultContent");
    const downloadBtn = document.getElementById("uploadDownloadBtn");

    resultArea.style.display = "none";
    const formData = new FormData(uploadForm);
    const studentName = document.getElementById("studentName").textContent;
    formData.append("studentName", studentName);
    
    // Auto-generate certificate ID for personal vault
    const certificateId = "VAULT-" + Date.now() + Math.floor(Math.random() * 1000);
    formData.append("certificateId", certificateId);
    
    // Default issuing authority to "Personal Vault" since it's a personal document
    formData.append("issuingAuthority", "Personal Vault");

    try {
      const response = await fetch('/api/certificates/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (response.ok) {
         resultContent.innerHTML = `<p><strong>Success:</strong> Document saved to your vault.</p>`;
         downloadBtn.href = data.fileUrl + "?download=1";
         resultArea.style.display = "block";
         uploadForm.reset();
         
         const certName = formData.get("certName");
         const certType = formData.get("certType");
         const issuingAuthority = "Personal Vault";
         const issueDate = formData.get("issueDate");
         await loadCertificates();
         await loadHistory();
      } else {
         showToast(data.message || "Failed to upload certificate.", "error");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred while uploading. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Upload Certificate";
    }
  });
}

// Certificate details functionality
function viewCertificateDetails(certificateId) {
  // This would typically open a modal or navigate to a details page
  alert(`Viewing details for certificate ID: ${certificateId}`)
}

async function deleteCertificate(certificateId) {
    if (!confirm("Are you sure you want to delete this document from your vault? This will remove it from the server and database.")) {
        return;
    }
    
    try {
        const response = await fetch(`/api/certificates/${encodeURIComponent(certificateId)}`, {
            method: 'DELETE'
        });
    
        if (response.ok || response.status === 404) {
          await loadCertificates();
          await loadHistory();
          showToast("Document successfully deleted.", "success");
        } else {
          const data = await response.json();
          showToast(data.error || "Failed to delete the document.", "error");
        }
    } catch (error) {
        console.error("Delete error:", error);
        showToast("An error occurred while deleting. Please try again.", "error");
    }
}

// Simulate database connection (for testing purposes)
function toggleDatabaseConnection() {
  isConnectedToDatabase = !isConnectedToDatabase
  loadCertificates()
  loadHistory()
  console.log(`Database connection: ${isConnectedToDatabase ? "Connected" : "Disconnected"}`)
}

// Export function for testing (can be removed in production)
window.toggleDatabaseConnection = toggleDatabaseConnection

// Settings functionality
function initializeSettings() {
  // Theme selector
  if (themeSelect) {
    themeSelect.addEventListener("change", (e) => {
      changeTheme(e.target.value)
    })
  }

  // Language selector
  if (languageSelect) {
    languageSelect.addEventListener("change", (e) => {
      changeLanguage(e.target.value)
    })
  }

  // Email notifications toggle
  if (emailNotifications) {
    emailNotifications.addEventListener("change", (e) => {
      saveNotificationPreference(e.target.checked)
    })
  }


  // ── Edit Email Logic ──────────────────────────────────────
  const editEmailBtn   = document.getElementById("editEmailBtn");
  const saveEmailBtn   = document.getElementById("saveEmailBtn");
  const cancelEmailBtn = document.getElementById("cancelEmailBtn");
  const emailValueEl   = document.getElementById("emailValue");
  const emailInputEl   = document.getElementById("emailInput");

  if (editEmailBtn) {
    editEmailBtn.addEventListener("click", () => {
      emailInputEl.value = emailValueEl.textContent === 'No email provided' ? '' : emailValueEl.textContent;
      emailValueEl.style.display = "none";
      emailInputEl.style.display = "block";
      editEmailBtn.style.display = "none";
      saveEmailBtn.style.display = "inline-flex";
      cancelEmailBtn.style.display = "inline-flex";
      emailInputEl.focus();
    });
  }

  if (cancelEmailBtn) {
    cancelEmailBtn.addEventListener("click", () => {
      emailValueEl.style.display = "block";
      emailInputEl.style.display = "none";
      editEmailBtn.style.display = "inline-flex";
      saveEmailBtn.style.display = "none";
      cancelEmailBtn.style.display = "none";
    });
  }

  if (saveEmailBtn) {
    saveEmailBtn.addEventListener("click", async () => {
      const newEmail = emailInputEl.value.trim();
      if (!newEmail || !newEmail.includes('@')) {
        showToast("Please enter a valid email address.", "error");
        return;
      }
      saveEmailBtn.disabled = true;
      saveEmailBtn.textContent = "Saving...";
      try {
        const res = await fetch('/api/update-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newEmail })
        });
        const result = await res.json();
        if (res.ok) {
          emailValueEl.textContent = newEmail;
          emailValueEl.style.display = "block";
          emailInputEl.style.display = "none";
          editEmailBtn.style.display = "inline-flex";
          saveEmailBtn.style.display = "none";
          cancelEmailBtn.style.display = "none";
          showToast("✅ Email updated! You can now use Change Password.", "success");
        } else {
          showToast(result.error || "Failed to update email.", "error");
        }
      } catch (err) {
        showToast("Server error. Please try again.", "error");
      } finally {
        saveEmailBtn.disabled = false;
        saveEmailBtn.textContent = "Save";
      }
    });
  }

  // ── OTP Password flow ─────────────────────────────────────
  const requestOtpBtn = document.getElementById("requestOtpBtn")
  const resendOtpBtn = document.getElementById("resendOtpBtn")
  const otpSection = document.getElementById("otpSection")
  const cancelOtpBtn = document.getElementById("cancelOtpBtn")
  const confirmPasswordBtn = document.getElementById("confirmPasswordBtn")
  
  let otpTimer = null;
  function startOtpTimer() {
    let timeLeft = 60;
    if (resendOtpBtn) {
      resendOtpBtn.disabled = true;
      resendOtpBtn.textContent = `Resend OTP (${timeLeft}s)`;
    }
    
    if (otpTimer) clearInterval(otpTimer);
    otpTimer = setInterval(() => {
      timeLeft--;
      if (resendOtpBtn) {
        if (timeLeft <= 0) {
          clearInterval(otpTimer);
          resendOtpBtn.disabled = false;
          resendOtpBtn.textContent = "Resend OTP";
        } else {
          resendOtpBtn.textContent = `Resend OTP (${timeLeft}s)`;
        }
      }
    }, 1000);
  }

  async function requestOtp() {
    try {
      requestOtpBtn.disabled = true;
      if (resendOtpBtn) resendOtpBtn.disabled = true;
      requestOtpBtn.textContent = "Sending...";
      
      const res = await fetch('/api/request-otp', { method: 'POST' });
      const result = await res.json();
      
      if (res.ok) {
        showToast(result.message, 'success');
        document.getElementById("passwordSection").style.display = "none";
        otpSection.style.display = "block";
        startOtpTimer();
      } else {
        showToast("Error: " + result.error, 'error');
      }
    } catch (err) {
      showToast("Server error connecting to backend.", 'error');
    } finally {
      requestOtpBtn.disabled = false;
      requestOtpBtn.textContent = "Change Password";
    }
  }

  if (requestOtpBtn) {
    requestOtpBtn.addEventListener("click", requestOtp);
  }

  if (resendOtpBtn) {
    resendOtpBtn.addEventListener("click", requestOtp);
  }

  if (cancelOtpBtn) {
    cancelOtpBtn.addEventListener("click", () => {
      document.getElementById("passwordSection").style.display = "flex";
      otpSection.style.display = "none";
      document.getElementById("otpInput").value = "";
      document.getElementById("newPasswordInput").value = "";
    });
  }

  if (confirmPasswordBtn) {
    confirmPasswordBtn.addEventListener("click", async () => {
      const otp = document.getElementById("otpInput").value.trim();
      const newPassword = document.getElementById("newPasswordInput").value;
      
      if (!otp || !newPassword) {
        showToast("Both OTP and new password are required.", 'error');
        return;
      }
      
      try {
        confirmPasswordBtn.disabled = true;
        confirmPasswordBtn.textContent = "Updating...";
        
        const res = await fetch('/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp, newPassword })
        });
        const result = await res.json();
        
        if (res.ok) {
          showToast(result.message || "Password updated successfully!", 'success');
          document.getElementById("passwordSection").style.display = "flex";
          otpSection.style.display = "none";
          document.getElementById("otpInput").value = "";
          document.getElementById("newPasswordInput").value = "";
          if (otpTimer) clearInterval(otpTimer);
        } else {
          showToast("Error: " + (result.error || "Failed to update password"), 'error');
        }
      } catch (err) {
        showToast("Server error updating password.", 'error');
      } finally {
        confirmPasswordBtn.disabled = false;
        confirmPasswordBtn.textContent = "Update Password";
      }
    });
  }
}

async function loadUserProfile() {
  try {
    const response = await fetch('/api/me');
    if (response.status === 401) {
      window.location.replace('/student-login/student-login.html');
      return;
    }
    if (response.ok) {
      const data = await response.json();
      
      // Set global currentUser — used for user-specific localStorage keys
      currentUser = data.username;

      const userEmailInput = document.getElementById("emailValue");
      if (userEmailInput) userEmailInput.textContent = data.email || 'No email provided';

      const welcomeTitle = document.getElementById("welcomeTitle");
      if (welcomeTitle) welcomeTitle.textContent = `Welcome, ${data.username}`;

      const studentNameDisplay = document.getElementById("studentName");
      if (studentNameDisplay) studentNameDisplay.textContent = data.username;

    } else {
      console.error("Failed to load user profile");
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

function changeTheme(theme) {
  currentTheme = theme
  document.body.className = theme === "dark" ? "dark-theme" : ""
  localStorage.setItem("theme", theme)
}

function changeLanguage(language) {
  currentLanguage = language
  updatePageLanguage()
  localStorage.setItem("language", language)
}

function updatePageLanguage() {
  const t = translations[currentLanguage]

  // Update navigation
  document.querySelector('[data-section="dashboard"]').textContent = t.dashboard
  document.querySelector('[data-section="certificates"]').textContent = t.myCertificates
  document.querySelector('[data-section="verify"]').textContent = t.verifyCertificate
  document.querySelector('[data-section="history"]').textContent = t.accessHistory
  document.querySelector('[data-section="settings"]').textContent = t.settings

  // Update main content
  const welcomeTitle = document.querySelector(".welcome-title")
  if (welcomeTitle) welcomeTitle.textContent = t.welcome

  const welcomeSubtitle = document.querySelector(".welcome-subtitle")
  if (welcomeSubtitle) welcomeSubtitle.textContent = t.welcomeSubtitle

  // Update section titles
  const sectionTitles = document.querySelectorAll(".section-title")
  sectionTitles.forEach((title, index) => {
    if (index === 0) title.textContent = t.verifiedCertificates
    if (index === 1) title.textContent = t.certificateAccessHistory
  })

  // Update settings page
  const settingsTitle = document.querySelector(".settings-title")
  if (settingsTitle) settingsTitle.textContent = t.settings

  const settingsSectionTitles = document.querySelectorAll(".settings-section-title")
  if (settingsSectionTitles[0]) settingsSectionTitles[0].textContent = t.account
  if (settingsSectionTitles[1]) settingsSectionTitles[1].textContent = t.notifications
  if (settingsSectionTitles[2]) settingsSectionTitles[2].textContent = t.appSettings

  // Update setting labels
  const settingLabels = document.querySelectorAll(".setting-label")
  const mainSettingLabels = Array.from(settingLabels).filter(label => !label.closest('#otpSection'))
  if (mainSettingLabels[0]) mainSettingLabels[0].textContent = t.email
  if (mainSettingLabels[1]) mainSettingLabels[1].textContent = t.password
  if (mainSettingLabels[2]) mainSettingLabels[2].textContent = t.emailNotifications
  if (mainSettingLabels[3]) mainSettingLabels[3].textContent = t.language
  if (mainSettingLabels[4]) mainSettingLabels[4].textContent = t.theme

  // Update setting descriptions
  const settingDescs = document.querySelectorAll(".setting-description")
  if (settingDescs[0]) settingDescs[0].textContent = t.emailNotificationsDesc
  if (settingDescs[1]) settingDescs[1].textContent = t.languageDesc
  if (settingDescs[2]) settingDescs[2].textContent = t.themeDesc

  // Update buttons
  const editButtons = document.querySelectorAll(".edit-btn")
  if (editButtons[0] && !editButtons[0].classList.contains("save-btn")) {
    editButtons[0].innerHTML = `
      <svg class="edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      ${t.edit}
    `
  }
  if (editButtons[1] && !editButtons[1].classList.contains("save-btn")) {
    editButtons[1].innerHTML = `
      <svg class="edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      ${t.change}
    `
  }

  // Update logout button
  const logoutBtn = document.getElementById("logoutBtn")
  if (logoutBtn) {
    logoutBtn.innerHTML = `
      <svg class="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16,17 21,12 16,7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      ${t.logout}
    `
  }

  if (logoutSettingsBtn) {
    logoutSettingsBtn.innerHTML = `
      <svg class="logout-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16,17 21,12 16,7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      ${t.logOut}
    `
  }

  // Update theme options
  const themeOptions = document.querySelectorAll("#themeSelect option")
  if (themeOptions[0]) themeOptions[0].textContent = t.light
  if (themeOptions[1]) themeOptions[1].textContent = t.dark

  // Reload certificates and history with new language
  loadCertificates()
  loadHistory()
}

function loadUserPreferences() {
  // Load theme preference
  const savedTheme = localStorage.getItem("theme") || "light"
  currentTheme = savedTheme
  if (themeSelect) themeSelect.value = savedTheme
  changeTheme(savedTheme)

  // Load language preference
  const savedLanguage = localStorage.getItem("language") || "english"
  currentLanguage = savedLanguage
  if (languageSelect) languageSelect.value = savedLanguage
  updatePageLanguage()

  // Load notification preference
  const savedNotifications = localStorage.getItem("emailNotifications") !== "false"
  if (emailNotifications) emailNotifications.checked = savedNotifications
}

function saveUserData(field, value) {
  // In a real application, this would send data to the server
  localStorage.setItem(`user_${field}`, value)
  console.log(`Saved ${field}:`, value)
}

function saveNotificationPreference(enabled) {
  localStorage.setItem("emailNotifications", enabled)
  console.log("Email notifications:", enabled ? "enabled" : "disabled")
}
