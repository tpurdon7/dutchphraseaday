type ToastProps = {
  show: boolean;
  message: string;
};

export const Toast = ({ show, message }: ToastProps) => {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-pulseSoft rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-soft">
      {message}
    </div>
  );
};
