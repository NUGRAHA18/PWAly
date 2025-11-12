/**
 * Animation Observer - Trigger animation saat scroll
 * Menggunakan Intersection Observer API
 */
class AnimationObserver {
  constructor(options = {}) {
    this.observer = null;
    this.observedElements = new Set();

    // Default options
    this.options = {
      root: null,
      rootMargin: options.rootMargin || "0px 0px -100px 0px", // Trigger sebelum masuk viewport
      threshold: options.threshold || 0.1, // 10% element visible
      triggerOnce: options.triggerOnce !== false, // Default true
      animationClass: options.animationClass || "animate-in",
    };

    this.init();
  }

  init() {
    // Check browser support
    if (!("IntersectionObserver" in window)) {
      console.warn(
        "⚠️ IntersectionObserver not supported, fallback to immediate animation"
      );
      this.fallbackMode = true;
      return;
    }

    // Create observer
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Get stagger delay dari data attribute atau index
          const staggerDelay =
            entry.target.dataset.animationDelay || index * 50;

          // Tambahkan delay untuk staggered animation
          setTimeout(() => {
            entry.target.classList.add(this.options.animationClass);

            // Trigger custom event
            entry.target.dispatchEvent(
              new CustomEvent("animated-in", {
                detail: { element: entry.target },
              })
            );
          }, staggerDelay);

          // Stop observing jika triggerOnce = true
          if (this.options.triggerOnce) {
            this.observer.unobserve(entry.target);
            this.observedElements.delete(entry.target);
          }
        } else {
          // Optional: Remove class saat keluar viewport (untuk repeat animation)
          if (!this.options.triggerOnce) {
            entry.target.classList.remove(this.options.animationClass);
          }
        }
      });
    }, this.options);

    console.log("✅ AnimationObserver initialized");
  }

  /**
   * Observe single element
   */
  observe(element) {
    if (this.fallbackMode) {
      // Fallback: langsung tambahkan class
      element.classList.add(this.options.animationClass);
      return;
    }

    if (this.observer && element && !this.observedElements.has(element)) {
      this.observer.observe(element);
      this.observedElements.add(element);
    }
  }

  /**
   * Observe multiple elements
   */
  observeAll(selector) {
    if (!selector) return;

    const elements = document.querySelectorAll(selector);

    if (this.fallbackMode) {
      // Fallback: langsung tambahkan class ke semua
      elements.forEach((el) => el.classList.add(this.options.animationClass));
      return;
    }

    if (!this.observer) return;

    elements.forEach((el, index) => {
      // Set stagger delay sebagai data attribute
      if (!el.dataset.animationDelay) {
        el.dataset.animationDelay = index * 100; // 100ms delay per item
      }

      if (!this.observedElements.has(el)) {
        this.observer.observe(el);
        this.observedElements.add(el);
      }
    });

    console.log(`👁️ Observing ${elements.length} elements`);
  }

  /**
   * Unobserve element
   */
  unobserve(element) {
    if (this.observer && element) {
      this.observer.unobserve(element);
      this.observedElements.delete(element);
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observedElements.clear();
      console.log("🧹 AnimationObserver disconnected");
    }
  }

  /**
   * Reset - untuk re-trigger animations
   */
  reset() {
    this.observedElements.forEach((el) => {
      el.classList.remove(this.options.animationClass);
    });
    this.disconnect();
    this.observedElements.clear();
    this.init();
  }
}

export default AnimationObserver;
