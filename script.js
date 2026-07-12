// API endpoints
const SCHOOL_DATA_API =
  "https://script.google.com/macros/s/AKfycbxPYKlbLVjHQttsxWN1ZGC9w5YPRvaT8Ae5DFmhdhbfRdatEomuZ1HYt5Z98OJiXlUX/exec";

let visibleSchools = [];
let hiddenSchools = [];
let allSchools = [];
let instructionModalShown = false;
let bookmarks = JSON.parse(localStorage.getItem('schoolBookmarks') || '[]');
const schoolDetails = new Map();
let subjectRequirementNote = "如果積分、積點都超過該校錄取要求，就不需再看單科標示；單科標準主要供積分或積點接近門檻時參考。";

async function fetchSchoolData() {
  try {
    document.getElementById("loadingSpinner").style.display = "flex";

    const response = await fetch(SCHOOL_DATA_API);
    const data = await response.json();

    document.getElementById("loadingSpinner").style.display = "none";

    document.querySelector("#schoolList table").style.display = "table";

    subjectRequirementNote = data.subjectRequirementNote || subjectRequirementNote;
    updateSubjectRequirementNotes();
    visibleSchools = normalizeSchools(data.visibleSchools, "visible");
    hiddenSchools = normalizeSchools(data.hiddenSchools, "hidden");
    allSchools = [...visibleSchools, ...hiddenSchools];
    populateSchoolTable(allSchools, "schoolTableBody");
    
    // Apply bookmarks after populating tables
    applyBookmarks();
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("loadingSpinner").style.display = "none";
    document.getElementById("schoolList").innerHTML +=
      '<p class="text-red-500 text-center">加載數據時出錯，請稍後再試。</p>';
  }
}

function normalizeSchools(schools, source) {
  return (Array.isArray(schools) ? schools : []).map((school) => ({
    ...school,
    subjectRequirements: normalizeSubjectRequirements(school),
    ownership: getSchoolOwnership(school),
    source
  }));
}

function getSchoolOwnership(school) {
  const rawValue = [
    school.公私立,
    school.公立私立,
    school.學校類型,
    school.schoolType,
    school.ownership,
    school.type
  ].find((value) => value !== "" && value != null);
  const value = String(rawValue || school.name || "").toLowerCase();

  if (value.includes("私")) return "private";
  if (value.includes("公") || value.includes("國立") || value.includes("市立") || value.includes("縣立")) {
    return "public";
  }

  return "";
}

function normalizeSubjectRequirements(school) {
  if (school.subjectRequirements && Object.keys(school.subjectRequirements).length > 0) {
    return school.subjectRequirements;
  }

  const subjectNames = ["國文", "英語", "數學", "社會", "自然", "寫作測驗"];
  return subjectNames.reduce((requirements, subject) => {
    if (school[subject] !== "" && school[subject] != null) {
      requirements[subject] = school[subject];
    }
    return requirements;
  }, {});
}

function updateSubjectRequirementNotes() {
  document.querySelectorAll("[data-subject-note]").forEach((element) => {
    element.textContent = subjectRequirementNote;
  });
}

function populateSchoolTable(schools, tableId) {
  const tableBody = document.getElementById(tableId);
  tableBody.innerHTML = "";
  schoolDetails.clear();
  if (schools.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="4" class="px-3 sm:px-8 py-4 sm:py-6 text-center text-gray-500">沒有找到匹配的結果</td></tr>';
  } else {
    schools.forEach((school, index) => {
      const schoolId = `${tableId}-${index}`;
      schoolDetails.set(schoolId, school);
      const schoolName = escapeHtml(school.name || '');
      const department = escapeHtml(school.department || '');
      const score = escapeHtml(school.score == null ? '' : school.score);
      const rawScore = school.score == null ? '' : String(school.score);
      const scoreClass = getScoreClass(school.score);
      const isBookmarked = bookmarks.some(b => b.name === school.name && b.department === school.department);
      const bookmarkIcon = isBookmarked ? 'fas fa-bookmark bookmarked' : 'far fa-bookmark';
      
      const row = `
        <tr class="bg-white detail-row" data-school-id="${schoolId}" data-school-name="${schoolName}" data-department="${department}" onclick="showRequirementDetails('${schoolId}')" onkeydown="handleRequirementRowKey(event, '${schoolId}')" tabindex="0" role="button" aria-label="查看${schoolName}${department}各科錄取要求">
          <td class="px-3 sm:px-8 py-4 sm:py-6 text-base sm:text-xl"><i class="fas fa-school text-indigo-500 mr-2"></i>${schoolName}</td>
          <td class="px-3 sm:px-8 py-4 sm:py-6 text-base sm:text-xl"><i class="fas fa-book-open text-green-500 mr-2"></i>${department}</td>
          <td class="px-3 sm:px-8 py-4 sm:py-6 font-semibold text-indigo-600 text-base sm:text-xl">
            <div class="requirement-cell">
              <div class="score-card ${scoreClass}">
                <span class="score-label">錄取門檻</span>
                <span class="score-value">${score || '未提供'}</span>
                <span class="score-meta">${parseScore(rawScore) === null ? '參考條件' : '參考分數'}</span>
              </div>
              <button type="button" class="requirement-detail-btn" onclick="event.stopPropagation(); showRequirementDetails('${schoolId}')">
                <i class="fas fa-list-check"></i>
                <span>查看</span>
              </button>
            </div>
          </td>
          <td class="px-3 sm:px-8 py-4 sm:py-6 text-center">
            <button onclick="event.stopPropagation(); toggleBookmarkById('${schoolId}')" class="bookmark-btn">
              <i class="${bookmarkIcon} text-xl"></i>
            </button>
          </td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  }
}

function handleRequirementRowKey(event, schoolId) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    showRequirementDetails(schoolId);
  }
}

function showRequirementDetails(schoolId) {
  const school = schoolDetails.get(schoolId);
  if (!school) return;

  const modal = document.getElementById('requirementModal');
  const modalContent = document.getElementById('requirementModalContent');
  const requirements = getRequirementItems(school);

  modalContent.innerHTML = `
    <div class="requirement-summary">
      <div class="requirement-school">${escapeHtml(school.name || '未命名學校')}</div>
      <div class="requirement-department">${escapeHtml(school.department || '未命名科別')}</div>
    </div>
    <p class="subject-rule-note">${escapeHtml(subjectRequirementNote)}</p>
    <div class="requirement-list">
      ${requirements.map(item => `
        <div class="requirement-item">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
        </div>
      `).join('')}
    </div>
    ${school.note ? `<p class="requirement-note">${escapeHtml(school.note)}</p>` : ''}
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function getRequirementItems(school) {
  const detailFields = [
    school.subjectRequirements,
    school.requirements,
    school.subjects,
    school.details
  ];

  for (const field of detailFields) {
    if (Array.isArray(field) && field.length > 0) {
      return field.map((item, index) => {
        if (typeof item === 'string' || typeof item === 'number') {
          return { label: `項目 ${index + 1}`, value: String(item) };
        }
        return {
          label: item.subject || item.name || item.label || `項目 ${index + 1}`,
          value: item.requirement || item.score || item.value || item.description || ''
        };
      });
    }

    if (field && typeof field === 'object') {
      return Object.entries(field).map(([label, value]) => ({
        label,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value)
      }));
    }
  }

  return [
    { label: '總成績要求', value: school.score == null ? '尚未提供' : String(school.score) }
  ];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function searchSchools() {
  const searchQuery = document.getElementById("searchInput").value.trim().toLowerCase();
  const ownershipFilter = document.getElementById("ownershipFilter").value;
  const minScoreValue = document.getElementById("minScoreFilter").value;
  const minScore = minScoreValue === "" ? null : Number(minScoreValue);

  const filteredSchools = allSchools.filter((school) => {
    const name = String(school.name || "").toLowerCase();
    const department = String(school.department || "").toLowerCase();
    const score = parseScore(school.score);
    const matchesText =
      searchQuery === "" ||
      name.includes(searchQuery) ||
      department.includes(searchQuery);
    const matchesOwnership = ownershipFilter === "all" || school.ownership === ownershipFilter;
    const matchesScore = minScore === null || Number.isNaN(minScore) || score === null || score >= minScore;

    return matchesText && matchesOwnership && matchesScore;
  });

  populateSchoolTable(filteredSchools, "schoolTableBody");
  applyBookmarks();
}

function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("ownershipFilter").value = "all";
  document.getElementById("minScoreFilter").value = "";
  populateSchoolTable(allSchools, "schoolTableBody");
  applyBookmarks();
}

function parseScore(score) {
  if (score == null) return null;
  const parsed = Number.parseFloat(String(score).replace(/[^\d.-]/g, ""));
  return Number.isNaN(parsed) ? null : parsed;
}

function getScoreClass(score) {
  const numericScore = parseScore(score);
  if (numericScore === null) return "score-card-neutral";
  if (numericScore >= 90) return "score-card-high";
  if (numericScore >= 80) return "score-card-mid";
  return "score-card-standard";
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

function toggleBookmarkById(schoolId) {
  const school = schoolDetails.get(schoolId);
  if (!school) return;
  toggleBookmark(school.name, school.department, school.score);
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
  document.querySelectorAll('tr[data-school-id]').forEach(row => {
    const school = schoolDetails.get(row.getAttribute('data-school-id'));
    if (!school) return;
    const isBookmarked = bookmarks.some(b => b.name === school.name && b.department === school.department);
    
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
  const menuToggle = document.querySelector('.menu-toggle');
  
  menu.classList.toggle('active');
  menuToggle.classList.toggle('active');
  
  const menuIcon = menuToggle.querySelector('i');
  menuIcon.classList.toggle('fa-bars');
  menuIcon.classList.toggle('fa-times');

  // 設置菜單年份
  document.getElementById("menuYear").textContent = new Date().getFullYear();

  if (menu.classList.contains('active')) {
    document.body.style.overflow = 'hidden'; // 防止背景滾動
    
    // 連結動畫，使用設定的延遲變數
    const links = menu.querySelectorAll('a');
    links.forEach((link, index) => {
      // 使用設定在HTML中的--index變數
      setTimeout(() => {
        link.style.opacity = '1';
        link.style.transform = 'translateX(0)';
      }, 50 * parseInt(link.style.getPropertyValue('--index') || index));
    });
  } else {
    document.body.style.overflow = ''; // 恢復背景滾動
    
    // 重置連結樣式
    const links = menu.querySelectorAll('a');
    links.forEach((link) => {
      link.style.opacity = '0';
      link.style.transform = 'translateX(20px)';
    });
  }
}

function goToMainFunction() {
  window.location.href = 'https://tyctw.github.io/official/';
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

// 點擊外部區域關閉菜單
document.addEventListener('click', function(event) {
  const menu = document.getElementById('fullscreenMenu');
  const menuToggle = document.querySelector('.menu-toggle');
  
  // 如果菜單是打開的，且點擊不在菜單內，也不是菜單切換按鈕
  if (menu.classList.contains('active') && 
      !menu.contains(event.target) && 
      !menuToggle.contains(event.target)) {
    toggleMenu();
  }
}, false);
