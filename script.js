document.addEventListener('DOMContentLoaded', function() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section');

    // --- Mobile Menu Toggle ---
    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenu.classList.toggle('is-active');
        });
    }

    // --- Smooth Scrolling & Close Mobile Menu on Link Click ---
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Close mobile menu if open
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileMenu.classList.remove('is-active');
            }

            // Smooth scroll for internal links
            if (link.hash !== "") {
                const targetElement = document.querySelector(link.hash);
                if (targetElement) {
                    e.preventDefault();
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Adjust for sticky navbar height
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // --- Active Nav Link Highlighting on Scroll ---
    const highlightMenu = () => {
        let scrollPos = window.scrollY + 90; // Offset for navbar

        sections.forEach(section => {
            if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
                const targetId = section.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${targetId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', highlightMenu);
    window.addEventListener('load', highlightMenu);


    // --- Scroll Animations (Fade-in effect) ---
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('section').forEach(section => {
        section.classList.add('reveal');
        observer.observe(section);
    });

    // Add reveal styles to CSS
    const style = document.createElement('style');
    style.innerHTML = `
        .reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .reveal.visible {
            opacity: 1;
            transform: translateY(0);
        }
        .nav-link.active {
            color: var(--accent-color);
            font-weight: bold;
        }
        /* Mobile Menu Styles */
        @media screen and (max-width: 768px) {
            .nav-menu {
                display: flex;
                flex-direction: column;
                width: 100%;
                position: absolute;
                top: 80px;
                left: -100%;
                opacity: 1;
                transition: all 0.5s ease;
                background: var(--primary-color);
            }
            .nav-menu.active {
                left: 0;
                opacity: 1;
                transition: all 0.5s ease;
                z-index: 99;
            }
            .nav-item {
                width: 100%;
            }
            .nav-link {
                text-align: center;
                padding: 2rem;
                width: 100%;
                display: table;
            }
            .nav-toggle .bar {
                background-color: var(--heading-color);
            }
            .nav-toggle.is-active .bar:nth-child(2) {
                opacity: 0;
            }
            .nav-toggle.is-active .bar:nth-child(1) {
                transform: translateY(8px) rotate(45deg);
            }
            .nav-toggle.is-active .bar:nth-child(3) {
                transform: translateY(-8px) rotate(-45deg);
            }
        }
    `;
    document.head.appendChild(style);
});