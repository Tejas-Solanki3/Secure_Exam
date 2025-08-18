// Homepage JavaScript - Mobile Navigation and Features Carousel
document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation toggle
    const navToggleBtn = document.getElementById('navToggleBtn');
    const mobileNavMenu = document.getElementById('mobileNavMenu');

    if (navToggleBtn && mobileNavMenu) {
        navToggleBtn.addEventListener('click', () => {
            mobileNavMenu.classList.toggle('active');
            navToggleBtn.classList.toggle('active');
        });
    }

    // Features Carousel Functionality
    const carousel = document.getElementById('featuresCarousel');
    const slides = carousel ? carousel.querySelectorAll('.carousel-slide') : [];
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const indicatorsContainer = document.getElementById('carouselIndicators');
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoAdvance;

    // Create indicators
    function createIndicators() {
        if (!indicatorsContainer) return;
        
        for (let i = 0; i < totalSlides; i++) {
            const indicator = document.createElement('div');
            indicator.classList.add('indicator');
            if (i === 0) indicator.classList.add('active');
            indicator.addEventListener('click', () => goToSlide(i));
            indicatorsContainer.appendChild(indicator);
        }
    }

    // Update slide visibility and indicators
    function updateCarousel() {
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentSlide);
        });

        const indicators = indicatorsContainer ? indicatorsContainer.querySelectorAll('.indicator') : [];
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSlide);
        });

        // Update button states
        if (prevBtn) prevBtn.disabled = currentSlide === 0;
        if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1;
    }

    // Go to specific slide
    function goToSlide(slideIndex) {
        currentSlide = slideIndex;
        updateCarousel();
    }

    // Next slide
    function nextSlide() {
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
            updateCarousel();
        }
    }

    // Previous slide
    function prevSlide() {
        if (currentSlide > 0) {
            currentSlide--;
            updateCarousel();
        }
    }

    // Start auto-advance
    function startAutoAdvance() {
        autoAdvance = setInterval(() => {
            if (currentSlide < totalSlides - 1) {
                nextSlide();
            } else {
                currentSlide = 0;
                updateCarousel();
            }
        }, 5000); // Change slide every 5 seconds
    }

    // Stop auto-advance
    function stopAutoAdvance() {
        clearInterval(autoAdvance);
    }

    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    // Pause auto-advance on hover
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', stopAutoAdvance);
        carouselContainer.addEventListener('mouseleave', startAutoAdvance);
    }

    // Initialize carousel
    if (carousel && slides.length > 0) {
        createIndicators();
        updateCarousel();
        startAutoAdvance();
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
        }
    });
});

// FAQ Accordion functionality
function toggleFAQ(button) {
    const faqItem = button.closest('.faq-item');
    const answer = faqItem.querySelector('.faq-answer');
    const isActive = button.classList.contains('active');
    
    // Close all other FAQ items
    document.querySelectorAll('.faq-question').forEach(q => {
        if (q !== button) {
            q.classList.remove('active');
            q.closest('.faq-item').querySelector('.faq-answer').classList.remove('active');
        }
    });
    
    // Toggle current FAQ item
    if (isActive) {
        button.classList.remove('active');
        answer.classList.remove('active');
    } else {
        button.classList.add('active');
        answer.classList.add('active');
    }
}

// Make toggleFAQ function available globally
window.toggleFAQ = toggleFAQ;
