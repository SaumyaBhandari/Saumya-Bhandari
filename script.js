var pageHeight = window.innerHeight;
var isAnimating = false;
document.body.style.transform = 'translate3d(0px,0px,0px)';




// Get all navigation buttons
const navButtons = document.querySelectorAll('.navigation-button');

// Get the height of each section
const sections = document.querySelectorAll('section');
const sectionHeights = Array.from(sections).map(section => section.getBoundingClientRect().height);

// Calculate the cumulative heights of the sections
const sectionCumulativeHeights = sectionHeights.reduce((acc, val) => [...acc, val + acc[acc.length - 1]], [0]);

// Activate the navigation button corresponding to the current section
document.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const windowHeight = window.innerHeight;
  const totalHeight = document.documentElement.scrollHeight;

  const scrollBottom = scrollTop + windowHeight;

  // Find the index of the section that is currently visible
  const visibleSectionIndex = sectionCumulativeHeights.findIndex(height => height > scrollTop + windowHeight / 2);

  // Activate the navigation button corresponding to the current section
  if (visibleSectionIndex !== -1) {
    navButtons.forEach(button => button.classList.remove('active'));
    navButtons[visibleSectionIndex].classList.add('active');
  }
});

// Scroll to the section corresponding to the clicked navigation button
navButtons.forEach(button => {
  const sectionIndex = parseInt(button.getAttribute('data-section')) - 1;
  button.addEventListener('click', event => {
    event.preventDefault();
    window.scrollTo({
      top: sectionCumulativeHeights[sectionIndex],
      behavior: 'smooth',
    });
  });
});
