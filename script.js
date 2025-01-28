document.addEventListener('DOMContentLoaded', async () => {
  // Set copyright year
  document.getElementById('copyright-year').textContent = new Date().getFullYear();

  // Modified fetchEvents function with error handling
  async function fetchEvents() {
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbylIltyA7EW52OGGdA573bit0YcPg54OOIkr9AtAro5eAs8ztxCCT-MKJVoIYbg3ACbmQ/exec');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid data format');
      }
      return data.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error; // Re-throw to handle in renderTimeline
    }
  }

  // Modified renderTimeline function with loading state
  async function renderTimeline() {
    const timelineContainer = document.querySelector('.timeline');
    
    // Show loading state
    timelineContainer.innerHTML = `
      <div class="timeline-skeleton">
        ${Array(5).fill().map(() => `
          <div class="skeleton-item">
            <div class="skeleton-date"></div>
            <div class="skeleton-content"></div>
          </div>
        `).join('')}
      </div>
    `;
    timelineContainer.classList.add('loading');

    try {
      const events = await fetchEvents();
      
      // Simulate minimum loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      timelineContainer.classList.remove('loading');
      timelineContainer.innerHTML = ''; // Clear loading state

      events.forEach(event => {
        const timelineItem = document.createElement('div');
        timelineItem.className = `timeline-item${event.highlight ? ' highlight' : ''}`;
        timelineItem.dataset.date = event.date;

        timelineItem.innerHTML = `
          <div class="date">${event.displayDate}</div>
          <div class="content">
            ${event.content}
            <button class="calendar-btn" 
              data-event="${event.calendarEvent}" 
              data-date="${event.date}">加入行事曆</button>
            ${event.tag ? `<div class="tag">${event.tag}</div>` : ''}
          </div>
        `;

        timelineContainer.appendChild(timelineItem);
      });

      // Re-initialize timeline items animation
      initTimelineAnimation();
    } catch (error) {
      timelineContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #f44336;">
          <p>載入資料時發生錯誤</p>
          <button onclick="location.reload()" class="calendar-btn" style="margin-top: 1rem;">
            重新整理
          </button>
        </div>
      `;
      console.error('Error rendering timeline:', error);
    }
  }

  function initTimelineAnimation() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    });

    timelineItems.forEach((item, index) => {
      item.style.opacity = 0;
      item.style.transform = 'translateY(30px)';
      item.style.transition = 'all 0.6s ease-out';
      item.style.transitionDelay = `${index * 0.1}s`;
      observer.observe(item);
    });
  }

  // Initialize the timeline
  await renderTimeline();

  // Add hover effect to dates
  const dates = document.querySelectorAll('.date');
  dates.forEach(date => {
    date.addEventListener('mouseenter', () => {
      date.style.transform = 'scale(1.05)';
    });
    date.addEventListener('mouseleave', () => {
      date.style.transform = 'scale(1)';
    });
  });

  // Countdown Timer
  function updateCountdown() {
    const examDate = new Date('2025-05-17T08:00:00');
    const now = new Date();
    const diff = examDate - now;

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      document.getElementById('days').textContent = days.toString().padStart(2, '0');
      document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
      document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
      document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // Search functionality
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', filterEvents);

  // Filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      filterEvents();
    });
  });

  function filterEvents() {
    const searchTerm = searchInput.value.toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    const now = new Date();

    document.querySelectorAll('.timeline-item').forEach(item => {
      const content = item.querySelector('.content').textContent.toLowerCase();
      const itemDate = new Date(item.dataset.date);
      let show = content.includes(searchTerm);

      if (show && activeFilter !== 'all') {
        if (activeFilter === 'upcoming' && itemDate < now) {
          show = false;
        } else if (activeFilter === 'past' && itemDate > now) {
          show = false;
        }
      }

      item.classList.toggle('hidden', !show);
    });
  }

  // Calendar functionality
  document.querySelectorAll('.calendar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const event = btn.dataset.event;
      const date = btn.dataset.date;
      const encodedEvent = encodeURIComponent(event);
      const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodedEvent}&dates=${date}T000000Z/${date}T235959Z`;
      window.open(googleCalendarUrl, '_blank');
    });
  });

  // Add smooth scrolling for navigation links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      const navHeight = document.querySelector('.top-nav').offsetHeight;
      
      window.scrollTo({
        top: targetElement.offsetTop - navHeight - 20,
        behavior: 'smooth'
      });
    });
  });

  // Add active state to nav links on scroll
  window.addEventListener('scroll', () => {
    const sections = ['countdown', 'timeline'];
    const navLinks = document.querySelectorAll('.nav-link');
    const navHeight = document.querySelector('.top-nav').offsetHeight;
    
    let currentSection = '';
    
    sections.forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (section.offsetTop - navHeight <= window.scrollY + 100) {
        currentSection = sectionId;
      }
    });
    
    navLinks.forEach(link => {
      link.style.color = link.getAttribute('href').substring(1) === currentSection 
        ? 'var(--primary-color)' 
        : 'var(--text-color)';
    });
  });

  // Mobile navigation
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });

  // Close menu when clicking a nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-container')) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
    }
  });
});