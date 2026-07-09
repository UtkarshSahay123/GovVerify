// Global variables
let currentSection = "dashboard"
let certificates = []
let appNotifications = [
  { icon: '🔔', title: 'Welcome', message: 'Welcome to your Employee Dashboard.', time: new Date() }
]
let isConnectedToDatabase = false // Simulate database connection
// Certificates will be fetched from database in real time

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  setupEventListeners()
  loadCertificates()
  setupFileUpload()
  setupSettingsControls()
  setEmployeeName()
  // Set employee name from localStorage
  function setEmployeeName() {
    const name = localStorage.getItem("employeeUsername") || "Employee";
    const nameSpan = document.getElementById("employeeName");
    if (nameSpan) nameSpan.textContent = "Welcome, " + name;
  }
})

function initializeApp() {
  // Simulate database connection (randomly true/false for demo)
  isConnectedToDatabase = Math.random() > 0.3 // 70% chance of being connected

  // Show dashboard by default
  showSection("dashboard")
}

function setupEventListeners() {
  // Navigation menu
  const navLinks = document.querySelectorAll(".nav-link")
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const section = this.getAttribute("data-section")
      showSection(section)
      updateActiveNavLink(this)
    })
  })

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById("mobileMenuToggle")
  const navMenu = document.getElementById("navMenu")

  mobileMenuToggle.addEventListener("click", function () {
    navMenu.classList.toggle("active")
    this.classList.toggle("active")
  })

  // Quick action cards
  document.getElementById("uploadNewCert").addEventListener("click", () => {
    showSection("upload")
    updateActiveNavLink(document.querySelector('[data-section="upload"]'))
  })

  document.getElementById("verifyStudentCert").addEventListener("click", () => {
    showSection("verify")
    updateActiveNavLink(document.querySelector('[data-section="verify"]'))
  })

  // Notification icon
  document.getElementById("notificationIcon").addEventListener("click", () => {
    showSection("notifications")
    // Remove notification badge when clicked
    const badge = document.getElementById("notificationBadge")
    if (badge) {
      badge.style.display = "none"
    }
  })

  // Clear Notifications
  document.getElementById("clearNotificationsBtn")?.addEventListener("click", () => {
    appNotifications = []
    renderAppNotifications()
  })

  // Forms
  document.getElementById("uploadForm").addEventListener("submit", handleUploadSubmit)

  setupCertificateVerification()

  // Search and filter
  document.getElementById("searchCerts")?.addEventListener("input", filterCertificates)
  document.getElementById("statusFilter")?.addEventListener("change", filterCertificates)

  // Account settings
  document.getElementById("editEmailBtn")?.addEventListener("click", editEmail)
  document.getElementById("editPasswordBtn")?.addEventListener("click", editPassword)
}

function setupCertificateVerification() {
  const uploadBtn = document.getElementById("uploadCertificateBtn")
  const fileInput = document.getElementById("verifyFileInput")
  const verifyBtn = document.getElementById("verifyBtn")
  const verifyButtonContainer = document.getElementById("verifyButtonContainer")
  const statusIndicator = document.getElementById("statusIndicator")
  const statusText = document.getElementById("statusText")

  let uploadedFile = null

  // Upload button click
  uploadBtn.addEventListener("click", () => {
    fileInput.click()
  })

  // File input change
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleVerificationFileUpload(e.target.files[0])
    }
  })

  // Verify button click
  verifyBtn.addEventListener("click", () => {
    if (uploadedFile) {
      performVerification()
    }
  })

  function handleVerificationFileUpload(file) {
    // Validate file
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      alert("Please select a PDF, PNG, or JPG file.")
      return
    }

    if (file.size > maxSize) {
      alert("File size must be less than 10MB.")
      return
    }

    uploadedFile = file

    // Update UI to show file uploaded
    updateVerificationStatus("uploaded", "File uploaded")

    // Show verify button
    verifyButtonContainer.style.display = "block"

    // Update upload button to show file name
    uploadBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14,2 14,8 20,8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10,9 9,9 8,9"></polyline>
      </svg>
      ${file.name}
    `

    // Add file preview
    const filePreview = document.createElement("div")
    filePreview.className = "file-preview-verify"
    filePreview.innerHTML = `
      <div class="file-info">
        <span>📄</span>
        <span>${file.name}</span>
        <span style="color: #64748b;">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
        <button type="button" class="remove-file" onclick="clearVerificationFile()">✕</button>
      </div>
    `

    // Insert after upload button
    uploadBtn.insertAdjacentElement('afterend', filePreview)
  }

  async function performVerification() {
    updateVerificationStatus("verifying", "Verifying certificate...")
    verifyBtn.disabled = true
    verifyBtn.textContent = "Verifying..."

    const formData = new FormData();
    formData.append('verifyFile', uploadedFile);

    try {
      const response = await fetch('/api/certificates/verify', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        updateVerificationStatus("verified", "Certificate verified successfully")
        showVerifiedModal(data.certificate)
      } else {
        const errorData = await response.json();
        updateVerificationStatus("invalid", errorData.error || "Certificate could not be verified")
        showMismatchModal(errorData.error)
      }
    } catch (error) {
      console.error("Verification error:", error);
      updateVerificationStatus("invalid", "An error occurred during verification")
      showMismatchModal("Network error or server unavailable")
    } finally {
      verifyBtn.disabled = false
      verifyBtn.textContent = "Verify"
    }
  }

  function updateVerificationStatus(status, text) {
    statusIndicator.className = `status-indicator ${status}`
    statusText.textContent = text

    // Update icon based on status
    let iconSvg = ""
    switch (status) {
      case "uploaded":
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7,10 12,15 17,10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>`
        break
      case "verifying":
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"></path>
        </svg>`
        break
      case "verified":
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>`
        break
      case "invalid":
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`
        break
      default:
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12,6 12,12 16,14"></polyline>
        </svg>`
    }

    statusIndicator.querySelector("svg").outerHTML = iconSvg
  }
}

function showVerifiedModal(certificateData) {
  if (!certificateData) {
    certificateData = {
      type: "Unknown",
      id: "Unknown",
      issueDate: "Unknown",
      issuedBy: "Unknown",
    }
  }

  // Update modal content
  document.getElementById("verifiedCertType").textContent = `Certificate Type: ${certificateData.type || 'N/A'}`
  document.getElementById("verifiedCertId").textContent = `Certificate ID: ${certificateData.id || 'N/A'}`
  document.getElementById("verifiedIssueDate").textContent = `Issued Date: ${certificateData.issueDate ? formatDate(certificateData.issueDate) : 'N/A'}`
  document.getElementById("verifiedIssuedBy").textContent = `Issued by: ${certificateData.issuedBy || 'N/A'}`
  document.getElementById("verifiedValidUntil").textContent = `Student Name: ${certificateData.studentName || 'N/A'}`
  document.getElementById("verifiedExpiresOn").textContent = ``

  // Show modal
  document.getElementById("verifiedModal").style.display = "flex"
}

function showMismatchModal(errorMessage) {
  document.getElementById("mismatchMessage").textContent = errorMessage || "The document hash did not match any records in our database.";
  document.getElementById("mismatchModal").style.display = "flex"
}

function closeVerificationModal() {
  document.getElementById("verifiedModal").style.display = "none"
  document.getElementById("mismatchModal").style.display = "none"
}

function viewCertificateFile() {
  // Simulate opening certificate file
  alert("Opening certificate file... (This would open the actual certificate document)")
  closeVerificationModal()
}

function reviewCertificate() {
  // Close modal and reset verification process
  closeVerificationModal()

  // Reset the verification interface
  window.clearVerificationFile()

  showNotification("Please review and re-upload the correct certificate.", "info")
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    closeVerificationModal()
  }
})

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeVerificationModal()
  }
})

function showSection(sectionName) {
  // Hide all sections
  const sections = document.querySelectorAll(".content-section")
  sections.forEach((section) => {
    section.classList.remove("active")
  })

  // Show selected section
  const targetSection = document.getElementById(sectionName + "Section")
  if (targetSection) {
    targetSection.classList.add("active")
    currentSection = sectionName
  }

  // Update page title
  updatePageTitle(sectionName)
}

function updateActiveNavLink(activeLink) {
  // Remove active class from all nav links
  const navLinks = document.querySelectorAll(".nav-link")
  navLinks.forEach((link) => {
    link.classList.remove("active")
  })

  // Add active class to clicked link
  if (activeLink) {
    activeLink.classList.add("active")
  }

  // Close mobile menu if open
  const navMenu = document.getElementById("navMenu")
  const mobileMenuToggle = document.getElementById("mobileMenuToggle")
  navMenu.classList.remove("active")
  mobileMenuToggle.classList.remove("active")
}

function updatePageTitle(sectionName) {
  const titles = {
    dashboard: "Employee Dashboard - CertifyGov",
    upload: "Upload Certificate - CertifyGov",
    verify: "Verify Certificate - CertifyGov",
    manage: "Manage Certificates - CertifyGov",
    settings: "Settings - CertifyGov",
    notifications: "Notifications - CertifyGov",
  }

  document.title = titles[sectionName] || "CertifyGov"
}

async function loadCertificates() {
  const tableBody = document.getElementById("certificatesTableBody")
  const noCertificates = document.getElementById("noCertificates")

  try {
    const response = await fetch('/api/certificates');
    const data = await response.json();
    certificates = data.certificates || [];

    // Map backend fields to frontend format and filter by government
    certificates = certificates
      .map(c => ({
        id: c.id,
        name: c.name || 'Certificate',
        issuedBy: c.issuedBy || 'Unknown',
        issueDate: c.issueDate || new Date().toISOString(),
        status: c.status || 'active',
        type: c.type || 'Unknown',
        certificateId: c.certificateId,
        fileUrl: c.fileUrl || '#'
      }))
      .filter(c => c.issuedBy.toLowerCase().includes('government') && c.issuedBy !== 'Personal Vault');
  } catch (error) {
    console.error("Failed to load certificates", error);
    certificates = [];
  }

  if (!certificates || certificates.length === 0) {
    tableBody.innerHTML = ""
    noCertificates.style.display = "block"
    return
  }
  noCertificates.style.display = "none"
  tableBody.innerHTML = certificates
    .map(
      (cert) => `
        <tr>
            <td>${cert.name}</td>
            <td>${cert.issuedBy}</td>
            <td>${formatDate(cert.issueDate)}</td>
            <td><span class="status-badge status-${cert.status}">${cert.status}</span></td>
            <td><a href="${cert.fileUrl}" target="_blank" class="view-details-btn">View Details</a></td>
        </tr>
    `,
    )
    .join("")
  populateManageSection()
}

function populateManageSection() {
  const certificatesGrid = document.getElementById("certificatesGrid")

  if (!isConnectedToDatabase || certificates.length === 0) {
    certificatesGrid.innerHTML = '<p class="no-certificates">No certificates registered yet.</p>'
    return
  }

  certificatesGrid.innerHTML = certificates
    .map(
      (cert) => `
        <div class="certificate-card">
            <h4>${cert.name}</h4>
            <p><strong>Issued by:</strong> ${cert.issuedBy}</p>
            <p><strong>Issue Date:</strong> ${formatDate(cert.issueDate)}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${cert.status}">${cert.status}</span></p>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <a href="${cert.fileUrl}" target="_blank" class="view-details-btn" style="flex:1; text-align:center; text-decoration:none; background:#3b82f6; color:white; padding:0.5rem; border-radius:4px;">View</a>
                <a href="${cert.fileUrl}" download class="view-details-btn" style="flex:1; text-align:center; text-decoration:none; background:#10b981; color:white; padding:0.5rem; border-radius:4px;">Download</a>
                <button onclick="deleteCertificate('${cert.certificateId}')" class="view-details-btn" style="flex:1; text-align:center; background:#ef4444; color:white; border:none; border-radius:4px; cursor:pointer; padding:0.5rem;">Delete</button>
            </div>
        </div>
    `,
    )
    .join("")
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function viewCertificateDetails(certId) {
  const certificate = certificates.find((cert) => cert.id === certId)
  if (certificate) {
    alert(
      `Certificate Details:\n\nName: ${certificate.name}\nIssued by: ${certificate.issuedBy}\nIssue Date: ${formatDate(certificate.issueDate)}\nStatus: ${certificate.status}\nType: ${certificate.type}\nCertificate ID: ${certificate.certificateId}`,
    )
  }
}

async function deleteCertificate(certificateId) {
  if (!confirm("Are you sure you want to delete this certificate?")) {
    return;
  }
  try {
    const response = await fetch(`/api/certificates/${encodeURIComponent(certificateId)}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      alert("Certificate successfully deleted.");
      loadCertificates();
    } else {
      const data = await response.json();
      alert(data.error || "Failed to delete the certificate.");
    }
  } catch (error) {
    console.error("Delete error:", error);
    alert("An error occurred while deleting. Please try again.");
  }
}

function setupFileUpload() {
  const fileUploadArea = document.getElementById("fileUploadArea")
  const fileInput = document.getElementById("certFile")
  const filePreview = document.getElementById("filePreview")

  // Click to upload
  fileUploadArea.addEventListener("click", () => {
    fileInput.click()
  })

  // Drag and drop
  fileUploadArea.addEventListener("dragover", function (e) {
    e.preventDefault()
    this.classList.add("dragover")
  })

  fileUploadArea.addEventListener("dragleave", function (e) {
    e.preventDefault()
    this.classList.remove("dragover")
  })

  fileUploadArea.addEventListener("drop", function (e) {
    e.preventDefault()
    this.classList.remove("dragover")

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelection(files[0])
    }
  })

  // File input change
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files[0])
    }
  })

  function handleFileSelection(file) {
    // Validate file
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"]
    const maxSize = 10 * 1024 * 1024 // 10MB as specified in the design

    if (!allowedTypes.includes(file.type)) {
      alert("Please select a PDF, PNG, or JPG file.")
      return
    }

    if (file.size > maxSize) {
      alert("File size must be less than 10MB.")
      return
    }

    // Show file preview
    filePreview.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>📄</span>
                <span>${file.name}</span>
                <span style="color: #64748b; font-size: 0.875rem;">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                <button type="button" onclick="clearFileSelection()" style="margin-left: auto; color: #ef4444; background: none; border: none; cursor: pointer;">✕</button>
            </div>
        `
    filePreview.style.display = "block"
  }
}

function clearFileSelection() {
  document.getElementById("certFile").value = ""
  document.getElementById("filePreview").style.display = "none"
}

async function handleUploadSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const certFile = formData.get("certFile");
  const certificateId = formData.get("certificateId");
  const confirmAccuracy = formData.get("confirmAccuracy");
  const studentName = formData.get("studentName");

  if (!certFile || certFile.size === 0) {
    alert("Please select a certificate file to upload.");
    return;
  }

  if (!certificateId.trim() || !studentName.trim()) {
    alert("Certificate ID and Student Name are required.");
    return;
  }

  if (!confirmAccuracy) {
    alert("Please confirm the accuracy of the information provided.");
    return;
  }

  const submitBtn = e.target.querySelector(".submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting for Verification...";

  try {
    const response = await fetch('/api/certificates/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      // Show success message
      showToast("Certificate submitted and stored successfully!", "success");

      // Add a real-time notification
      appNotifications.unshift({
        icon: '✅',
        title: 'New Certificate Uploaded',
        message: `Certificate ID #${certificateId} was successfully uploaded for ${studentName}.`,
        time: new Date()
      });
      renderAppNotifications();
      const badge = document.getElementById("notificationBadge");
      if (badge && document.getElementById("notificationsSection").style.display !== "block") {
        badge.style.display = "flex";
        badge.textContent = appNotifications.length;
      }

      // Reset form
      e.target.reset();
      clearFileSelection();

      // Refresh the certificates list
      await loadCertificates();

      // Navigate to dashboard
      showSection("dashboard");
      updateActiveNavLink(document.querySelector('[data-section="dashboard"]'));
    } else {
      showToast(result.message || "Failed to upload certificate.", "error");
    }
  } catch (error) {
    console.error("Upload error:", error);
    showNotification("An error occurred during upload. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit for Verification";
  }
}

function getAuthorityDisplayName(value) {
  const authorityMap = {
    "government-department": "Government Department",
    "national-certification-board": "National Certification Board",
    "state-department-education": "State Department of Education",
    "national-university": "National University",
    "international-literacy": "International Literacy Association",
    "science-council": "National Science Council",
    "professional-board": "Professional Licensing Board",
    "technical-institute": "Technical Training Institute",
    other: "Other Authority",
  }
  return authorityMap[value] || value
}

function handleVerifySubmit(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const studentId = formData.get("studentId")
  const certificateId = formData.get("certificateId")

  const resultDiv = document.getElementById("verificationResult")
  const submitBtn = e.target.querySelector(".submit-btn")

  submitBtn.disabled = true
  submitBtn.textContent = "Verifying..."

  setTimeout(() => {
    // Simulate verification result (random for demo)
    const isValid = Math.random() > 0.3 // 70% chance of being valid

    if (isValid) {
      resultDiv.innerHTML = `
                <div class="verification-success">
                    <h4>✅ Certificate Verified</h4>
                    <p><strong>Student ID:</strong> ${studentId}</p>
                    <p><strong>Certificate ID:</strong> ${certificateId}</p>
                    <p><strong>Status:</strong> Valid and Active</p>
                    <p><strong>Issued:</strong> March 15, 2023</p>
                    <p><strong>Institution:</strong> National University</p>
                </div>
            `
    } else {
      resultDiv.innerHTML = `
                <div class="verification-error">
                    <h4>❌ Certificate Not Found</h4>
                    <p>The certificate with ID "${certificateId}" for student "${studentId}" could not be verified.</p>
                    <p>Please check the details and try again.</p>
                </div>
            `
    }

    resultDiv.style.display = "block"

    submitBtn.disabled = false
    submitBtn.textContent = "Verify Certificate"
  }, 1500)
}

function filterCertificates() {
  const searchTerm = document.getElementById("searchCerts").value.toLowerCase()
  const statusFilter = document.getElementById("statusFilter").value

  const filteredCerts = certificates.filter((cert) => {
    const matchesSearch =
      cert.name.toLowerCase().includes(searchTerm) || cert.issuedBy.toLowerCase().includes(searchTerm)
    const matchesStatus = !statusFilter || cert.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Update certificates grid
  const certificatesGrid = document.getElementById("certificatesGrid")

  if (filteredCerts.length === 0) {
    certificatesGrid.innerHTML = '<p class="no-certificates">No certificates match your search criteria.</p>'
    return
  }

  certificatesGrid.innerHTML = filteredCerts
    .map(
      (cert) => `
        <div class="certificate-card">
            <h4>${cert.name}</h4>
            <p><strong>Issued by:</strong> ${cert.issuedBy}</p>
            <p><strong>Issue Date:</strong> ${formatDate(cert.issueDate)}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${cert.status}">${cert.status}</span></p>
            <button class="view-details-btn" onclick="viewCertificateDetails(${cert.id})">View Details</button>
        </div>
    `,
    )
    .join("")
}


async function loadUserProfile() {
  try {
    const response = await fetch('/api/me');
    if (response.ok) {
      const data = await response.json();
      const userEmailInput = document.getElementById("userEmail");
      if (userEmailInput) userEmailInput.value = data.email || 'No email provided';
    } else {
      console.error("Failed to load user profile");
      const userEmailInput = document.getElementById("userEmail");
      if (userEmailInput) userEmailInput.value = "Error loading email";
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

function setupSettingsControls() {
  // Load email initially
  loadUserProfile();

  const requestOtpBtn = document.getElementById("requestOtpBtn");
  const resendOtpBtn = document.getElementById("resendOtpBtn");
  const otpSection = document.getElementById("otpSection");
  const cancelOtpBtn = document.getElementById("cancelOtpBtn");
  const confirmPasswordBtn = document.getElementById("confirmPasswordBtn");

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
      document.getElementById("passwordSection").style.display = "block";
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
        return alert("Both OTP and new password are required.");
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
          showToast(result.message, 'success');
          // Reset view
          document.getElementById("passwordSection").style.display = "block";
          otpSection.style.display = "none";
          document.getElementById("otpInput").value = "";
          document.getElementById("newPasswordInput").value = "";
          if (otpTimer) clearInterval(otpTimer);
        } else {
          showToast("Error: " + (result.error || "Failed to update password"), 'error');
        }
      } catch (err) {
        showToast("Server error.", 'error');
      } finally {
        confirmPasswordBtn.disabled = false;
        confirmPasswordBtn.textContent = "Update Password";
      }
    });
  }

  const logoutSettingsBtn = document.getElementById("logoutSettingsBtn");
  if (logoutSettingsBtn) {
    logoutSettingsBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to log out?")) {
        window.location.href = "/employee-login/employee-login.html";
      }
    });
  }
}

// Utility functions
function showNotification(message, type = "info") {
  // Simple notification system
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `

  if (type === "success") notification.style.background = "#16a34a"
  else if (type === "error") notification.style.background = "#dc2626"
  else notification.style.background = "#3b82f6"

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.remove()
  }, 3000)
}

// Add CSS animation for notifications
const style = document.createElement("style")
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`
document.head.appendChild(style)

// Global function for removing file
window.clearVerificationFile = () => {
  const uploadBtn = document.getElementById("uploadCertificateBtn")
  const fileInput = document.getElementById("verifyFileInput")
  const verifyButtonContainer = document.getElementById("verifyButtonContainer")
  const statusIndicator = document.getElementById("statusIndicator")
  const statusText = document.getElementById("statusText")

  // Reset upload button
  uploadBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14,2 14,8 20,8"></polyline>
      <line x1="12" y1="18" x2="12" y2="12"></line>
      <polyline points="9,15 12,12 15,15"></polyline>
    </svg>
    Upload Certificate
  `

  // Reset file input value
  fileInput.value = ""

  // Hide verify button
  verifyButtonContainer.style.display = "none"

  // Remove file preview
  const filePreview = document.querySelector(".file-preview-verify")
  if (filePreview) {
    filePreview.remove()
  }

  // Reset status
  window.updateVerificationStatus("", "Awaiting upload")
}

function updateVerificationStatus(status, text) {
  const statusIndicator = document.getElementById("statusIndicator")
  const statusText = document.getElementById("statusText")

  if (!statusIndicator || !statusText) return

  statusIndicator.className = `status-indicator ${status}`
  statusText.textContent = text

  // Update icon based on status
  let iconSvg = ""
  switch (status) {
    case "uploaded":
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7,10 12,15 17,10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>`
      break
    case "verifying":
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 11-6.219-8.56"></path>
      </svg>`
      break
    case "verified":
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>`
      break
    case "invalid":
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`
      break
    default:
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12,6 12,12 16,14"></polyline>
      </svg>`
  }

  statusIndicator.querySelector("svg").outerHTML = iconSvg
}

function renderAppNotifications() {
  const container = document.getElementById("notificationsListContainer");
  const badge = document.getElementById("notificationBadge");
  
  if (badge) {
    if (appNotifications.length > 0 && currentSection !== "notifications") {
      badge.style.display = "flex";
      badge.textContent = appNotifications.length;
    } else {
      badge.style.display = "none";
    }
  }

  if (!container) return;

  if (appNotifications.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No new notifications</p>';
    return;
  }

  container.innerHTML = appNotifications.map(n => `
    <div class="notification-item">
        <div class="notification-icon">${n.icon}</div>
        <div class="notification-content">
            <h4>${n.title}</h4>
            <p>${n.message}</p>
            <span class="notification-time">${Math.floor((new Date() - n.time) / 60000) === 0 ? 'Just now' : Math.floor((new Date() - n.time) / 60000) + ' minutes ago'}</span>
        </div>
    </div>
  `).join('');
}

// Call render on load
document.addEventListener("DOMContentLoaded", () => {
  renderAppNotifications();
});
