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
    this._videoElement = videoElement;

    // Buat canvas tersembunyi untuk menggambar frame
    this._canvasElement = document.createElement("canvas");

    try {
      // Minta akses kamera belakang (environment) jika memungkinkan
      const constraints = {
        video: {
          facingMode: "environment", // Prioritaskan kamera belakang
          width: { ideal: 1280 }, // Coba resolusi HD
          height: { ideal: 720 },
        },
        audio: false, // Kita tidak butuh audio
      };

      this._stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Jika gagal mendapatkan kamera belakang, coba kamera depan
      if (!this._stream) {
        console.warn("Could not get environment camera, trying default.");
        this._stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      this._videoElement.srcObject = this._stream;
      this._videoElement.playsInline = true; // Penting untuk iOS
      await this._videoElement.play();

      // Sesuaikan ukuran canvas dengan ukuran video setelah metadata dimuat
      return new Promise((resolve) => {
        this._videoElement.onloadedmetadata = () => {
          this._canvasElement.width = this._videoElement.videoWidth;
          this._canvasElement.height = this._videoElement.videoHeight;
          resolve(this._stream); // Resolve setelah siap
        };
      });
    } catch (error) {
      console.error("Error accessing camera:", error);
      this._stream = null; // Reset stream jika gagal
      // Berikan pesan error yang lebih spesifik
      if (error.name === "NotAllowedError") {
        throw new Error(
          "Camera permission denied. Please allow camera access in your browser settings."
        );
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        throw new Error("No camera found on this device.");
      } else {
        throw new Error(
          "Could not access the camera. Please ensure it is not being used by another application."
        );
      }
    }
  }

  /**
   * Menghentikan semua track pada stream kamera saat ini.
   */
  stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach((track) => track.stop());
      this._stream = null;
      if (this._videoElement) {
        this._videoElement.srcObject = null; // Hapus stream dari video element
      }
      console.log("Camera stream stopped.");
    }
    this._videoElement = null;
    this._canvasElement = null;
  }

  /**
   * Menangkap frame saat ini dari video stream ke canvas dan mengembalikannya sebagai File object.
   * @returns {Promise<File|null>} Promise yang resolve dengan File object gambar (JPEG) atau null jika gagal.
   */
  capture() {
    return new Promise((resolve, reject) => {
      if (
        !this._stream ||
        !this._videoElement ||
        !this._canvasElement ||
        this._videoElement.paused ||
        this._videoElement.ended
      ) {
        console.error("Camera not active or ready for capture.");
        return reject(new Error("Camera not active."));
      }

      const context = this._canvasElement.getContext("2d");
      if (!context) {
        console.error("Could not get canvas context.");
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
    return this._stream !== null;
  }
}

export default CameraHandler;
