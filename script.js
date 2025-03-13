let visibleSchools = [];
let hiddenSchools = [];
let instructionModalShown = false;

// API endpoints
const SCHOOL_DATA_API =
  "https://script.google.com/macros/s/AKfycbxPYKlbLVjHQttsxWN1ZGC9w5YPRvaT8Ae5DFmhdhbfRdatEomuZ1HYt5Z98OJiXlUX/exec";
const INVITE_CODE_API =
  "https://script.google.com/macros/s/AKfycbwkdCnCyYt3HZexrPX_VfhvNmNvxPihafj2-NxVFZL1X9HgYU0kNgcElMF8YZ_ZIPpIkg/exec"; // Replace with your actual Apps Script URL

async function fetchSchoolData() {
  try {
    document.getElementById("loadingSpinner").style.display = "flex";
    document.getElementById("hiddenLoadingSpinner").style.display = "flex";

    const response = await fetch(SCHOOL_DATA_API);
    const data = await response.json();

    document.getElementById("loadingSpinner").style.display = "none";
    document.getElementById("hiddenLoadingSpinner").style.display = "none";

    document.querySelector("#schoolList table").style.display = "table";
    document.querySelector("#hiddenContent table").style.display = "table";

    visibleSchools = data.visibleSchools;
    hiddenSchools = data.hiddenSchools;
    populateSchoolTable(visibleSchools, "schoolTableBody");
    populateSchoolTable(hiddenSchools, "hiddenSchoolTableBody");
    animateFadeIn();
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("loadingSpinner").style.display = "none";
    document.getElementById("hiddenLoadingSpinner").style.display = "none";
    document.getElementById("schoolList").innerHTML +=
      '<p class="text-red-500 text-center">加載數據時出錯，請稍後再試。</p>';
  }
}

async function checkInviteCode() {
  const userCode = document.getElementById("inviteCode").value;
  if (!userCode) {
    alert("請輸入邀請碼");
    return;
  }

  // 顯示加載動畫
  document.getElementById("loadingAnimation").classList.remove("hidden");
  document.getElementById("successAnimation").classList.add("hidden");
  document.getElementById("errorAnimation").classList.add("hidden");

  try {
    const response = await fetch(
      `${INVITE_CODE_API}?code=${userCode}&action=verify`
    );
    const data = await response.json();

    // 隱藏加載動畫
    document.getElementById("loadingAnimation").classList.add("hidden");

    if (data.valid) {
      // 顯示成功動畫
      document.getElementById("successAnimation").classList.remove("hidden");
      document.getElementById("successAnimation").classList.add("show");
      // 顯示隱藏內容
      document.getElementById("hiddenContent").style.display = "block";
      setTimeout(() => {
        document.getElementById("hiddenContent").classList.add("active");
      }, 50);
    } else {
      // 顯示失敗動畫
      document.getElementById("errorAnimation").classList.remove("hidden");
      document.getElementById("errorAnimation").classList.add("show");
    }
  } catch (error) {
    console.error("Error verifying invite code:", error);
    // 隱藏加載動畫
    document.getElementById("loadingAnimation").classList.add("hidden");
    // 顯示失敗動畫
    document.getElementById("errorAnimation").classList.remove("hidden");
    document.getElementById("errorAnimation").classList.add("show");
    alert("驗證邀請碼時發生錯誤，請稍後再試");
  }
}

function populateSchoolTable(schools, tableId) {
  const tableBody = document.getElementById(tableId);
  tableBody.innerHTML = "";
  if (schools.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="3" class="px-3 sm:px-8 py-4 sm:py-6 text-center text-gray-500">沒有找到匹配的結果</td></tr>';
  } else {
    schools.forEach((school, index) => {
      const row = `
        <tr class="bg-white fade-in" style="transition-delay: ${index * 50}ms;">
          <td class="px-3 sm:px-8 py-4 sm:py-6 text-base sm:text-xl">${school.name}</td>
          <td class="px-3 sm:px-8 py-4 sm:py-6 text-base sm:text-xl">${school.department}</td>
          <td class="px-3 sm:px-8 py-4 sm:py-6 font-semibold text-indigo-600 text-base sm:text-xl">${school.score}</td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  }
  animateFadeIn();
}

function searchSchools() {
  const searchQuery = document.getElementById("searchInput").value.toLowerCase();
  const filteredVisible = visibleSchools.filter(
    (school) =>
      school.name.toLowerCase().includes(searchQuery) ||
      school.department.toLowerCase().includes(searchQuery)
  );
  const filteredHidden = hiddenSchools.filter(
    (school) =>
      school.name.toLowerCase().includes(searchQuery) ||
      school.department.toLowerCase().includes(searchQuery)
  );

  populateSchoolTable(filteredVisible, "schoolTableBody");
  populateSchoolTable(filteredHidden, "hiddenSchoolTableBody");
}

function animateFadeIn() {
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add("active");
    }, index * 100);
  });
}

function goToMainFunction() {
  window.location.href = "https://sites.google.com/view/tyctw/";
}

function toggleMenu() {
  const menu = document.getElementById("fullscreenMenu");
  menu.classList.toggle("active");
  const menuToggle = document.querySelector(".menu-toggle i");
  menuToggle.classList.toggle("fa-bars");
  menuToggle.classList.toggle("fa-times");

  if (menu.classList.contains("active")) {
    const links = menu.querySelectorAll("a");
    links.forEach((link, index) => {
      setTimeout(() => {
        link.style.opacity = "1";
        link.style.transform = "translateY(0)";
      }, index * 100);
    });
  } else {
    const links = menu.querySelectorAll("a");
    links.forEach((link) => {
      link.style.opacity = "0";
      link.style.transform = "translateY(20px)";
    });
  }
}

function showInstructionModal() {
  const modal = document.getElementById('instructionModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function hideInstructionModal() {
  const modal = document.getElementById('instructionModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function toggleInstructionModal() {
  const modal = document.getElementById('instructionModal');
  if (modal.classList.contains('active')) {
    hideInstructionModal();
  } else {
    showInstructionModal();
  }
}

function checkAndShowInstructions() {
  const hasSeenInstructions = localStorage.getItem('instructionModalShown');
  if (!hasSeenInstructions) {
    // Show instructions after a short delay for better UX
    setTimeout(showInstructionModal, 800);
  }
}

// Event listeners
window.addEventListener("load", fetchSchoolData);
window.addEventListener("load", checkAndShowInstructions);
window.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("selectstart", (e) => e.preventDefault());

window.addEventListener("load", () => {
  animateFadeIn();
});

// 禁用快捷鍵
document.addEventListener("keydown", function (e) {
  if (
    e.ctrlKey &&
    (e.key === "c" || e.key === "C" || e.key === "a" || e.key === "A" || e.key === "x" || e.key === "X")
  ) {
    e.preventDefault();
  }
});

// 檢測開發者工具
setInterval(function () {
  const devToolsOpened = function () {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    return widthThreshold || heightThreshold;
  };

  if (devToolsOpened()) {
    document.body.innerHTML = "<h1>請勿使用開發者工具！</h1>";
    window.location.reload();
  }
}, 1000);