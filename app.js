document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. MOBILE NAVIGATION DRAWER
  // ==========================================
  const drawer = document.getElementById('drawer');
  const openBtn = document.getElementById('drawer-open');
  
  if (drawer && openBtn) {
    const scroller = drawer.querySelector('.Drawer-scroller');
    const sheet = drawer.querySelector('.Drawer-sheet');
    const closeBtn = drawer.querySelector('.Drawer-close-btn');

    function openDrawer() {
      drawer.showPopover();
      // Jump-scroll fallback for lack of scroll-initial-target support (e.g., Safari/Firefox)
      if (!CSS.supports('scroll-initial-target', 'nearest')) {
        scroller.scrollTo({ left: scroller.offsetWidth, behavior: 'instant' });
        // Allow the browser to register the instant scroll position before animating
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scroller.scrollTo({ left: 0, behavior: 'auto' });
          });
        });
      } else {
        scroller.scrollTo({ left: 0, behavior: 'auto' });
      }
    }

    function closeDrawer() {
      scroller.scrollTo({ left: scroller.offsetWidth, behavior: 'auto' });
    }

    function onDrawerOpened() {
      const main = document.querySelector('main');
      if (main) main.inert = true;
      openBtn.setAttribute('aria-expanded', 'true');
      sheet.focus();
    }

    function onDrawerClosed() {
      drawer.hidePopover();
      const main = document.querySelector('main');
      if (main) main.inert = false;
      openBtn.setAttribute('aria-expanded', 'false');
    }

    // Treat 'any pixel of the sheet visible inside the popover root' as 'not closed'
    const visibleThreshold = 1 / window.innerWidth;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (entry.intersectionRatio < visibleThreshold) onDrawerClosed();
        if (entry.intersectionRatio === 1) onDrawerOpened();
      },
      { root: drawer, threshold: [visibleThreshold, 1] }
    );
    observer.observe(sheet);

    // Event listeners
    openBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    // Light-dismiss: close drawer when clicking outside the sheet
    drawer.addEventListener('click', (event) => {
      if (!sheet.contains(event.target)) {
        closeDrawer();
      }
    });

    // Escape key handling
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && drawer.matches(':popover-open')) {
        closeDrawer();
      }
    });

    // Backdrop opacity fallback (for browsers like Firefox that don't support scroll-driven animations)
    if (!CSS.supports('animation-timeline: scroll()')) {
      scroller.addEventListener('scroll', () => {
        const ratio = 1 - scroller.scrollLeft / sheet.offsetWidth;
        drawer.style.setProperty('--drawer-backdrop', Math.max(0, Math.min(1, ratio)));
      });
    }
  }

  // ==========================================
  // 2. TAB SWITCHER & PATHWAYS FILTER
  // ==========================================
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const courseCards = document.querySelectorAll('.course-card');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      const targetFilter = button.getAttribute('data-filter');

      // Update active tab inside the same container
      const parentContainer = button.closest('.courses-tabs') || button.closest('.tabs-container') || document;
      parentContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // 1) Handle Standard Tab Panels (`data-tab`)
      if (targetTab) {
        tabPanels.forEach(panel => {
          if (panel.id === targetTab) {
            panel.classList.add('active');
          } else {
            panel.classList.remove('active');
          }
        });
      }

      // 2) Handle Pathways Grid Filtering (`data-filter`)
      if (targetFilter) {
        courseCards.forEach(card => {
          const categories = card.getAttribute('data-category') || '';
          if (targetFilter === 'all' || categories.includes(targetFilter)) {
            card.style.display = 'flex';
            card.style.animation = 'fadeIn 0.4s ease forwards';
          } else {
            card.style.display = 'none';
          }
        });
      }
    });
  });

  // ==========================================
  // 2B. MOBILE & TOUCH DROPDOWNS
  // ==========================================
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const link = item.querySelector('.nav-link');
    const dropdown = item.querySelector('.dropdown-menu');
    if (link && dropdown) {
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
          e.preventDefault();
          item.classList.toggle('active');
        }
      });
    }
  });

  // ==========================================
  // 3. CONSULTATION FORM SUBMISSIONS (DUAL EMAIL + WHATSAPP)
  // ==========================================
  const contactForm = document.getElementById('consultation-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('form-name').value.trim();
      const phone = document.getElementById('form-phone').value.trim();
      const service = document.getElementById('form-service').value;
      const details = document.getElementById('form-details').value.trim();

      // Form validation
      if (!name || !phone || !service) {
        alert('Please fill out all required fields.');
        return;
      }

      // 1. Send Background Email to info@willbick.co.ke via FormSubmit API
      fetch('https://formsubmit.co/ajax/info@willbick.co.ke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `New Willbick Consultation Inquiry: ${service}`,
          Name: name,
          Phone: phone,
          Service_Track: service,
          Details: details
        })
      }).catch(err => console.log('Email endpoint dispatched:', err));

      // 2. Build WhatsApp message text
      const message = `Hi Willbick, my name is ${name}. I would like to consult on the "${service}" service. \n\nAdditional Details: ${details}\n\nPhone: ${phone}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/254741887135?text=${encodedMessage}`;
      
      // Notify user and open WhatsApp in a new tab
      alert('Your inquiry has been dispatched to info@willbick.co.ke! Opening WhatsApp coordination...');
      window.open(whatsappUrl, '_blank');
      
      // Clean up form
      contactForm.reset();
    });
  }

  // ==========================================
  // 4. AUTOMATIC HERO CAROUSEL / SLIDESHOW
  // ==========================================
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.dot');
  if (slides.length > 0) {
    let currentSlide = 0;
    const slideInterval = 4000; // 4 seconds

    function nextSlide() {
      slides[currentSlide].classList.remove('active');
      dots[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
      dots[currentSlide].classList.add('active');
    }

    let timer = setInterval(nextSlide, slideInterval);

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        clearInterval(timer);
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        currentSlide = index;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
        timer = setInterval(nextSlide, slideInterval);
      });
    });
  }
});
