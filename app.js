const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwkdCnCyYt3HZexrPX_VfhvNmNvxPihafj2-NxVFZL1X9HgYU0kNgcElMF8YZ_ZIPpIkg/exec";

class InviteCodeForm {
  constructor() {
    this.form = document.getElementById("inviteForm");
    this.emailInput = document.getElementById("email");
    this.submitButton = document.getElementById("submitButton");
    this.responseMessage = document.getElementById("responseMessage");
    
    this.form.addEventListener("submit", this.handleSubmit.bind(this));
    this.initializeCopyright();
  }

  initializeCopyright() {
    const copyrightYear = document.getElementById("copyright-year");
    copyrightYear.textContent = new Date().getFullYear();
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
    
    if (type === 'red') {
      this.responseMessage.classList.add('shake');
      setTimeout(() => {
        this.responseMessage.classList.remove('shake');
      }, 500);
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    const email = this.emailInput.value;
    
    // Get hCaptcha response
    const captchaResponse = hcaptcha.getResponse();
    
    if (!captchaResponse) {
      this.showMessage("請完成驗證碼確認", "red");
      return;
    }

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