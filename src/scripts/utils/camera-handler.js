// src/scripts/utils/camera-handler.js

class CameraHandler {
  constructor() {
    this._stream = null;
    this._videoElement = null;
    this._canvasElement = null;
  }

  /**
   * Memulai stream kamera dan menampilkannya di elemen video.
   * @param {HTMLVideoElement} videoElement - Elemen <video> untuk preview kamera.
   * @returns {Promise<MediaStream>} Stream kamera aktif.
   */
  async startCamera(videoElement) {
    if (!videoElement)
      throw new Error("Video element is required to start the camera.");

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Browser tidak mendukung akses kamera. Gunakan HTTPS atau browser modern."
      );
    }

    if (this._stream) {
      console.warn("⚠️ Camera already running, stopping old stream first.");
      this.stopCamera();
    }

    this._videoElement = videoElement;
    this._canvasElement = document.createElement("canvas");

    const baseConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      audio: false,
    };

    try {
      this._stream = await this._getStreamWithFallback(baseConstraints);
      await this._initializeVideoStream();

      return new Promise((resolve, reject) => {
        this._videoElement.onloadedmetadata = () => {
          this._adjustCanvasSize();
          console.log("✅ Camera started successfully");
          resolve(this._stream);
        };

        this._videoElement.onerror = (error) => {
          console.error("❌ Video element error:", error);
          this.stopCamera();
          reject(new Error("Failed to load camera video."));
        };
      });
    } catch (error) {
      console.error("Error accessing camera:", error);
      this.stopCamera();
      this._handleCameraError(error);
    }
  }

  /**
   * Mencoba mendapatkan stream kamera dengan fallback berurutan:
   * environment → user → basic constraints.
   */
  async _getStreamWithFallback(baseConstraints) {
    const modes = ["environment", "user"];
    for (const mode of modes) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { ...baseConstraints, facingMode: mode },
          audio: false,
        });
      } catch {
        console.warn(`${mode} camera failed, trying next option...`);
      }
    }
    console.warn("Fallback to basic constraints.");
    return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }

  /**
   * Menginisialisasi video element untuk menampilkan stream kamera.
   */
  async _initializeVideoStream() {
    this._videoElement.srcObject = this._stream;
    this._videoElement.playsInline = true; // iOS requirement
    await this._videoElement.play();
  }

  /**
   * Menyesuaikan ukuran canvas dengan ukuran video.
   */
  _adjustCanvasSize() {
    this._canvasElement.width = this._videoElement.videoWidth;
    this._canvasElement.height = this._videoElement.videoHeight;
  }

  /**
   * Menangani error spesifik kamera dengan pesan user-friendly.
   */
  _handleCameraError(error) {
    const errorMessages = {
      NotAllowedError:
        "Akses kamera ditolak. Klik ikon kamera di address bar untuk mengizinkan.",
      PermissionDeniedError: "Akses kamera ditolak.",
      NotFoundError:
        "Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.",
      DevicesNotFoundError: "Perangkat kamera tidak ditemukan.",
      NotReadableError: "Kamera sedang digunakan aplikasi lain.",
      TrackStartError: "Kamera sedang digunakan aplikasi lain.",
      OverconstrainedError: "Kamera tidak mendukung resolusi yang diminta.",
      ConstraintNotSatisfiedError: "Resolusi kamera tidak didukung.",
      TypeError:
        "Browser tidak mendukung akses kamera. Gunakan browser modern.",
    };

    const message =
      errorMessages[error.name] ||
      `Gagal mengakses kamera: ${error.message || "Unknown error"}`;
    throw new Error(message);
  }

  /**
   * Menghentikan semua stream dan membersihkan elemen.
   */
  stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach((track) => {
        track.stop();
        console.log(`🛑 Stopped track: ${track.kind}`);
      });
      this._stream = null;
    }

    if (this._videoElement) {
      this._videoElement.srcObject = null;
      this._videoElement.onloadedmetadata = null;
      this._videoElement.onerror = null;
      if (!this._videoElement.paused) this._videoElement.pause();
      console.log("🎥 Video element cleaned up");
    }

    if (this._canvasElement) {
      const ctx = this._canvasElement.getContext("2d");
      if (ctx)
        ctx.clearRect(
          0,
          0,
          this._canvasElement.width,
          this._canvasElement.height
        );
      this._canvasElement = null;
    }

    this._videoElement = null;
    console.log("✅ Camera stream stopped and cleaned up");
  }

  /**
   * Menangkap frame dari video stream sebagai File (JPEG).
   * @returns {Promise<File>} File hasil tangkapan kamera.
   */
  async capture() {
    if (!this._stream)
      throw new Error("Camera not started. Call startCamera() first.");
    if (!this._videoElement) throw new Error("Video element not found.");
    if (!this._canvasElement)
      throw new Error("Canvas element not initialized.");
    if (this._videoElement.paused || this._videoElement.ended)
      throw new Error("Video is not playing.");
    if (this._videoElement.readyState < 2)
      throw new Error("Video not ready. Please wait.");

    const ctx = this._canvasElement.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context.");

    ctx.drawImage(
      this._videoElement,
      0,
      0,
      this._canvasElement.width,
      this._canvasElement.height
    );

    return new Promise((resolve, reject) => {
      this._canvasElement.toBlob(
        (blob) => {
          if (!blob)
            return reject(new Error("Failed to create blob from canvas."));
          const fileName = `camera-capture-${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: "image/jpeg" });
          console.log(
            `📸 Captured image: ${fileName} (${(blob.size / 1024).toFixed(
              2
            )} KB)`
          );
          resolve(file);
        },
        "image/jpeg",
        0.9
      );
    });
  }

  /**
   * Mengecek apakah kamera sedang aktif.
   * @returns {boolean}
   */
  isCameraActive() {
    return Boolean(this._stream?.active);
  }

  /**
   * Mengambil daftar kamera yang tersedia.
   * @returns {Promise<MediaDeviceInfo[]>}
   */
  async getAvailableCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === "videoinput");
      console.log(`📹 Found ${cameras.length} camera(s).`);
      return cameras;
    } catch (error) {
      console.error("Error enumerating cameras:", error);
      return [];
    }
  }

  /**
   * Mengganti kamera (front/back).
   * @param {"user"|"environment"} facingMode
   */
  async switchCamera(facingMode = "environment") {
    if (!this._videoElement)
      throw new Error("Camera not started. Call startCamera() first.");

    this.stopCamera();

    const constraints = {
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    try {
      this._stream = await navigator.mediaDevices.getUserMedia(constraints);
      await this._initializeVideoStream();
      console.log(`✅ Switched to ${facingMode} camera`);
      return this._stream;
    } catch (error) {
      console.error("Failed to switch camera:", error);
      throw error;
    }
  }
}

export default CameraHandler;
