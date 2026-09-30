/**
 * Saumya Bhandari — Portfolio Scripts
 * Handles:
 * 1. Mobile Menu Toggle & Navigation
 * 2. Active Section Highlighting
 * 3. Horizontal Timeline (Arrow buttons, Drag-to-Scroll, Wheel-to-Horizontal, Progress Bar)
 * 4. Interactive Golden Fractal Canvas (Hero)
 * 5. Visual Artifact Lightbox Modal
 * 6. Smooth Scroll Reveal Animations
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // 1. MOBILE MENU TOGGLE
    // -------------------------------------------------------------------------
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenu.classList.toggle('is-active');
        });
    }

    // Close menu when clicking nav links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                if (mobileMenu) mobileMenu.classList.remove('is-active');
            }
        });
    });

    // -------------------------------------------------------------------------
    // 2. ACTIVE NAVBAR HIGHLIGHTING ON SCROLL
    // -------------------------------------------------------------------------
    const sections = document.querySelectorAll('section[id]');
    
    const highlightNav = () => {
        const scrollY = window.scrollY + 120;

        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop;
            const sectionId = current.getAttribute('id');
            const correspondingLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

            if (correspondingLink) {
                if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                    navLinks.forEach(link => link.classList.remove('active'));
                    correspondingLink.classList.add('active');
                }
            }
        });
    };

    window.addEventListener('scroll', highlightNav, { passive: true });
    highlightNav();

    // -------------------------------------------------------------------------
    // 3. HORIZONTAL TIMELINE CONTROLS & INTERACTIONS
    // -------------------------------------------------------------------------
    const timelineScroll = document.getElementById('timeline-outer-scroll');
    const btnTimelineLeft = document.getElementById('btn-timeline-left');
    const btnTimelineRight = document.getElementById('btn-timeline-right');
    const progressFill = document.getElementById('timeline-progress-fill');

    if (timelineScroll) {
        // Update Progress Bar
        const updateProgressBar = () => {
            const maxScroll = timelineScroll.scrollWidth - timelineScroll.clientWidth;
            if (maxScroll > 0 && progressFill) {
                const percentage = (timelineScroll.scrollLeft / maxScroll) * 100;
                progressFill.style.width = `${Math.min(100, Math.max(12, percentage))}%`;
            }
        };

        timelineScroll.addEventListener('scroll', updateProgressBar, { passive: true });
        updateProgressBar();

        // Left / Right Button Navigation
        const stepWidth = 360; // Approximate column width + gap

        if (btnTimelineLeft) {
            btnTimelineLeft.addEventListener('click', () => {
                timelineScroll.scrollBy({ left: -stepWidth, behavior: 'smooth' });
            });
        }

        if (btnTimelineRight) {
            btnTimelineRight.addEventListener('click', () => {
                timelineScroll.scrollBy({ left: stepWidth, behavior: 'smooth' });
            });
        }

        // Horizontal Wheel Translation (Shift-less horizontal trackpad/wheel)
        timelineScroll.addEventListener('wheel', (e) => {
            // If deltaX is small and deltaY is present, scroll horizontally
            if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
                // Check if user is scrolling inside timeline
                const atStart = timelineScroll.scrollLeft <= 0;
                const atEnd = timelineScroll.scrollLeft + timelineScroll.clientWidth >= timelineScroll.scrollWidth - 1;

                // Only prevent default if we can scroll in that direction
                if ((e.deltaY > 0 && !atEnd) || (e.deltaY < 0 && !atStart)) {
                    e.preventDefault();
                    timelineScroll.scrollLeft += e.deltaY;
                }
            }
        }, { passive: false });

        // Click-and-Drag to Scroll
        let isDown = false;
        let startX;
        let scrollLeft;

        timelineScroll.addEventListener('mousedown', (e) => {
            // Ignore if clicking on an interactive card or link
            if (e.target.closest('.elevated-image-card') || e.target.closest('a') || e.target.closest('button')) {
                return;
            }
            isDown = true;
            timelineScroll.classList.add('dragging');
            startX = e.pageX - timelineScroll.offsetLeft;
            scrollLeft = timelineScroll.scrollLeft;
        });

        window.addEventListener('mouseup', () => {
            isDown = false;
            if (timelineScroll) timelineScroll.classList.remove('dragging');
        });

        timelineScroll.addEventListener('mouseleave', () => {
            isDown = false;
            timelineScroll.classList.remove('dragging');
        });

        timelineScroll.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - timelineScroll.offsetLeft;
            const walk = (x - startX) * 1.6; // Scroll speed multiplier
            timelineScroll.scrollLeft = scrollLeft - walk;
        });

        // ---------------------------------------------------------------------
        // DYNAMIC S-CURVE & SPIRAL SPLINE GENERATOR (Linearity is an Illusion)
        // ---------------------------------------------------------------------
        const timelineTrack = document.getElementById('timeline-track');
        const splineGroup = document.getElementById('spline-path-group');

        const drawTimelineSpline = () => {
            if (!timelineTrack || !splineGroup) return;

            const dots = Array.from(timelineTrack.querySelectorAll('.t-dot'));
            if (dots.length < 2) return;

            const trackRect = timelineTrack.getBoundingClientRect();
            const points = dots.map(dot => {
                const dotRect = dot.getBoundingClientRect();
                return {
                    x: dotRect.left - trackRect.left + dotRect.width / 2,
                    y: dotRect.top - trackRect.top + dotRect.height / 2
                };
            });

            // Smooth cubic Bezier spline passing through every node
            const first = points[0];
            const startX = Math.max(15, first.x - 70);
            const startY = first.y + 18;

            let pathD = `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${(startX + 35).toFixed(1)} ${startY.toFixed(1)}, ${(first.x - 30).toFixed(1)} ${first.y.toFixed(1)}, ${first.x.toFixed(1)} ${first.y.toFixed(1)}`;

            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i + 1];
                const dx = p2.x - p1.x;
                const cp1x = p1.x + dx * 0.44;
                const cp1y = p1.y;
                const cp2x = p2.x - dx * 0.44;
                const cp2y = p2.y;

                pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
            }

            // Extend into the future after the last dot
            const last = points[points.length - 1];
            const endX = last.x + 110;
            const endY = last.y - 24;
            pathD += ` C ${(last.x + 40).toFixed(1)} ${last.y.toFixed(1)}, ${(endX - 35).toFixed(1)} ${endY.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;

            // Archimedean Spiral around the Wedding Node (Trishna Saumya KC)
            const weddingDot = timelineTrack.querySelector('.t-dot.wedding-dot');
            let weddingSpiralD = '';
            if (weddingDot) {
                const wRect = weddingDot.getBoundingClientRect();
                const wx = wRect.left - trackRect.left + wRect.width / 2;
                const wy = wRect.top - trackRect.top + wRect.height / 2;

                // Build a 2-turn spiral around the wedding node
                const totalSteps = 45;
                const maxAngle = Math.PI * 3.8;
                const spiralPoints = [];
                for (let s = 0; s <= totalSteps; s++) {
                    const theta = (s / totalSteps) * maxAngle;
                    const r = 12 + theta * 4.2;
                    const sx = wx + r * Math.cos(theta);
                    const sy = wy + r * Math.sin(theta);
                    spiralPoints.push({ x: sx, y: sy });
                }

                if (spiralPoints.length > 1) {
                    weddingSpiralD = `M ${spiralPoints[0].x.toFixed(1)} ${spiralPoints[0].y.toFixed(1)}`;
                    for (let s = 1; s < spiralPoints.length; s++) {
                        weddingSpiralD += ` L ${spiralPoints[s].x.toFixed(1)} ${spiralPoints[s].y.toFixed(1)}`;
                    }
                }
            }

            // Inject the dynamic SVG paths
            splineGroup.innerHTML = `
                <path class="spline-glow-path" d="${pathD}" />
                <path class="spline-main-path" d="${pathD}" />
                <path class="spline-particle-path" d="${pathD}" />
                ${weddingSpiralD ? `<path d="${weddingSpiralD}" fill="none" stroke="url(#roseGoldSpiral)" stroke-width="2.2" stroke-linecap="round" opacity="0.85" filter="url(#goldGlow)" />` : ''}
            `;
        };

        // Draw initially and on resize / font load
        drawTimelineSpline();
        setTimeout(drawTimelineSpline, 150);
        setTimeout(drawTimelineSpline, 600);
        window.addEventListener('resize', () => {
            requestAnimationFrame(drawTimelineSpline);
        });
        window.addEventListener('load', drawTimelineSpline);
    }

    // -------------------------------------------------------------------------
    // 4. LIGHTBOX MODAL (FOR TIMELINE & PROJECT ARTIFACTS)
    // -------------------------------------------------------------------------
    const lightboxModal = document.getElementById('image-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDesc = document.getElementById('lightbox-desc');

    window.openLightbox = function(imageSrc, title, description) {
        if (!lightboxModal) return;
        lightboxImg.src = imageSrc;
        lightboxImg.alt = title || 'Work Artifact Preview';
        lightboxTitle.textContent = title || 'Visual Artifact';
        lightboxDesc.textContent = description || '';

        lightboxModal.classList.add('active');
        lightboxModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    window.closeLightbox = function() {
        if (!lightboxModal) return;
        lightboxModal.classList.remove('active');
        lightboxModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (lightboxImg) lightboxImg.src = '';
        }, 300);
    };

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('active')) {
            closeLightbox();
        }
    });

    // -------------------------------------------------------------------------
    // 5. INTERACTIVE GOLDEN FRACTAL CANVAS (HERO BACKGROUND)
    // -------------------------------------------------------------------------
    const canvas = document.getElementById('fractal-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let mouseX = 0;
        let mouseY = 0;
        let targetAngle = 0;
        let currentAngle = 0;
        let animationFrameId;

        const resize = () => {
            width = canvas.width = canvas.parentElement.offsetWidth;
            height = canvas.height = canvas.parentElement.offsetHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        // Mouse tracking for subtle interactive perturbation
        window.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            if (e.clientY <= rect.bottom && e.clientY >= rect.top) {
                mouseX = (e.clientX - rect.left) / width - 0.5;
                mouseY = (e.clientY - rect.top) / height - 0.5;
                targetAngle = mouseX * 0.25;
            }
        }, { passive: true });

        // Recursive Fractal Tree / Golden Branching function
        const drawBranch = (startX, startY, length, angle, depth, maxDepth) => {
            if (depth > maxDepth || length < 3) return;

            const endX = startX + length * Math.sin(angle);
            const endY = startY - length * Math.cos(angle);

            // Warm gold gradient opacity based on depth
            const alpha = Math.max(0.12, (1 - depth / maxDepth) * 0.55);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = `rgba(197, 160, 89, ${alpha})`;
            ctx.lineWidth = Math.max(1, (maxDepth - depth) * 0.9);
            ctx.lineCap = 'round';
            ctx.stroke();

            // Subtle glowing nodes at branch tips
            if (depth >= maxDepth - 2) {
                ctx.beginPath();
                ctx.arc(endX, endY, 2.2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(226, 186, 109, ${alpha * 1.2})`;
                ctx.fill();
            }

            // Recursive children with golden ratio decay
            const branchDecay = 0.72;
            const spread = 0.44 + currentAngle * 0.4;

            // Left sub-branch
            drawBranch(endX, endY, length * branchDecay, angle - spread, depth + 1, maxDepth);
            // Right sub-branch
            drawBranch(endX, endY, length * branchDecay, angle + spread, depth + 1, maxDepth);
            
            // Occasional center harmonic stem
            if (depth < 4) {
                drawBranch(endX, endY, length * (branchDecay * 0.8), angle + currentAngle * 0.1, depth + 2, maxDepth);
            }
        };

        let time = 0;
        const renderFractal = () => {
            time += 0.015;
            // Smooth damping
            currentAngle += (targetAngle + Math.sin(time) * 0.05 - currentAngle) * 0.04;

            ctx.clearRect(0, 0, width, height);

            // Draw primary fractal tree emerging from bottom-center
            const rootX = width * 0.48;
            const rootY = height * 0.98;
            const baseLength = Math.min(height * 0.24, 150);

            drawBranch(rootX, rootY, baseLength, 0, 0, 8);

            // Draw a subtle secondary companion fractal
            if (width > 800) {
                const subX = width * 0.78;
                const subY = height * 0.96;
                drawBranch(subX, subY, baseLength * 0.65, 0.15, 0, 7);
            }

            animationFrameId = requestAnimationFrame(renderFractal);
        };

        // Check if hero is visible to conserve CPU
        const heroObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!animationFrameId) renderFractal();
                } else {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
            });
        }, { threshold: 0.05 });

        heroObserver.observe(canvas.parentElement);
    }

    // -------------------------------------------------------------------------
    // 6. SCROLL REVEAL OBSERVER
    // -------------------------------------------------------------------------
    const revealElements = document.querySelectorAll('.project-card, .pillar-card, .study-card, .stat-card');
    
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        revealElements.forEach(el => {
            el.classList.add('reveal-item');
            revealObserver.observe(el);
        });

        // Add dynamic CSS for reveal animation
        const style = document.createElement('style');
        style.textContent = `
            .reveal-item {
                opacity: 0;
                transform: translateY(24px);
                transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .reveal-item.visible {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }
});