// src/scripts/utils/camera-handler.js

class CameraHandler {
  constructor() {
    this._stream = null;
    this._videoElement = null;
    this._canvasElement = null;
  }

  /**
   * Memulai stream kamera dan menampilkannya di elemen video.
   * @param {HTMLVideoElement} videoElement Elemen <video> untuk menampilkan preview.
   * @returns {Promise<MediaStream>} Promise yang resolve dengan objek MediaStream.
   */
  async startCamera(videoElement) {
    if (!videoElement) {
      throw new Error("Video element is required to start the camera.");
    }

    // ✅ PERBAIKAN: Check browser support dulu
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        "Browser tidak mendukung akses kamera. Gunakan HTTPS atau localhost, dan pastikan browser modern (Chrome/Firefox/Safari)."
      );
    }

    // ✅ PERBAIKAN: Hentikan stream lama jika ada
    if (this._stream) {
      console.warn("⚠️ Camera already running, stopping old stream first");
      this.stopCamera();
    }

    this._videoElement = videoElement;
    this._canvasElement = document.createElement("canvas");

    try {
      // ✅ PERBAIKAN: Try environment camera, fallback ke default
      let constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      try {
        this._stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (envError) {
        console.warn("Environment camera failed, trying user camera");
        constraints = {
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        try {
          this._stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (userError) {
          console.warn("User camera failed, trying basic constraints");
          this._stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      this._videoElement.srcObject = this._stream;
      this._videoElement.playsInline = true; // Penting untuk iOS
      await this._videoElement.play();

      // Sesuaikan ukuran canvas dengan ukuran video setelah metadata dimuat
      return new Promise((resolve, reject) => {
        this._videoElement.onloadedmetadata = () => {
          this._canvasElement.width = this._videoElement.videoWidth;
          this._canvasElement.height = this._videoElement.videoHeight;
          console.log("✅ Camera started successfully");
          resolve(this._stream);
        };

        // ✅ PERBAIKAN: Tambahkan error handler
        this._videoElement.onerror = (error) => {
          console.error("❌ Video element error:", error);
          this.stopCamera();
          reject(new Error("Failed to load camera video"));
        };
      });
    } catch (error) {
      console.error("Error accessing camera:", error);

      // Cleanup jika error
      this.stopCamera();
      this._stream = null;

      // ✅ PERBAIKAN: Error message yang lebih spesifik dan helpful
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        throw new Error(
          "Akses kamera ditolak. Klik ikon kamera di address bar untuk mengizinkan."
        );
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        throw new Error(
          "Kamera tidak ditemukan. Pastikan perangkat memiliki kamera."
        );
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        throw new Error(
          "Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain terlebih dahulu."
        );
      } else if (
        error.name === "OverconstrainedError" ||
        error.name === "ConstraintNotSatisfiedError"
      ) {
        throw new Error(
          "Kamera tidak mendukung resolusi yang diminta. Coba lagi."
        );
      } else if (error.name === "TypeError") {
        throw new Error(
          "Browser tidak mendukung akses kamera. Gunakan browser modern (Chrome/Firefox/Safari)."
        );
      } else {
        throw new Error(
          `Gagal mengakses kamera: ${error.message || "Unknown error"}`
        );
      }
    }
  }

  /**
   * ✅ DIPERBAIKI: Menghentikan semua track pada stream kamera dengan cleanup lengkap
   */
  stopCamera() {
    // 1. Hentikan semua track
    if (this._stream) {
      this._stream.getTracks().forEach((track) => {
        track.stop();
        console.log(`🛑 Stopped track: ${track.kind}`);
      });
      this._stream = null;
    }

    // 2. Cleanup video element
    if (this._videoElement) {
      this._videoElement.srcObject = null;
      this._videoElement.onloadedmetadata = null; // ✅ Remove event listener
      this._videoElement.onerror = null; // ✅ Remove event listener

      // Pause video jika masih playing
      if (!this._videoElement.paused) {
        this._videoElement.pause();
      }

      console.log("🎥 Video element cleaned up");
    }

    // 3. Cleanup canvas
    if (this._canvasElement) {
      const context = this._canvasElement.getContext("2d");
      if (context) {
        context.clearRect(
          0,
          0,
          this._canvasElement.width,
          this._canvasElement.height
        );
      }
      this._canvasElement = null;
    }

    this._videoElement = null;
    console.log("✅ Camera stream stopped and cleaned up");
  }

  /**
   * Menangkap frame saat ini dari video stream ke canvas dan mengembalikannya sebagai File object.
   * @returns {Promise<File|null>} Promise yang resolve dengan File object gambar (JPEG) atau null jika gagal.
   */
  capture() {
    return new Promise((resolve, reject) => {
      // ✅ PERBAIKAN: Validasi lebih ketat
      if (!this._stream) {
        return reject(
          new Error("Camera not started. Call startCamera() first.")
        );
      }

      if (!this._videoElement) {
        return reject(new Error("Video element not found."));
      }

      if (!this._canvasElement) {
        return reject(new Error("Canvas element not initialized."));
      }

      if (this._videoElement.paused || this._videoElement.ended) {
        return reject(new Error("Video is not playing."));
      }

      // ✅ PERBAIKAN: Cek apakah video sudah ready
      if (this._videoElement.readyState < 2) {
        return reject(
          new Error("Video not ready. Please wait for camera to initialize.")
        );
      }

      const context = this._canvasElement.getContext("2d");
      if (!context) {
        return reject(new Error("Failed to get canvas context."));
      }

      try {
        // Gambar frame video saat ini ke canvas
        context.drawImage(
          this._videoElement,
          0,
          0,
          this._canvasElement.width,
          this._canvasElement.height
        );

        // Konversi canvas ke Blob, lalu ke File
        this._canvasElement.toBlob(
          (blob) => {
            if (blob) {
              const fileName = `camera-capture-${Date.now()}.jpg`;
              const file = new File([blob], fileName, { type: "image/jpeg" });
              console.log(
                "📸 Captured image:",
                fileName,
                `(${(blob.size / 1024).toFixed(2)} KB)`
              );
              resolve(file);
            } else {
              reject(new Error("Failed to create blob from canvas."));
            }
          },
          "image/jpeg", // Format gambar
          0.9 // Kualitas gambar (0.0 - 1.0)
        );
      } catch (error) {
        console.error("Error capturing image:", error);
        reject(error);
      }
    });
  }

  /**
   * Mengecek apakah ada stream kamera yang aktif.
   * @returns {boolean} True jika kamera aktif.
   */
  isCameraActive() {
    return this._stream !== null && this._stream.active;
  }

  /**
   * ✅ TAMBAHAN: Get available cameras
   * Berguna untuk menampilkan pilihan kamera jika ada multiple cameras
   */
  async getAvailableCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === "videoinput");
      console.log(`📹 Found ${cameras.length} camera(s)`);
      return cameras;
    } catch (error) {
      console.error("Error enumerating cameras:", error);
      return [];
    }
  }

  /**
   * ✅ TAMBAHAN: Switch camera (front/back)
   * @param {string} facingMode - "user" (front) atau "environment" (back)
   */
  async switchCamera(facingMode = "environment") {
    if (!this._videoElement) {
      throw new Error("Camera not started. Call startCamera() first.");
    }

    // Hentikan stream lama
    this.stopCamera();

    // Start dengan facing mode baru
    const constraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    try {
      this._stream = await navigator.mediaDevices.getUserMedia(constraints);
      this._videoElement.srcObject = this._stream;
      await this._videoElement.play();
      console.log(`✅ Switched to ${facingMode} camera`);
      return this._stream;
    } catch (error) {
      console.error("Failed to switch camera:", error);
      throw error;
    }
  }
}

export default CameraHandler;
