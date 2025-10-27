class LoadingSpinner {
  static render(size = "lg") {
    return `
      <div class="spinner-container">
        <div class="spinner spinner-${size}"></div>
      </div>
    `;
  }
}

export default LoadingSpinner;
