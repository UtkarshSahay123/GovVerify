// Language translations
const translations = {
  en: {
    "Verify Your Credentials": "Verify Your Credentials",
    "Check the authenticity of certificates issued by educational institutions and government agencies with our secure and reliable platform.":
      "Check the authenticity of certificates issued by educational institutions and government agencies with our secure and reliable platform.",
    "Get Started": "Get Started",
    "Forging is an Offensive Crime": "Forging is an Offensive Crime",
    "Forgery of documents is a serious criminal offense under the Indian Penal Code, 1860. It is crucial to understand the legal ramifications to deter such activities.":
      "Forgery of documents is a serious criminal offense under the Indian Penal Code, 1860. It is crucial to understand the legal ramifications to deter such activities.",
    "Section 463: Forgery": "Section 463: Forgery",
    "Section 465: Punishment for Forgery": "Section 465: Punishment for Forgery",
    "Section 468: Forgery for Purpose of Cheating": "Section 468: Forgery for Purpose of Cheating",
    "Choose Your Designation": "Choose Your Designation",
    "Select your role to begin the verification process.": "Select your role to begin the verification process.",
    Student: "Student",
    Employee: "Employee",
    University: "University",
    Government: "Government",
    Users: "Users",
    "Certificates Verified": "Certificates Verified",
    "Total Certificates Uploaded": "Total Certificates Uploaded",
    "Connected Universities & Colleges": "Connected Universities & Colleges",
    "Contact Us": "Contact Us",
    "Quick Links": "Quick Links",
    "Related Portals": "Related Portals",
    "About Us": "About Us",
    Resources: "Resources",
    Settings: "Settings",
    "Terms and Conditions": "Terms and Conditions",
    "Privacy Policy": "Privacy Policy",
    Disclaimer: "Disclaimer",
    Feedback: "Feedback",
    "National Portal of India": "National Portal of India",
    "Education Department of Jharkhand": "Education Department of Jharkhand",
    "© 2024 GovVerify, Government of Jharkhand. All Rights Reserved.":
      "© 2024 GovVerify, Government of Jharkhand. All Rights Reserved.",
  },
  hi: {
    "Verify Your Credentials": "अपनी साख सत्यापित करें",
    "Check the authenticity of certificates issued by educational institutions and government agencies with our secure and reliable platform.":
      "हमारे सुरक्षित और विश्वसनीय प्लेटफॉर्म के साथ शैक्षणिक संस्थानों और सरकारी एजेंसियों द्वारा जारी प्रमाणपत्रों की प्रामाणिकता की जांच करें।",
    "Get Started": "शुरू करें",
    "Forging is an Offensive Crime": "जालसाजी एक आपराधिक अपराध है",
    "Forgery of documents is a serious criminal offense under the Indian Penal Code, 1860. It is crucial to understand the legal ramifications to deter such activities.":
      "दस्तावेजों की जालसाजी भारतीय दंड संहिता, 1860 के तहत एक गंभीर आपराधिक अपराध है। ऐसी गतिविधियों को रोकने के लिए कानूनी परिणामों को समझना महत्वपूर्ण है।",
    "Section 463: Forgery": "धारा 463: जालसाजी",
    "Section 465: Punishment for Forgery": "धारा 465: जालसाजी के लिए सजा",
    "Section 468: Forgery for Purpose of Cheating": "धारा 468: धोखाधड़ी के उद्देश्य से जालसाजी",
    "Choose Your Designation": "अपना पदनाम चुनें",
    "Select your role to begin the verification process.": "सत्यापन प्रक्रिया शुरू करने के लिए अपनी भूमिका का चयन करें।",
    Student: "छात्र",
    Employee: "कर्मचारी",
    University: "विश्वविद्यालय",
    Government: "सरकार",
    Users: "उपयोगकर्ता",
    "Certificates Verified": "प्रमाणपत्र सत्यापित",
    "Total Certificates Uploaded": "कुल प्रमाणपत्र अपलोड",
    "Connected Universities & Colleges": "जुड़े विश्वविद्यालय और कॉलेज",
    "Contact Us": "संपर्क करें",
    "Quick Links": "त्वरित लिंक",
    "Related Portals": "संबंधित पोर्टल",
    "About Us": "हमारे बारे में",
    Resources: "संसाधन",
    Settings: "सेटिंग्स",
    "Terms and Conditions": "नियम और शर्तें",
    "Privacy Policy": "गोपनीयता नीति",
    Disclaimer: "अस्वीकरण",
    Feedback: "प्रतिक्रिया",
    "National Portal of India": "भारत का राष्ट्रीय पोर्टल",
    "Education Department of Jharkhand": "झारखंड शिक्षा विभाग",
    "© 2024 GovVerify, Government of Jharkhand. All Rights Reserved.":
      "© 2024 गवर्नवेरिफाई, झारखंड सरकार। सभी अधिकार सुरक्षित।",
  },
}

// Global variables
let currentSlide = 0
let slideInterval
let isSlideShowPaused = false
let currentLanguage = "en"

// DOM elements
// DOM elements
const getStartedBtn = document.getElementById("getStartedBtn")
const languageSelect = document.getElementById("languageSelect")
const prevBtn = document.getElementById("prevBtn")
const nextBtn = document.getElementById("nextBtn")
const slides = document.querySelectorAll(".slide")
const indicators = document.querySelectorAll(".indicator")
const designationCards = document.querySelectorAll(".designation-card")

//Reload by clicking logo
    document.getElementById('reloadText').addEventListener('click', function() {
        location.reload();
    });

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeSlideshow()
  initializeEventListeners()
  initializeLanguage()
  fetchLiveStats()
})

// Fetch live statistics from the server
async function fetchLiveStats() {
  try {
    const response = await fetch('/api/stats');
    if (response.ok) {
      const stats = await response.json();
      document.getElementById('statUsers').textContent = stats.users + "+";
      document.getElementById('statVerified').textContent = stats.verified + "+";
      document.getElementById('statUploaded').textContent = stats.uploaded + "+";
      document.getElementById('statUniversities').textContent = stats.universities + "+";
    }
  } catch (error) {
    console.error('Failed to fetch live stats:', error);
  }
}

// Initialize slideshow
function initializeSlideshow() {
  startSlideshow()

  // Add click events to indicators
  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      goToSlide(index)
      pauseSlideshow()
    })
  })
}

// Initialize event listeners
function initializeEventListeners() {
  // Get Started button scroll
  getStartedBtn.addEventListener("click", () => {
    document.getElementById("designation").scrollIntoView({
      behavior: "smooth",
    })
  })

  // Language selector
  languageSelect.addEventListener("change", changeLanguage)

  // Slideshow controls
  prevBtn.addEventListener("click", () => {
    previousSlide()
    pauseSlideshow()
  })

  nextBtn.addEventListener("click", () => {
    nextSlide()
    pauseSlideshow()
  })

  // Designation cards
  designationCards.forEach((card) => {
    card.addEventListener("click", () => {
      const role = card.getAttribute("data-role")
      handleDesignationClick(role)
    })
  })
}

// Initialize language
function initializeLanguage() {
  const savedLanguage = localStorage.getItem("govverify-language") || "en"
  languageSelect.value = savedLanguage
  currentLanguage = savedLanguage
  updateLanguage()
}

// Change language
function changeLanguage() {
  currentLanguage = languageSelect.value
  localStorage.setItem("govverify-language", currentLanguage)
  updateLanguage()
}

// Update language
function updateLanguage() {
  const elements = document.querySelectorAll("[data-en]")
  elements.forEach((element) => {
    const englishText = element.getAttribute("data-en")
    const hindiText = element.getAttribute("data-hi")

    if (currentLanguage === "hi" && hindiText) {
      element.textContent = hindiText
    } else {
      element.textContent = englishText
    }
  })
}

// Slideshow functions
function startSlideshow() {
  slideInterval = setInterval(() => {
    if (!isSlideShowPaused) {
      nextSlide()
    }
  }, 2000)
}

function pauseSlideshow() {
  isSlideShowPaused = true
  setTimeout(() => {
    isSlideShowPaused = false
  }, 5000)
}

function goToSlide(index) {
  slides[currentSlide].classList.remove("active")
  indicators[currentSlide].classList.remove("active")

  currentSlide = index

  slides[currentSlide].classList.add("active")
  indicators[currentSlide].classList.add("active")
}

function nextSlide() {
  const nextIndex = (currentSlide + 1) % slides.length
  goToSlide(nextIndex)
}

function previousSlide() {
  const prevIndex = (currentSlide - 1 + slides.length) % slides.length
  goToSlide(prevIndex)
}

// Handle designation card clicks
function handleDesignationClick(role) {
  if (role === "student") {
    // Create fade-out effect
    document.body.style.transition = "opacity 0.8s";
    document.body.style.opacity = "1";
    setTimeout(() => {
      document.body.style.opacity = "0";
    }, 200); // Start fade after 0.2s

    setTimeout(() => {
      window.location.href = "../student-login/student-login.html";
    }, 1000); // Redirect after 1s
    return;
  }
  if (role === "employee") {
    document.body.style.transition = "opacity 0.8s";
    document.body.style.opacity = "1";
    setTimeout(() => {
      document.body.style.opacity = "0";
    }, 200);
    setTimeout(() => {
      window.location.href = "../employee-login/employee-login.html";
    }, 1000);
    return;
  }
  const messages = {
    en: {
      university: "University portal coming soon!",
      government: "Government portal coming soon!",
    },
    hi: {
      university: "विश्वविद्यालय पोर्टल जल्द आ रहा है!",
      government: "सरकारी पोर्टल जल्द आ रहा है!",
    },
  };
  alert(messages[currentLanguage][role]);
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})

// Add loading animation for images
function preloadImages() {
  const imageUrls = [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Home.jpg-g9DB47bYSYJ1S7SrNNruR2DzTq2tyI.jpeg",
    "/modern-government-office-building.jpg",
    "/university-campus.png",
  ]

  imageUrls.forEach((url) => {
    const img = new Image()
    img.src = url
  })
}

// Call preload on page load
window.addEventListener("load", preloadImages)

// Add keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    previousSlide()
    pauseSlideshow()
  } else if (e.key === "ArrowRight") {
    nextSlide()
    pauseSlideshow()
  }
})

// Add touch/swipe support for mobile
let touchStartX = 0
let touchEndX = 0

document.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX
})

document.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX
  handleSwipe()
})

function handleSwipe() {
  const swipeThreshold = 50
  const diff = touchStartX - touchEndX

  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      // Swipe left - next slide
      nextSlide()
      pauseSlideshow()
    } else {
      // Swipe right - previous slide
      previousSlide()
      pauseSlideshow()
    }
  }
}

// Add intersection observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1"
      entry.target.style.transform = "translateY(0)"
    }
  })
}, observerOptions)

// Observe elements for animation
document.querySelectorAll(".legal-card, .designation-card, .stat-item").forEach((el) => {
  el.style.opacity = "0"
  el.style.transform = "translateY(20px)"
  el.style.transition = "opacity 0.6s ease, transform 0.6s ease"
  observer.observe(el)
})

console.log("GovVerify website initialized successfully!")
