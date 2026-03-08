// Force scroll to top on refresh
if (history.scrollRestoration) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

const cursor = document.querySelector('.cursor');
const cards = document.querySelectorAll('.card');
const video = document.querySelector('.hero-video');
const heroName = document.querySelector('.hero-name');
const bgPara = document.querySelector('.bg-paragraph');
const nav = document.querySelector('.nav');
const indexLoading = document.getElementById('index-loading');

function hideIndexLoading() {
  if (indexLoading && !indexLoading.classList.contains('hidden')) {
    indexLoading.classList.add('hidden');
    indexLoading.setAttribute('aria-hidden', 'true');
  }
}

function showIndexLoading() {
  if (indexLoading) {
    indexLoading.classList.remove('hidden');
    indexLoading.setAttribute('aria-hidden', 'false');
  }
}

if (video) {
  // Set speed before load so the first frame is already at 2x (avoids 1x→2x glitch)
  video.playbackRate = 2.0;
  video.load();

  video.addEventListener('loadedmetadata', () => {
    video.playbackRate = 2.0; // Ensure it stays 2x after metadata
  });

  // Hide loading screen when video is ready to play
  video.addEventListener('canplay', hideIndexLoading);
  video.addEventListener('loadeddata', hideIndexLoading);

  // Handle video errors gracefully
  video.addEventListener('error', (e) => {
    console.error('Video failed to load:', e);
    hideIndexLoading();
    revealContent(); // Show content even if video fails
  });

  // If loading stalls/buffers, briefly show loader again and retry a couple times
  let stalledRetries = 0;
  function handleStall() {
    if (stalledRetries >= 2) return;
    stalledRetries++;
    console.warn('Hero video stalled, showing loader and retrying...', stalledRetries);
    showIndexLoading();
    setTimeout(() => { video.load(); }, 300);
  }
  video.addEventListener('stalled', handleStall);
  video.addEventListener('waiting', handleStall);
  
  // Store the original text and clear it for the typewriter effect
  const originalText = bgPara ? bgPara.textContent.trim().replace(/\s+/g, ' ') : '';
  if (bgPara) bgPara.textContent = '';

  let hasRevealed = false;
  const revealContent = () => {
    if (hasRevealed) return;
    hasRevealed = true;
    hideIndexLoading();

    if (heroName) {
      heroName.classList.add('visible');
    }

    // Wait for hero name to show up first before revealing cards
    setTimeout(() => {
      // Reveal Nav
      if (nav) nav.style.opacity = '1';

      // Reveal project/gallery section (unblur)
      const gallerySection = document.querySelector('.gallery-section');
      if (gallerySection) gallerySection.classList.remove('gallery-section-blurred');

      // Trigger card animations
      cards.forEach(card => {
        card.style.opacity = '1';
        card.classList.add('animate-in');
      });
      document.body.classList.add('content-revealed');

      // Typewriter effect starts AFTER cards appear
      setTimeout(() => {
        if (bgPara && originalText) {
          let i = 0;
          const speed = 40; // typing speed in ms
          
          function typeWriter() {
            if (i < originalText.length) {
              bgPara.textContent += originalText.charAt(i);
              i++;
              setTimeout(typeWriter, speed);
            }
          }
          typeWriter();
        }
      }, 1000); // 1 second delay after cards start appearing
    }, 1200); // Start cards/nav after hero name fades in
  };

  // Coming back from a project page: show final state immediately, no animations
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('skipIndexAnimations')) {
    sessionStorage.removeItem('skipIndexAnimations');
    hasRevealed = true;
    hideIndexLoading();
    if (heroName) heroName.classList.add('visible');
    if (nav) nav.style.opacity = '1';
    const gallerySection = document.querySelector('.gallery-section');
    if (gallerySection) gallerySection.classList.remove('gallery-section-blurred');
    cards.forEach(card => {
      card.style.opacity = '1';
      card.classList.add('animate-in');
    });
    document.body.classList.add('content-revealed');
    if (bgPara && originalText) bgPara.textContent = originalText;
  } else {
    video.addEventListener('ended', revealContent);
    window.addEventListener('load', () => {
      setTimeout(revealContent, 3000);
    });
    setTimeout(revealContent, 5000);
  }
}

if (cursor) {
  let cursorTargetX = window.innerWidth / 2;
  let cursorTargetY = window.innerHeight / 2;
  let cursorCurrentX = cursorTargetX;
  let cursorCurrentY = cursorTargetY;
  let cursorFrame = null;
  const cursorEase = 0.22;

  const renderCursor = () => {
    cursorCurrentX += (cursorTargetX - cursorCurrentX) * cursorEase;
    cursorCurrentY += (cursorTargetY - cursorCurrentY) * cursorEase;

    if (Math.abs(cursorTargetX - cursorCurrentX) < 0.1) cursorCurrentX = cursorTargetX;
    if (Math.abs(cursorTargetY - cursorCurrentY) < 0.1) cursorCurrentY = cursorTargetY;

    cursor.style.transform = `translate3d(${cursorCurrentX}px, ${cursorCurrentY}px, 0) translate(-50%, -50%)`;

    if (cursorCurrentX !== cursorTargetX || cursorCurrentY !== cursorTargetY) {
      cursorFrame = window.requestAnimationFrame(renderCursor);
    } else {
      cursorFrame = null;
    }
  };

  document.addEventListener('mousemove', (e) => {
    const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    cursorTargetX = e.clientX / zoom;
    cursorTargetY = e.clientY / zoom;

    if (!cursorFrame) {
      cursorFrame = window.requestAnimationFrame(renderCursor);
    }
  }, { passive: true });

  renderCursor();
}

const cardRotations = { orange: '-3deg', peach: '2deg', green: '6deg' };
const cardLandingOrder = { orange: 0, peach: 1, green: 2 };

function getFooterLandingDistance(card, footer) {
  const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  const cardRect = card.getBoundingClientRect();
  const footerRect = footer.getBoundingClientRect();
  
  const footerStyles = window.getComputedStyle(footer);
  const footerTop = footerRect.top / zoom;
  const footerHeight = footerRect.height / zoom;
  const footerBottom = footerTop + footerHeight;
  
  const footerPaddingTop = parseFloat(footerStyles.paddingTop) || 0;
  const footerPaddingBottom = parseFloat(footerStyles.paddingBottom) || 0;
  const usableTop = footerTop + footerPaddingTop;
  const usableBottom = footerBottom - footerPaddingBottom;
  
  const landingIndex = cardLandingOrder[card.classList[1]] || 0;
  const verticalGap = Math.max(18, Math.min(36, footerHeight * 0.08));
  const targetBottom = usableBottom - (landingIndex * verticalGap);
  
  const minTop = usableTop;
  const cardHeight = cardRect.height / zoom;
  const targetTop = Math.max(minTop, targetBottom - cardHeight);

  // Use card's layout position (before transform), not visual position
  const board = card.closest('.board');
  const boardTop = board ? (board.getBoundingClientRect().top / zoom) : 0;
  
  const cardLayoutTop = board
    ? boardTop + parseFloat(getComputedStyle(card).top)
    : (cardRect.top / zoom);

  return targetTop - cardLayoutTop;
}

cards.forEach(card => {
  // Blue card: only toggle dark-mode on mousedown/mouseup (no fall, no drag)
  if (card.classList.contains('blue')) {
    card.addEventListener('mousedown', () => bgPara && bgPara.classList.add('dark-mode'));
    card.addEventListener('mouseup', () => bgPara && bgPara.classList.remove('dark-mode'));
    card.addEventListener('mouseleave', () => bgPara && bgPara.classList.remove('dark-mode'));
    return;
  }

  // Orange, peach, green: click = fall to bottom then scroll to footer
  card.addEventListener('click', (e) => {
    if (card.classList.contains('card-falling')) return;
    card.classList.add('card-falling');
    document.body.classList.add('cards-landed'); // no more "click me" hover after a card falls
    card.style.zIndex = 1000;
    const rotation = cardRotations[card.classList[1]] || '0deg';

    const footer = document.getElementById('footer');
    const fallDistance = footer
      ? getFooterLandingDistance(card, footer)
      : (window.innerHeight || 800);

    // Preserve existing translateX (e.g. orange card) so card doesn't jump horizontally
    const currentTransform = getComputedStyle(card).transform;
    let translateX = 0;
    if (currentTransform && currentTransform !== 'none') {
      const m = currentTransform.match(/matrix\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(',').map(Number);
        if (parts.length >= 6) translateX = parts[4]; // matrix(a,b,c,d,tx,ty)
      }
    }
    const translateXStr = translateX !== 0 ? ` translateX(${translateX}px)` : '';

    // Trigger the fall animation
    card.style.transition = 'transform 1.3s ease-in';
    card.style.transform = `translateY(${fallDistance}px)${translateXStr} rotate(${rotation})`;

  });
});


// Cursor grow effect on hover
const hoverElements = document.querySelectorAll('.card, .gallery-item');
if (cursor) {
  hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('grow'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('grow'));
  });
}

// Ideation Section Toggle
// Seedle page: keep all ideation items open, no toggling.
const isSeedlePage = !!document.getElementById('ideation-target');

function toggleIdeation(element) {
  if (isSeedlePage) return;
  const item = element.parentElement;
  // Always open the clicked item and close others; don't close it on re-click.
  document.querySelectorAll('.ideation-item').forEach(otherItem => {
    if (otherItem !== item) otherItem.classList.remove('active');
  });
  item.classList.add('active');
}

// Scroll-based reveal for Ideation items
if (!isSeedlePage) {
  const ideationObserverOptions = {
    root: null,
    rootMargin: '-42% 0px -42% 0px', // Narrower center band for more stability
    threshold: 0
  };

  let ideationTimeout;

  const ideationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        clearTimeout(ideationTimeout);
        ideationTimeout = setTimeout(() => {
          document.querySelectorAll('.ideation-item').forEach(item => {
            if (item !== entry.target) item.classList.remove('active');
          });
          entry.target.classList.add('active');
        }, 150);
      } else {
        entry.target.classList.remove('active');
        // Also clear timeout if the item that was about to open leaves the zone
        clearTimeout(ideationTimeout);
      }
    });
  }, ideationObserverOptions);

  document.querySelectorAll('.ideation-item').forEach(item => {
    ideationObserver.observe(item);
  });
}
