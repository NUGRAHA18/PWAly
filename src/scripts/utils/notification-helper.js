import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: "var(--bg-card)", // Ambil warna dari CSS
  color: "var(--text-primary)", // Ambil warna dari CSS
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const NotificationHelper = {
  showToast(message, icon = "success") {
    Toast.fire({
      icon: icon,
      title: message,
    });
  },
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
