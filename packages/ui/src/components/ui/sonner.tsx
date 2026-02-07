import { Toaster as Sonner } from "sonner";

interface ToasterProps {
  position?: "top-center" | "top-right" | "bottom-center" | "bottom-right";
}

export const Toaster = ({ position = "top-center" }: ToasterProps) => {
  return (
    <Sonner
      position={position}
      toastOptions={{
        style: {
          background: "rgba(17, 19, 24, 0.95)",
          border: "1px solid rgba(238, 230, 215, 0.15)",
          color: "#f6f2ea",
          backdropFilter: "blur(12px)",
        },
        className: "sonner-toast",
      }}
      richColors
      closeButton
    />
  );
};
