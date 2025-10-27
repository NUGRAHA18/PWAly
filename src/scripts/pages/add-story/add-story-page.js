import authGuard from "../../utils/auth-guard";
import AddStoryPresenter from "../../presenters/add-story-presenter";
import { validators } from "../../utils/validators";
// Impor MapHandler dan CameraHandler jika digunakan
// import MapHandler from '../../utils/map-handler';
// import CameraHandler from '../../utils/camera-handler';

export default class AddStoryPage {
  constructor() {
    this.presenter = new AddStoryPresenter(this);
    this._photoFile = null;
    // this._mapHandler = new MapHandler('location-map'); // Jika pakai map
    // this._cameraHandler = new CameraHandler('camera-preview', 'capture-button'); // Jika pakai kamera
  }

  async render() {
    if (!authGuard.requireAuth()) return "";

    return `
      <section class="add-story-container container">
        <div class="add-story-header">
          <h1 class="add-story-title">Create New Story</h1>
          <p class="add-story-subtitle">Share your moments with the community</p>
        </div>

        <div id="alert-container"></div>

        <form id="add-story-form" class="add-story-form">
          <div class="form-section">
            <h2 class="form-section-title">📷 Upload Photo</h2>
            <div class="form-group">
              <label for="photo" class="form-label visually-hidden">Photo</label>
              <div id="image-upload-container" class="image-upload-container" role="button" tabindex="0" aria-label="Upload image area">
                 <input type="file" id="photo" name="photo" accept="image/*" class="visually-hidden" required>
                 <div id="image-upload-content">
                     <div class="image-upload-icon">⬆️</div>
                     <p class="image-upload-text">Click or drag image here to upload</p>
                     <p class="form-help">Max file size 1MB</p>
                 </div>
                 <img id="image-preview" class="image-preview" alt="Image preview" style="display: none;">
              </div>
               <div id="image-actions" class="image-actions" style="display: none;">
                  <button type="button" id="change-image-button" class="btn btn-secondary btn-sm">Change Image</button>
                  <button type="button" id="remove-image-button" class="btn btn-danger btn-sm">Remove Image</button>
               </div>
              <span class="error-text" id="photo-error"></span>
            </div>
            </div>

          <div class="form-section">
            <h2 class="form-section-title">✍️ Description</h2>
            <div class="form-group">
              <label for="description" class="form-label visually-hidden">Description</label>
              <textarea
                id="description"
                name="description"
                class="form-textarea"
                rows="4"
                placeholder="Write your story here..."
                required
                maxlength="2200"
              ></textarea>
              <span class="error-text" id="description-error"></span>
            </div>
          </div>

          <div class="form-section">
            <button type="submit" class="btn btn-primary btn-block" id="submit-button">
              <span id="button-text">Share Story</span>
              <span id="button-spinner" class="spinner" style="display: none;"></span>
            </button>
          </div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    if (!authGuard.requireAuth()) return;

    this._setupFormSubmit();
    this._setupImageUpload();
    // this._setupLocationPicker(); // Jika pakai map
    // this._setupCamera(); // Jika pakai kamera
  }

  _setupFormSubmit() {
    const form = document.getElementById("add-story-form");
    const descriptionInput = document.getElementById("description");
    const photoInput = document.getElementById("photo");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      this._clearErrors();

      const description = descriptionInput.value.trim();
      // Validasi
      const descriptionError = validators.required(description, "Description");
      const photoError = !this._photoFile ? "Photo is required" : null;

      let isValid = true;
      if (descriptionError) {
        this._displayFieldError("description", descriptionError);
        isValid = false;
      }
      if (photoError) {
        this._displayFieldError("photo", photoError);
        isValid = false;
      }

      if (!isValid) return;

      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", this._photoFile);

      // Tambahkan lat/lon jika ada
      // const latInput = document.getElementById('latitude');
      // const lonInput = document.getElementById('longitude');
      // if (latInput && lonInput && latInput.value && lonInput.value) {
      //    formData.append('lat', latInput.value);
      //    formData.append('lon', lonInput.value);
      // }

      await this.presenter.handleAddStory(formData);
    });
  }

  _setupImageUpload() {
    const container = document.getElementById("image-upload-container");
    const content = document.getElementById("image-upload-content");
    const input = document.getElementById("photo");
    const preview = document.getElementById("image-preview");
    const actions = document.getElementById("image-actions");
    const changeButton = document.getElementById("change-image-button");
    const removeButton = document.getElementById("remove-image-button");

    const handleFileSelect = (file) => {
      if (file && file.type.startsWith("image/")) {
        // Validasi ukuran (contoh: maks 1MB)
        if (file.size > 1 * 1024 * 1024) {
          this._displayFieldError("photo", "Image size must not exceed 1MB");
          this._resetImageUpload();
          return;
        }

        this._photoFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.src = e.target.result;
          preview.style.display = "block";
          content.style.display = "none";
          actions.style.display = "flex";
          container.classList.add("has-image");
          this._clearErrors("photo");
        };
        reader.readAsDataURL(file);
      } else {
        this._displayFieldError("photo", "Please select a valid image file");
        this._resetImageUpload();
      }
    };

    container.addEventListener("click", (e) => {
      // Jangan trigger input jika klik tombol action atau sudah ada gambar
      if (
        !container.classList.contains("has-image") ||
        e.target === changeButton
      ) {
        input.click();
      }
    });
    container.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (!container.classList.contains("has-image")) {
          input.click();
        }
      }
    });

    input.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });

    // Drag and Drop
    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!container.classList.contains("has-image")) {
        container.style.borderColor = "var(--border-focus)"; // Highlight
      }
    });
    container.addEventListener("dragleave", (e) => {
      e.preventDefault();
      container.style.borderColor = "var(--border-primary)";
    });
    container.addEventListener("drop", (e) => {
      e.preventDefault();
      container.style.borderColor = "var(--border-primary)";
      if (
        !container.classList.contains("has-image") &&
        e.dataTransfer.files &&
        e.dataTransfer.files[0]
      ) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    changeButton.addEventListener("click", () => {
      input.click();
    });

    removeButton.addEventListener("click", () => {
      this._resetImageUpload();
    });
  }

  _resetImageUpload() {
    const input = document.getElementById("photo");
    const preview = document.getElementById("image-preview");
    const content = document.getElementById("image-upload-content");
    const actions = document.getElementById("image-actions");
    const container = document.getElementById("image-upload-container");

    this._photoFile = null;
    input.value = ""; // Reset file input
    preview.src = "#";
    preview.style.display = "none";
    content.style.display = "block";
    actions.style.display = "none";
    container.classList.remove("has-image");
    this._clearErrors("photo"); // Hapus error foto jika ada
  }

  _setupLocationPicker() {
    // const checkbox = document.getElementById('location-checkbox');
    // const container = document.getElementById('location-picker-container');
    // const coordsDisplay = document.getElementById('location-coords');
    // const latInput = document.getElementById('latitude');
    // const lonInput = document.getElementById('longitude');
    //
    // checkbox.addEventListener('change', (e) => {
    //   if (e.target.checked) {
    //     container.style.display = 'block';
    //     this._mapHandler.initMap().then(() => {
    //       this._mapHandler.getCurrentLocation((lat, lon) => {
    //         coordsDisplay.textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    //         latInput.value = lat;
    //         lonInput.value = lon;
    //       });
    //     });
    //   } else {
    //     container.style.display = 'none';
    //     coordsDisplay.textContent = 'Not set';
    //     latInput.value = '';
    //     lonInput.value = '';
    //   }
    // });
  }

  _setupCamera() {
    // Implementasi event listener untuk tombol capture,
    // Gunakan _cameraHandler.capture() dan set _photoFile
    // Mungkin perlu menampilkan preview hasil capture sebelum submit
  }

  _displayFieldError(field, error) {
    const errorElement = document.getElementById(`${field}-error`);
    if (errorElement) {
      errorElement.textContent = error || "";
    }
  }

  _clearErrors(field = null) {
    if (field) {
      const errorElement = document.getElementById(`${field}-error`);
      if (errorElement) errorElement.textContent = "";
    } else {
      const errorElements = document.querySelectorAll(".error-text");
      errorElements.forEach((el) => (el.textContent = ""));
    }
  }

  // --- Metode View untuk Presenter ---
  showLoading() {
    const button = document.getElementById("submit-button");
    const buttonText = document.getElementById("button-text");
    const spinner = document.getElementById("button-spinner");

    if (button) button.disabled = true;
    if (buttonText) buttonText.style.display = "none";
    if (spinner) spinner.style.display = "inline-block";
  }

  hideLoading() {
    const button = document.getElementById("submit-button");
    const buttonText = document.getElementById("button-text");
    const spinner = document.getElementById("button-spinner");

    if (button) button.disabled = false;
    if (buttonText) buttonText.style.display = "inline";
    if (spinner) spinner.style.display = "none";
  }

  showSuccess(message) {
    const container = document.getElementById("alert-container");
    if (container) {
      container.innerHTML = `
        <div class="alert alert-success">
          ✅ ${message}
        </div>
      `;
      window.scrollTo(0, 0); // Scroll ke atas untuk melihat pesan
    }
  }

  showError(message) {
    const container = document.getElementById("alert-container");
    if (container) {
      container.innerHTML = `
        <div class="alert alert-error">
          ❌ ${message}
        </div>
      `;
      window.scrollTo(0, 0); // Scroll ke atas untuk melihat pesan
    }
  }
}
