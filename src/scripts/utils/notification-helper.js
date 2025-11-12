import swal from "sweetalert2";
const NotificationHelper = {
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

  showSuccess(message) {
    this.showToast(message, "success");
  },
  showError(message) {
    swal.fire("Error", message, "error");
  },
};
export default NotificationHelper;
