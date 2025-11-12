/**
 * Animation Observer - Trigger animation saat element masuk viewport
 */
class AnimationObserver {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    // Cek browser support
    if (!("IntersectionObserver" in window)) {
      console.warn("IntersectionObserver not supported");
      return;
    }

    // Setup observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Tambahkan class 'animate-in' saat masuk viewport
            entry.target.classList.add("animate-in");

            // Stop observing setelah animasi
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1, // Trigger saat 10% element terlihat
      }
    );
  }

  // Observe element
  observe(element) {
    if (this.observer && element) {
      this.observer.observe(element);
    }
  }

  // Observe multiple elements
  observeAll(selector) {
    if (!this.observer) return;

    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      this.observer.observe(el);
    });
  }

  // Disconnect observer
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

export default AnimationObserver;
