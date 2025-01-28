const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwkdCnCyYt3HZexrPX_VfhvNmNvxPihafj2-NxVFZL1X9HgYU0kNgcElMF8YZ_ZIPpIkg/exec";

class InviteCodeForm {
  constructor() {
    this.form = document.getElementById("inviteForm");
    this.emailInput = document.getElementById("email");
    this.submitButton = document.getElementById("submitButton");
    this.responseMessage = document.getElementById("responseMessage");
    this.emailValidation = document.getElementById("emailValidation");
    this.remainingRequests = document.getElementById("remainingRequests");
    this.cooldownTimer = document.getElementById("cooldownTimer");
    this.cooldownTime = document.getElementById("cooldownTime");
    this.lastUpdate = document.getElementById("lastUpdate");
    
    this.form.addEventListener("submit", this.handleSubmit.bind(this));
    this.emailInput.addEventListener("input", this.validateEmail.bind(this));
    
    this.initializeCopyright();
    this.initializeLastUpdate();
    this.initializeRequestCount();
    this.checkCooldown();
  }

  initializeCopyright() {
    document.getElementById("copyright-year").textContent = new Date().getFullYear();
  }

  initializeLastUpdate() {
    const now = new Date();
    this.lastUpdate.textContent = now.toLocaleString('zh-TW');
  }

  initializeRequestCount() {
    const count = localStorage.getItem('remainingRequests') || 5;
    this.updateRequestCount(count);
  }

  updateRequestCount(count) {
    this.remainingRequests.textContent = count;
    localStorage.setItem('remainingRequests', count);
    
    if (count <= 1) {
      this.remainingRequests.classList.add('requests-low');
    } else if (count <= 2) {
      this.remainingRequests.classList.add('requests-medium');
    }
  }

  validateEmail() {
    const email = this.emailInput.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email === '') {
      this.emailValidation.textContent = '';
      return false;
    }
    
    if (emailRegex.test(email)) {
      this.emailValidation.textContent = '✓ 有效的電子郵件格式';
      this.emailValidation.className = 'text-xs mt-1 email-valid';
      return true;
    } else {
      this.emailValidation.textContent = '✗ 無效的電子郵件格式';
      this.emailValidation.className = 'text-xs mt-1 email-invalid';
      return false;
    }
  }

  checkCooldown() {
    const lastRequest = localStorage.getItem('lastRequestTime');
    if (lastRequest) {
      const cooldownEnd = new Date(parseInt(lastRequest) + 4 * 60 * 60 * 1000); // 4 hours
      const now = new Date();
      
      if (now < cooldownEnd) {
        this.startCooldownTimer(cooldownEnd);
        return false;
      }
    }
    return true;
  }

  startCooldownTimer(endTime) {
    this.cooldownTimer.classList.remove('hidden');
    
    const updateTimer = () => {
      const now = new Date();
      const timeLeft = endTime - now;
      
      if (timeLeft <= 0) {
        this.cooldownTimer.classList.add('hidden');
        this.submitButton.disabled = false;
        return;
      }
      
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
      
      this.cooldownTime.textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      this.submitButton.disabled = true;
      
      setTimeout(updateTimer, 1000);
    };
    
    updateTimer();
  }

  setLoading(isLoading) {
    if (isLoading) {
      this.submitButton.classList.add("loading");
      this.submitButton.disabled = true;
    } else {
      this.submitButton.classList.remove("loading");
      this.submitButton.disabled = false;
    }
  }

  showMessage(message, type) {
    this.responseMessage.textContent = message;
    this.responseMessage.classList.remove("text-gray-600", "text-green-500", "text-red-500");
    this.responseMessage.classList.add(`text-${type}-500`);
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    if (!this.validateEmail()) {
      this.showMessage("請輸入有效的電子郵件地址", "red");
      return;
    }

    if (!this.checkCooldown()) {
      this.showMessage("請等待冷卻時間結束後再試", "red");
      return;
    }

    const captchaResponse = hcaptcha.getResponse();
    if (!captchaResponse) {
      this.showMessage("請完成驗證碼確認", "red");
      return;
    }

    const email = this.emailInput.value;
    
    this.setLoading(true);
    this.showMessage("正在處理，請稍候...", "gray");

    try {
      const response = await fetch(
        `${SCRIPT_URL}?action=generate&email=${encodeURIComponent(email)}&captcha=${encodeURIComponent(captchaResponse)}`,
        { method: "GET" }
      );

      const result = await response.json();

      if (result.valid) {
        this.showMessage(`邀請碼已發送至您的電子郵件：${email}`, "green");
        this.form.reset();
        hcaptcha.reset();
        
        // Update cooldown and request count
        localStorage.setItem('lastRequestTime', new Date().getTime());
        const remainingRequests = parseInt(this.remainingRequests.textContent) - 1;
        this.updateRequestCount(remainingRequests);
        this.checkCooldown();
      } else {
        this.showMessage(`錯誤：${result.message}`, "red");
        hcaptcha.reset();
      }
    } catch (error) {
      console.error("Error:", error);
      this.showMessage("無法申請邀請碼，請稍後再試！", "red");
      hcaptcha.reset();
    } finally {
      this.setLoading(false);
    }
  }
}

// Initialize the form handler
new InviteCodeForm();