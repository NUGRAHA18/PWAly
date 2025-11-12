import authGuard from "../../utils/auth-guard";
import AddStoryPresenter from "../../presenters/add-story-presenter";
import { validators } from "../../utils/validators";
import MapHandler from "../../utils/map-handler";
import CameraHandler from "../../utils/camera-handler";
import NotificationHelper from "../../utils/notification-helper";

export default class AddStoryPage {
  constructor() {
    this.presenter = new AddStoryPresenter(this);
    this._photoFile = null;
    this._mapHandler = null;
    this._selectedLocation = null;
    this._cameraHandler = new CameraHandler();
    this._activeStream = null;
  }

  async render() {
    if (!authGuard.requireAuth()) return "";
    return `
      <section class="add-story-container container">
        <div class="add-story-header">
          <h1 class="add-story-title">Create New Story</h1>
          <p class="add-story-subtitle">Share your moments with the community</p>
        </div>

        <form id="add-story-form" class="add-story-form">
          <div class="form-section">
            <h2 class="form-section-title">📷 Photo</h2>
            <div class="photo-options mb-md" id="photo-options">
               <button type="button" id="upload-option-button" class="btn btn-secondary btn-sm">Upload File</button>
               <button type="button" id="camera-option-button" class="btn btn-secondary btn-sm">Use Camera</button>
            </div>

            <div id="upload-area" style="display: block;">
               <div class="form-group">
                 <label for="photo" class="form-label visually-hidden">Photo</label>
                 <div id="image-upload-container" class="image-upload-container" role="button" tabindex="0" aria-label="Upload image area">
                    <input type="file" id="photo" name="photo" accept="image/*" class="visually-hidden">
                    <div id="image-upload-content">
                        <div class="image-upload-icon">⬆️</div>
                        <p class="image-upload-text">Click or drag image here to upload</p>
                        <p class="form-help">Max file size 1MB</p>
                    </div>
                    <img id="image-preview-upload" class="image-preview" alt="Image preview" style="display: none;">
                 </div>
                  <div id="image-actions-upload" class="image-actions" style="display: none;">
                     <button type="button" id="change-image-button" class="btn btn-secondary btn-sm">Change Image</button>
                     <button type="button" id="remove-image-button-upload" class="btn btn-danger btn-sm">Remove Image</button>
                  </div>
                 <span class="error-text" id="photo-error"></span>
               </div>
            </div>

            <div id="camera-area" style="display: none;">
              <div class="camera-container mb-md">
                 <video id="camera-preview" playsinline autoplay muted></video>
                 <div id="camera-error" class="alert alert-error" style="display: none;"></div>
              </div>
              <div class="camera-controls">
                 <button type="button" id="capture-button" class="btn btn-primary">Capture Photo</button>
                 <button type="button" id="cancel-camera-button" class="btn btn-secondary btn-sm">Cancel</button>
              </div>
            </div>

             <div id="preview-area" class="mt-md" style="display: none;">
                <img id="image-preview" class="image-preview" alt="Selected image preview">
                 <div id="image-actions" class="image-actions mt-sm">
                   <button type="button" id="remove-image-button" class="btn btn-danger btn-sm">Remove Image</button>
                 </div>
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

          <div class="form-section hide-on-camera">
            <h2 class="form-section-title">📍 Location (Optional)</h2>
            <p class="form-help mb-md">Click on the map to set the story location.</p>
            <div class="location-picker">
              <div class="location-info">
                 Coordinates: <span id="location-coords" class="location-coords">Not set</span>
              </div>
              <div id="location-map"></div>
            </div>
             <input type="hidden" id="latitude" name="lat">
            <input type="hidden" id="longitude" name="lon">
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
    if (!authGuard.isAuthenticated()) return;

    this._mapHandler = new MapHandler("location-map");
    this._mapHandler.init();

    this._setupFormSubmit();
    this._setupImageUpload();
    this._setupLocationPicker();
    this._setupCameraControls();
    this._updatePhotoUIState();
  }

  _setupFormSubmit() {
    const form = document.getElementById("add-story-form");
    const descriptionInput = document.getElementById("description");
    const latInput = document.getElementById("latitude");
    const lonInput = document.getElementById("longitude");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      this._clearErrors();

      const description = descriptionInput.value.trim();
      const photoFile = this._photoFile;
      const lat = latInput.value;
      const lon = lonInput.value;

      const photoError = !photoFile ? "Photo is required" : null;
      const descriptionError = validators.required(description, "Description");

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

      const storyData = {
        description: description,
        photo: photoFile,
        lat: lat || null,
        lon: lon || null,
      };

      await this.presenter.handleAddStory(storyData);
    });
  }

  _setupImageUpload() {
    const container = document.getElementById("image-upload-container");
    const content = document.getElementById("image-upload-content");
    const input = document.getElementById("photo");
    const previewUpload = document.getElementById("image-preview-upload");
    const actionsUpload = document.getElementById("image-actions-upload");
    const changeButton = document.getElementById("change-image-button");
    const removeButtonUpload = document.getElementById(
      "remove-image-button-upload"
    );

    const handleFileSelect = (file) => {
      if (file && file.type.startsWith("image/")) {
        if (file.size > 1 * 1024 * 1024) {
          this._displayFieldError("photo", "Image size must not exceed 1MB");
          this._resetImageState();
          return;
        }

        this._photoFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          this._displayPreview(e.target.result);
          this._updatePhotoUIState();
          this._clearErrors("photo");
        };
        reader.readAsDataURL(file);
      } else {
        this._displayFieldError("photo", "Please select a valid image file");
        this._resetImageState();
      }
    };

    container.addEventListener("click", () => input.click());
    container.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") input.click();
    });
    input.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0])
        handleFileSelect(e.target.files[0]);
    });

    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      container.style.borderColor = "var(--border-focus)";
    });
    container.addEventListener("dragleave", (e) => {
      e.preventDefault();
      container.style.borderColor = "var(--border-primary)";
    });
    container.addEventListener("drop", (e) => {
      e.preventDefault();
      container.style.borderColor = "var(--border-primary)";
      if (e.dataTransfer.files && e.dataTransfer.files[0])
        handleFileSelect(e.dataTransfer.files[0]);
    });

    changeButton.addEventListener("click", () => input.click());
    removeButtonUpload.addEventListener("click", () => this._resetImageState());
  }

  _setupCameraControls() {
    const uploadOptionButton = document.getElementById("upload-option-button");
    const cameraOptionButton = document.getElementById("camera-option-button");
    const cameraArea = document.getElementById("camera-area");
    const uploadArea = document.getElementById("upload-area");
    const cameraPreview = document.getElementById("camera-preview");
    const captureButton = document.getElementById("capture-button");
    const cancelCameraButton = document.getElementById("cancel-camera-button");
    const cameraError = document.getElementById("camera-error");

    cameraOptionButton.addEventListener("click", async () => {
      this._clearErrors();
      cameraError.style.display = "none";
      cameraError.textContent = "";
      this._updatePhotoUIState("camera");
      document.body.classList.add("camera-active");

      try {
        this._activeStream = await this._cameraHandler.startCamera(
          cameraPreview
        );
        console.log("✅ Camera started successfully");
      } catch (error) {
        console.error("❌ Failed to start camera:", error);

        cameraError.textContent = error.message;
        cameraError.style.display = "block";

        this._updatePhotoUIState("options");
        document.body.classList.remove("camera-active");
      }
    });

    uploadOptionButton.addEventListener("click", () => {
      this._cameraHandler.stopCamera();
      this._activeStream = null;
      this._updatePhotoUIState("upload");
      document.body.classList.remove("camera-active");
    });

    captureButton.addEventListener("click", async () => {
      this.showLoading();
      this._clearErrors("photo");
      try {
        const capturedFile = await this._cameraHandler.capture();
        if (capturedFile) {
          this._photoFile = capturedFile;
          const reader = new FileReader();
          reader.onload = (e) => this._displayPreview(e.target.result);
          reader.readAsDataURL(capturedFile);

          this._cameraHandler.stopCamera();
          this._activeStream = null;
          this._updatePhotoUIState();
          document.body.classList.remove("camera-active");
        }
      } catch (error) {
        console.error("Capture failed:", error);
        this._displayFieldError(
          "photo",
          "Failed to capture image. Please try again."
        );
      } finally {
        this.hideLoading();
      }
    });

    cancelCameraButton.addEventListener("click", () => {
      this._cameraHandler.stopCamera();
      this._activeStream = null;
      this._updatePhotoUIState("options");
      document.body.classList.remove("camera-active");
    });

    const removeButton = document.getElementById("remove-image-button");
    removeButton.addEventListener("click", () => this._resetImageState());
  }

  _setupLocationPicker() {
    if (!this._mapHandler || !this._mapHandler.map) {
      console.error("MapHandler not initialized properly.");
      return;
    }

    const coordsDisplay = document.getElementById("location-coords");
    const latInput = document.getElementById("latitude");
    const lonInput = document.getElementById("longitude");
    let locationMarker = null;

    this._mapHandler.onClick((e) => {
      const { lat, lng } = e.latlng;
      this._selectedLocation = { lat, lon: lng };

      coordsDisplay.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      latInput.value = lat;
      lonInput.value = lng;

      if (locationMarker) locationMarker.remove();
      locationMarker = this._mapHandler.addMarker(lat, lng, "Story location");
      this._mapHandler.map.panTo(e.latlng);
    });
  }

  _updatePhotoUIState(state = null) {
    const optionsArea = document.getElementById("photo-options");
    const uploadArea = document.getElementById("upload-area");
    const cameraArea = document.getElementById("camera-area");
    const previewArea = document.getElementById("preview-area");
    const imageUploadContainer = document.getElementById(
      "image-upload-container"
    );
    const fileInput = document.getElementById("photo");

    if (state === null) {
      state = this._photoFile ? "preview" : "options";
    }

    optionsArea.style.display = "none";
    uploadArea.style.display = "none";
    cameraArea.style.display = "none";
    previewArea.style.display = "none";
    imageUploadContainer.classList.remove("has-image");

    if (fileInput) fileInput.disabled = true;

    if (state === "options") {
      optionsArea.style.display = "flex";
    } else if (state === "upload") {
      optionsArea.style.display = "flex";
      uploadArea.style.display = "block";
      if (fileInput) fileInput.disabled = false;
    } else if (state === "camera") {
      optionsArea.style.display = "none";
      cameraArea.style.display = "block";
    } else if (state === "preview") {
      optionsArea.style.display = "none";
      previewArea.style.display = "block";
    }
  }

  _displayPreview(imageUrl) {
    const previewElement = document.getElementById("image-preview");
    previewElement.src = imageUrl;
    this._updatePhotoUIState("preview");
  }

  _resetImageState() {
    this._cameraHandler.stopCamera();
    this._activeStream = null;
    this._photoFile = null;
    document.body.classList.remove("camera-active");

    const input = document.getElementById("photo");
    if (input) input.value = "";

    const preview = document.getElementById("image-preview");
    if (preview) preview.src = "#";
    const previewUpload = document.getElementById("image-preview-upload");
    if (previewUpload) {
      previewUpload.src = "#";
      previewUpload.style.display = "none";
    }
    const uploadContent = document.getElementById("image-upload-content");
    if (uploadContent) uploadContent.style.display = "block";

    this._clearErrors("photo");
    this._updatePhotoUIState("options");
  }

  _displayFieldError(field, error) {
    const errorElement = document.getElementById(`${field}-error`);
    if (errorElement) errorElement.textContent = error || "";

    const inputElement = document.getElementById(field);
    const isPhotoError = field === "photo";
    const uploadContainer = document.getElementById("image-upload-container");

    if (inputElement && !isPhotoError) {
      inputElement.classList.toggle("error", !!error);
    } else if (isPhotoError && uploadContainer) {
      uploadContainer.style.borderColor = error
        ? "var(--color-error)"
        : "var(--border-primary)";
    }
  }

  _clearErrors(field = null) {
    if (field) {
      const errorElement = document.getElementById(`${field}-error`);
      if (errorElement) errorElement.textContent = "";

      const inputElement = document.getElementById(field);
      const isPhotoError = field === "photo";
      const uploadContainer = document.getElementById("image-upload-container");

      if (inputElement && !isPhotoError) inputElement.classList.remove("error");
      if (isPhotoError && uploadContainer)
        uploadContainer.style.borderColor = "var(--border-primary)";
    } else {
      document
        .querySelectorAll(".error-text")
        .forEach((el) => (el.textContent = ""));
      document
        .querySelectorAll(".form-input.error, .form-textarea.error")
        .forEach((el) => el.classList.remove("error"));
      const uploadContainer = document.getElementById("image-upload-container");
      if (uploadContainer)
        uploadContainer.style.borderColor = "var(--border-primary)";
    }
  }

  showLoading() {
    const button = document.getElementById("submit-button");
    if (button) button.disabled = true;
    NotificationHelper.showLoading();
  }

  hideLoading() {
    const button = document.getElementById("submit-button");
    if (button) button.disabled = false;
    NotificationHelper.hideLoading();
  }

  showSuccess(message) {
    NotificationHelper.showSuccess(message);
  }

  showError(message) {
    NotificationHelper.showError(message);
  }

  async destroy() {
    if (this._mapHandler) {
      this._mapHandler.destroy();
      this._mapHandler = null;
    }
    this._cameraHandler.stopCamera();
    this._activeStream = null;
    document.body.classList.remove("camera-active");
    console.log("AddStoryPage destroyed, resources cleaned up.");
  }
}
