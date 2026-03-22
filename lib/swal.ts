import Swal from "sweetalert2";

const baseToastConfig = {
  toast: true,
  position: "top-end" as const,
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: true,
  width: 320,
  padding: "10px 14px",
  showClass: {
    popup: "animate-fade-in-up",
  },
  hideClass: {
    popup: "animate-fade-in",
  },
};

export const toastSuccess = (title?: string) => {
  return Swal.fire({
    ...baseToastConfig,
    icon: "success",
    iconColor: "#ffffff",
    title: title || "Copied to clipboard!",
    background: "#22c55e",
    color: "#ffffff",
  });
};

export const toastError = (message?: string) => {
  return Swal.fire({
    ...baseToastConfig,
    icon: "error",
    iconColor: "#ffffff",
    title: message || "Something went wrong!",
    background: "#ef4444",
    color: "#ffffff",
  });
};

export const toastWarning = (message?: string) => {
  return Swal.fire({
    ...baseToastConfig,
    icon: "warning",
    iconColor: "#ffffff",
    title: message || "Warning",
    background: "#f59e0b",
    color: "#ffffff",
  });
};

export const toastInfo = (title?: string, message?: string) => {
  return Swal.fire({
    ...baseToastConfig,
    icon: "info",
    iconColor: "#ffffff",
    title: title || "Info",
    text: message,
    background: "#3b82f6",
    color: "#ffffff",
  });
};

export const alertSuccess = (title: string, text?: string) => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonColor: "#3b82f6",
    showClass: { popup: "animate-scale-in" },
  });
};

export const alertError = (title: string, text?: string) => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: "#ef4444",
    showClass: { popup: "animate-scale-in" },
  });
};

export const alertInfo = (title: string, text?: string) => {
  return Swal.fire({
    icon: "info",
    title,
    text,
    confirmButtonColor: "#3b82f6",
    showClass: { popup: "animate-scale-in" },
  });
};
