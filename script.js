// API endpoints
const SCHOOL_DATA_API =
  "https://script.google.com/macros/s/AKfycbxPYKlbLVjHQttsxWN1ZGC9w5YPRvaT8Ae5DFmhdhbfRdatEomuZ1HYt5Z98OJiXlUX/exec";
const INVITE_CODE_API =
  "https://script.google.com/macros/s/AKfycbwkdCnCyYt3HZexrPX_VfhvNmNvxPihafj2-NxVFZL1X9HgYU0kNgcElMF8YZ_ZIPpIkg/exec"; 

let visibleSchools = [];
let hiddenSchools = [];
let instructionModalShown = false;
let bookmarks = JSON.parse(localStorage.getItem('schoolBookmarks') || '[]');

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
    
    // Apply bookmarks after populating tables
    applyBookmarks();
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

  document.getElementById("loadingAnimation").classList.remove("hidden");
  document.getElementById("successAnimation").classList.remove("show");
  document.getElementById("errorAnimation").classList.remove("show");
  document.getElementById("successAnimation").classList.add("hidden");
  document.getElementById("errorAnimation").classList.add("hidden");

  try {
    const response = await fetch(
      `${INVITE_CODE_API}?code=${userCode}&action=verify`
    );
    const data = await response.json();

    setTimeout(() => {
      document.getElementById("loadingAnimation").classList.add("hidden");

      if (data.valid) {
        document.getElementById("successAnimation").classList.remove("hidden");
        setTimeout(() => {
          document.getElementById("successAnimation").classList.add("show");
          setTimeout(() => {
            document.getElementById("hiddenContent").style.display = "block";
            setTimeout(() => {
              document.getElementById("hiddenContent").classList.add("active");
            }, 50);
          }, 1000);
        }, 100);
      } else {
        document.getElementById("errorAnimation").classList.remove("hidden");
        setTimeout(() => {
          document.getElementById("errorAnimation").classList.add("show");
        }, 100);
      }
    }, 1500);
  } catch (error) {
    console.error("Error verifying invite code:", error);
    setTimeout(() => {
      document.getElementById("loadingAnimation").classList.add("hidden");
      document.getElementById("errorAnimation").classList.remove("hidden");
      setTimeout(() => {
        document.getElementById("errorAnimation").classList.add("show");
      }, 100);
    }, 1500);
    alert("驗證邀請碼時發生錯誤，請稍後再試");
  }
}

function populateSchoolTable(schools, tableId) {
  const tableBody = document.getElementById(tableId);
  tableBody.innerHTML = "";
  if (schools.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="4" class="px-3 sm:px-8 py-4 sm:py-6 text-center text-gray-500">沒有找到匹配的結果</td></tr>';
  } else {
    schools.forEach((school, index) => {
      const isBookmarked = bookmarks.some(b => b.name === school.name && b.department === school.department);
      const bookmarkIcon = isBookmarked ? 'fas fa-bookmark bookmarked' : 'far fa-bookmark';
      
      const row = `
        <tr class="bg-white fade-in" style="transition-delay: ${index * 50}ms;" data-school-name="${school.name}" data-department="${school.department}">
          <td class="px-3 sm:px-8 py-4 sm:py-6 text-base sm:text-xl"><i class="fas fa-school text-indigo-500 mr-2"></i>${school.name}</td>
          <td class="px-3 sm:px-8 py-4 sm:py-6 text-base sm:text-xl"><i class="fas fa-book-open text-green-500 mr-2"></i>${school.department}</td>
          <td class="px-3 sm:px-8 py-4 sm:py-6 font-semibold text-indigo-600 text-base sm:text-xl"><div class="inline-block px-3 py-1 rounded-full bg-indigo-100">${school.score}</div></td>
          <td class="px-3 sm:px-8 py-4 sm:py-6 text-center">
            <button onclick="toggleBookmark('${school.name}', '${school.department}', '${school.score}')" class="bookmark-btn">
              <i class="${bookmarkIcon} text-xl"></i>
            </button>
          </td>
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

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDarkMode);
  
  // Update toggle state
  document.getElementById('darkModeToggle').checked = isDarkMode;
}

function checkDarkModePreference() {
  const darkModePreference = localStorage.getItem('darkMode');
  if (darkModePreference === 'true') {
    document.body.classList.add('dark-mode');
    document.getElementById('darkModeToggle').checked = true;
  }
}

function toggleScrollToTopButton() {
  const scrollButton = document.getElementById('scrollToTopBtn');
  if (window.pageYOffset > 300) {
    scrollButton.classList.add('visible');
  } else {
    scrollButton.classList.remove('visible');
  }
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

function toggleBookmark(name, department, score) {
  const bookmarkIndex = bookmarks.findIndex(b => b.name === name && b.department === department);
  
  if (bookmarkIndex !== -1) {
    // Remove bookmark
    bookmarks.splice(bookmarkIndex, 1);
  } else {
    // Add bookmark
    bookmarks.push({ name, department, score });
  }
  
  // Save to localStorage
  localStorage.setItem('schoolBookmarks', JSON.stringify(bookmarks));
  
  // Update UI
  applyBookmarks();
  
  // Refresh bookmark modal if it's open
  if (document.getElementById('bookmarkModal').classList.contains('active')) {
    showBookmarks();
  }
}

function applyBookmarks() {
  // Update bookmark icons
  document.querySelectorAll('tr[data-school-name]').forEach(row => {
    const name = row.getAttribute('data-school-name');
    const department = row.getAttribute('data-department');
    const isBookmarked = bookmarks.some(b => b.name === name && b.department === department);
    
    const bookmarkBtn = row.querySelector('.bookmark-btn i');
    if (bookmarkBtn) {
      if (isBookmarked) {
        bookmarkBtn.className = 'fas fa-bookmark bookmarked text-xl';
      } else {
        bookmarkBtn.className = 'far fa-bookmark text-xl';
      }
    }
  });
}

function showBookmarks() {
  const modal = document.getElementById('bookmarkModal');
  const modalContent = document.getElementById('bookmarkModalContent');
  
  if (bookmarks.length === 0) {
    modalContent.innerHTML = '<p class="text-center py-4">您還 沒有收藏任何學校</p>';
  } else {
    let html = '<ul class="bookmark-list bookmark-modal">';
    
    bookmarks.forEach(bookmark => {
      html += `
        <li>
          <div>
            <strong>${bookmark.name}</strong> - ${bookmark.department}
            <div class="text-indigo-600 font-semibold">${bookmark.score}</div>
          </div>
          <button onclick="toggleBookmark('${bookmark.name}', '${bookmark.department}')">
            <i class="fas fa-trash"></i>
          </button>
        </li>
      `;
    });
    
    html += '</ul>';
    modalContent.innerHTML = html;
  }
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
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
    setTimeout(showInstructionModal, 800);
  }
}

function showSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function changeFontSize(size) {
  const rootElement = document.documentElement;
  switch(size) {
    case 'small':
      rootElement.style.fontSize = '14px';
      break;
    case 'medium':
      rootElement.style.fontSize = '16px';
      break;
    case 'large':
      rootElement.style.fontSize = '18px';
      break;
  }
  localStorage.setItem('fontSize', size);
}

function toggleMenu() {
  const menu = document.getElementById('fullscreenMenu');
  menu.classList.toggle('active');
  const menuToggle = document.querySelector('.menu-toggle i');
  menuToggle.classList.toggle('fa-bars');
  menuToggle.classList.toggle('fa-times');

  if (menu.classList.contains('active')) {
    const links = menu.querySelectorAll('a');
    links.forEach((link, index) => {
      setTimeout(() => {
        link.style.opacity = '1';
        link.style.transform = 'translateY(0)';
      }, index * 100);
    });
  } else {
    const links = menu.querySelectorAll('a');
    links.forEach((link) => {
      link.style.opacity = '0';
      link.style.transform = 'translateY(20px)';
    });
  }
}

function goToMainFunction() {
  window.location.href = 'https://sites.google.com/view/tyctw/';
}

function updateYearDisplay() {
  // Calculate ROC year (Taiwan calendar: Western year - 1911)
  const westernYear = new Date().getFullYear();
  const rocYear = westernYear - 1911;
  
  // Update year in title (current year)
  document.getElementById("currentYear").textContent = rocYear;
  
  // Update year in footer (western year)
  document.getElementById("footerYear").textContent = westernYear;
}

// 新菜單功能
function toggleMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const menuNav = document.getElementById('menuNav');
  
  menuToggle.classList.toggle('active');
  menuNav.classList.toggle('active');
  
  // 如果下拉菜單是打開的，關閉它
  const menuDropdown = document.getElementById('menuDropdown');
  if (menuDropdown.classList.contains('active')) {
    menuDropdown.classList.remove('active');
  }
}

function toggleDropdown() {
  const menuDropdown = document.getElementById('menuDropdown');
  menuDropdown.classList.toggle('active');
}

// 處理菜單滾動效果
function handleMenuScroll() {
  const menuContainer = document.getElementById('menuContainer');
  if (window.scrollY > 50) {
    menuContainer.classList.add('scrolled');
  } else {
    menuContainer.classList.remove('scrolled');
  }
}

// 初始化菜單相關事件
function initMenuEvents() {
  // 為下拉菜單按鈕添加點擊事件
  const menuDropdownButton = document.createElement('button');
  menuDropdownButton.className = 'menu-link';
  menuDropdownButton.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
  menuDropdownButton.addEventListener('click', toggleDropdown);
  
  // 在設定按鈕前插入下拉菜單按鈕
  const menuNav = document.getElementById('menuNav');
  const settingsButton = menuNav.querySelector('.menu-button');
  menuNav.insertBefore(menuDropdownButton, settingsButton);
  
  // 添加滾動事件
  window.addEventListener('scroll', handleMenuScroll);
  
  // 點擊其他地方時關閉下拉菜單
  document.addEventListener('click', function(event) {
    const menuDropdown = document.getElementById('menuDropdown');
    const menuDropdownButton = menuNav.querySelector('.menu-link:nth-last-child(2)');
    
    if (menuDropdown.classList.contains('active') && 
        !menuDropdown.contains(event.target) && 
        event.target !== menuDropdownButton && 
        !menuDropdownButton.contains(event.target)) {
      menuDropdown.classList.remove('active');
    }
  });
  
  // 設置活動菜單項
  setActiveMenuItem();
}

// 設置當前活動的菜單項
function setActiveMenuItem() {
  const currentPath = window.location.pathname;
  const menuLinks = document.querySelectorAll('.menu-link');
  
  menuLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href.split('/').pop())) {
      link.classList.add('active');
    } else if (link !== document.querySelector('.menu-link:nth-last-child(2)')) { // 排除下拉菜單按鈕
      link.classList.remove('active');
    }
  });
}

// 添加到現有的初始化函數
window.addEventListener('DOMContentLoaded', function() {
  updateYearDisplay();
  checkDarkModePreference();
  fetchSchoolData();
  toggleScrollToTopButton();
  
  // 初始化新菜單功能
  initMenuEvents();
  
  // 滾動事件
  window.addEventListener('scroll', toggleScrollToTopButton);
  
  // 檢查並顯示說明
  checkAndShowInstructions();
});

window.addEventListener("load", fetchSchoolData);
window.addEventListener("load", checkAndShowInstructions);
window.addEventListener("load", checkDarkModePreference);
window.addEventListener("load", updateYearDisplay);
window.addEventListener("scroll", toggleScrollToTopButton);
window.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("selectstart", (e) => e.preventDefault());

window.addEventListener("load", () => {
  animateFadeIn();
});

document.addEventListener("keydown", function (e) {
  if (
    e.ctrlKey &&
    (e.key === "c" || e.key === "C" || e.key === "a" || e.key === "A" || e.key === "x" || e.key === "X")
  ) {
    e.preventDefault();
  }
});

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