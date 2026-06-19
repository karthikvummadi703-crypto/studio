import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      <div role="region" aria-live="polite" aria-label="Notifications" aria-atomic="false">
        {toasts.map(function ({ id, title, description, action, ...props }) {
          const isDestructive = props.variant === "destructive";
          return (
            <Toast
              key={id}
              {...props}
              aria-live={isDestructive ? "assertive" : "polite"}
              role={isDestructive ? "alert" : undefined}
            >
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
              {action}
              <ToastClose />
            </Toast>
          );
        })}
      </div>
      <ToastViewport />
    </ToastProvider>
  );
}
