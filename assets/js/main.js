document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initProjectFilters();
  initContactForm();
});

/**
 * Mobile Navigation Menu with Accessible Keyboard & Focus Controls
 */
function initMobileMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = navMenu ? navMenu.querySelectorAll('.nav-link') : [];

  if (!menuToggle || !navMenu) return;

  const focusableMenuElements = [menuToggle, ...Array.from(navLinks)];

  function toggleMenu(forceClose = false) {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    const shouldOpen = forceClose ? false : !isExpanded;

    menuToggle.setAttribute('aria-expanded', shouldOpen.toString());
    navMenu.classList.toggle('open', shouldOpen);

    if (shouldOpen) {
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      // Set focus to first menu item after toggle
      if (navLinks.length > 0) {
        setTimeout(() => navLinks[0].focus(), 100);
      }
    } else {
      document.body.style.overflow = '';
      menuToggle.focus();
    }
  }

  menuToggle.addEventListener('click', () => toggleMenu());

  // Close menu when clicking links (important for mobile UX)
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        toggleMenu(true);
      }
    });
  });

  // Handle Keyboard Trap and Navigation within Open Mobile Menu
  document.addEventListener('keydown', (e) => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    if (!isOpen) return;

    // Close on Escape key
    if (e.key === 'Escape') {
      toggleMenu(true);
      return;
    }

    // Trap focus inside menu (WCAG 2.1.2)
    if (e.key === 'Tab') {
      const activeEl = document.activeElement;
      const firstEl = focusableMenuElements[0];
      const lastEl = focusableMenuElements[focusableMenuElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab -> Wrap to last element
        if (activeEl === firstEl) {
          lastEl.focus();
          e.preventDefault();
        }
      } else {
        // Tab -> Wrap to first element
        if (activeEl === lastEl) {
          firstEl.focus();
          e.preventDefault();
        }
      }
    }
  });

  // Close menu on screen resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && menuToggle.getAttribute('aria-expanded') === 'true') {
      toggleMenu(true);
    }
  });
}

/**
 * Filterable Projects Grid with Aria-Live Screen Reader Announcements
 */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  const liveAnnouncer = document.getElementById('filter-announcer');

  if (filterBtns.length === 0 || projectCards.length === 0) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active states
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      const filterValue = btn.getAttribute('data-filter');
      let visibleCount = 0;

      // Filter project cards
      projectCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        const parentCol = card.closest('.grid-item') || card;

        if (filterValue === 'all' || cardCategory === filterValue) {
          parentCol.style.display = 'block';
          card.setAttribute('aria-hidden', 'false');
          visibleCount++;
        } else {
          parentCol.style.display = 'none';
          card.setAttribute('aria-hidden', 'true');
        }
      });

      // Announce the filter updates to assistive technology (WCAG 4.1.3 Status Messages)
      if (liveAnnouncer) {
        const filterName = btn.textContent.trim();
        liveAnnouncer.textContent = `Showing ${visibleCount} projects categorized under ${filterName}.`;
      }
    });
  });
}

/**
 * Accessible Contact Form Validation & Focus Management
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const formInputs = form.querySelectorAll('.form-control');
  const alertSuccess = document.getElementById('alert-success');
  const alertError = document.getElementById('alert-error');

  // Real-time validation on input blur
  formInputs.forEach(input => {
    input.addEventListener('blur', () => {
      validateField(input);
    });

    input.addEventListener('input', () => {
      // Clear error as the user types
      if (input.classList.contains('invalid')) {
        clearFieldError(input);
      }
    });
  });

  // Form Submit Handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Hide previous alerts
    if (alertSuccess) alertSuccess.style.display = 'none';
    if (alertError) alertError.style.display = 'none';

    let firstInvalidField = null;
    let isFormValid = true;

    formInputs.forEach(input => {
      const isValid = validateField(input);
      if (!isValid) {
        isFormValid = false;
        if (!firstInvalidField) {
          firstInvalidField = input;
        }
      }
    });

    if (!isFormValid) {
      // Announce general error & Focus on first invalid element (WCAG 3.3.1)
      if (alertError) {
        alertError.style.display = 'block';
        alertError.textContent = 'Please correct the errors in the form before submitting.';
      }
      if (firstInvalidField) {
        firstInvalidField.focus();
      }
    } else {
      // Form is valid! Simulate API submission
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : 'Send Message';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      setTimeout(() => {
        // Reset button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }

        // Show success alert and scroll/focus on it (WCAG 4.1.3)
        if (alertSuccess) {
          alertSuccess.style.display = 'block';
          alertSuccess.setAttribute('tabindex', '-1');
          alertSuccess.focus();
        }

        // Reset the form values
        form.reset();
        
        // Remove validation styling
        formInputs.forEach(input => {
          input.classList.remove('valid', 'invalid');
          input.removeAttribute('aria-invalid');
        });
      }, 1000);
    }
  });

  /**
   * Validates a single input field, applies styling, and triggers screen reader updates
   */
  function validateField(input) {
    const value = input.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Required check
    if (input.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = `${getFieldLabelText(input)} is required.`;
    } 
    // Email pattern check
    else if (input.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address.';
      }
    }
    // Length check for message body
    else if (input.id === 'message' && value && value.length < 10) {
      isValid = false;
      errorMessage = 'Message must be at least 10 characters long.';
    }

    if (!isValid) {
      showFieldError(input, errorMessage);
    } else {
      clearFieldError(input);
    }

    return isValid;
  }

  function showFieldError(input, message) {
    input.classList.add('invalid');
    input.setAttribute('aria-invalid', 'true');
    
    // Set error message text
    const errorId = `${input.id}-error`;
    let errorEl = document.getElementById(errorId);
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  function clearFieldError(input) {
    input.classList.remove('invalid');
    input.removeAttribute('aria-invalid');
    
    const errorId = `${input.id}-error`;
    let errorEl = document.getElementById(errorId);
    if (errorEl) {
      errorEl.textContent = '';
    }
  }

  function getFieldLabelText(input) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
      // Return label text excluding the asterisk if present
      return label.textContent.replace('*', '').trim();
    }
    return 'This field';
  }
}
