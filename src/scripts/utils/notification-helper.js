import Swal from "sweetalert2";

const NotificationHelper = {
  // Untuk menggantikan showSuccess()
  showSuccess(message) {
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: message,
      // Ini akan mengambil warna dari CSS variables Anda
      background: "var(--bg-card)",
      color: "var(--text-primary)",
    });
  },

  // Untuk menggantikan showError()
  showError(message) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: message,
      background: "var(--bg-card)",
      color: "var(--text-primary)",
    });
  },

  // Untuk menggantikan showLoading() di form
  showLoading() {
    Swal.fire({
      title: "Loading...",
      text: "Please wait",
      background: "var(--bg-card)",
      color: "var(--text-primary)",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  },

  // Untuk menggantikan hideLoading()
  hideLoading() {
    Swal.close();
  },

  showSuccess(message) {
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: message,
      background: "var(--bg-card)",
      color: "var(--text-primary)",
      timer: 1500, // Tambahkan timer (dalam milidetik)
      showConfirmButton: false, // Sembunyikan tombol OK
    });
  },
};

export default NotificationHelper;
