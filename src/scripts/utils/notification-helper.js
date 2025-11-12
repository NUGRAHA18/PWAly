import swal from "sweetalert2";

const NotificationHelper = {
  // Global Loading Indicator (untuk memblokir UI selama proses)
  showLoading() {
    swal.fire({
      title: "Processing...",
      text: "Please wait.",
      allowOutsideClick: false,
      didOpen: () => {
        swal.showLoading();
      },
    });
  },

  hideLoading() {
    swal.close();
  },

  // Toast notifications (untuk notifikasi kecil di sudut)
  showToast(message, icon = "success") {
    const Toast = swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", swal.stopTimer);
        toast.addEventListener("mouseleave", swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: icon,
      title: message,
    });
  },

  // Modal alerts (untuk notifikasi besar)
  showSuccess(message) {
    swal.fire("Success", message, "success");
  },

  showError(message) {
    swal.fire("Error", message, "error");
  },
};

export default NotificationHelper;
