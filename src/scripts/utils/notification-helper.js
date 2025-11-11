import Swal from "sweetalert2";

const NotificationHelper = {
  // Untuk menggantikan showSuccess()
  showSuccess(message) {
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: message,
      background: "var(--bg-card)",
      color: "var(--text-primary)",
      timer: 1500, // Menutup otomatis setelah 1.5 detik
      showConfirmButton: false,
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
};

export default NotificationHelper;
