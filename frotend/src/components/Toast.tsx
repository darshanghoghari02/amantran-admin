'use client';

import React from 'react';
import { Check, Edit3, Trash2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, Toast as ToastType } from '../store/toastStore';

const premiumToastStyle = `
@keyframes slideInRight {
  from {
    transform: translateX(125%) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}
@keyframes progressShrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
.animate-slideInRight {
  animation: slideInRight 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-progressShrink {
  animation: progressShrink linear forwards;
}
`;

function getToastSuccessDescription(msg: string): string {
  const msgLower = msg.toLowerCase();
  if (msgLower.includes('template')) {
    if (msgLower.includes('created') || msgLower.includes('register')) {
      return 'The template has been created successfully.';
    }
    if (msgLower.includes('updated') || msgLower.includes('toggle') || msgLower.includes('status')) {
      return 'The template has been updated successfully.';
    }
    if (msgLower.includes('deleted')) {
      return 'The template has been deleted.';
    }
    if (msgLower.includes('duplicate')) {
      return 'The template copy has been created.';
    }
  }
  if (msgLower.includes('category')) {
    if (msgLower.includes('created')) {
      return 'The category has been created successfully.';
    }
    if (msgLower.includes('updated')) {
      return 'The category settings have been updated.';
    }
    if (msgLower.includes('deleted')) {
      return 'The category has been deleted.';
    }
  }
  if (msgLower.includes('font')) {
    if (msgLower.includes('uploaded')) {
      return 'The font asset file has been uploaded.';
    }
    if (msgLower.includes('registered')) {
      return 'The font has been registered successfully.';
    }
    if (msgLower.includes('deleted')) {
      return 'The font has been deleted.';
    }
  }
  if (msgLower.includes('language')) {
    if (msgLower.includes('registered')) {
      return 'The language locale has been registered.';
    }
    if (msgLower.includes('deleted')) {
      return 'The language locale has been deleted.';
    }
  }
  if (msgLower.includes('user')) {
    if (msgLower.includes('registered')) {
      return 'The user profile has been registered.';
    }
    if (msgLower.includes('updated')) {
      return 'The user profile has been updated.';
    }
    if (msgLower.includes('deleted')) {
      return 'The user profile has been deleted.';
    }
    if (msgLower.includes('suspended')) {
      return 'The user account has been suspended.';
    }
    if (msgLower.includes('activated')) {
      return 'The user account has been activated.';
    }
  }
  if (msgLower.includes('subscription') || msgLower.includes('properties')) {
    return 'The plan properties have been saved successfully.';
  }
  if (msgLower.includes('draft') && msgLower.includes('saved')) {
    return 'The template draft layout has been saved.';
  }
  return 'The request has been processed successfully.';
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <>
      <style>{premiumToastStyle}</style>
      <div className="fixed top-6 right-6 flex flex-col gap-4 max-w-sm w-full pointer-events-none items-end" style={{ zIndex: 99999 }}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastType; onClose: () => void }) {
  const { message, type, duration = 3500 } = toast;

  const msgLower = message.toLowerCase();

  let title = message;
  let description = 'The operation completed successfully.';
  let leftStripeColor = 'border-l-sky-500';
  let progressBg = 'bg-sky-500';
  let icon = <Info className="w-5 h-5" />;
  let iconContainerClass = 'bg-sky-50 text-sky-500 border border-sky-100';

  if (type === 'success') {
    leftStripeColor = 'border-l-emerald-500';
    progressBg = 'bg-emerald-500';
    description = getToastSuccessDescription(message);

    if (msgLower.includes('delete') || msgLower.includes('remove')) {
      leftStripeColor = 'border-l-red-500'; // Red left border for deletes
      progressBg = 'bg-red-500';
      iconContainerClass = 'bg-rose-50 text-rose-500 border border-rose-100';
      icon = <Trash2 className="w-4.5 h-4.5" />;
    } else if (msgLower.includes('update') || msgLower.includes('edit') || msgLower.includes('toggle') || msgLower.includes('status') || msgLower.includes('duplicate') || msgLower.includes('save')) {
      leftStripeColor = 'border-l-blue-500'; // Blue left border for updates
      progressBg = 'bg-blue-500';
      iconContainerClass = 'bg-blue-50 text-blue-500 border border-blue-100';
      icon = <Edit3 className="w-4.5 h-4.5" />;
    } else {
      // Created
      leftStripeColor = 'border-l-emerald-500'; // Green left border for creates
      progressBg = 'bg-[#10B981]';
      iconContainerClass = 'bg-[#10B981] text-white';
      icon = <Check className="w-5 h-5 stroke-[3.5]" />;
    }
  } else if (type === 'error') {
    title = 'Operation Failed';
    description = message;
    leftStripeColor = 'border-l-red-500';
    progressBg = 'bg-red-500';
    iconContainerClass = 'bg-rose-50 text-rose-500 border border-rose-100';
    icon = <Trash2 className="w-4.5 h-4.5" />;
  } else if (type === 'warning') {
    title = 'Warning Alert';
    description = message;
    leftStripeColor = 'border-l-amber-500';
    progressBg = 'bg-amber-500';
    iconContainerClass = 'bg-amber-50 text-amber-500 border border-amber-100';
    icon = <AlertCircle className="w-4.5 h-4.5" />;
  } else {
    // Info
    title = 'Notification Spec';
    description = message;
    leftStripeColor = 'border-l-blue-500';
    progressBg = 'bg-blue-500';
    iconContainerClass = 'bg-blue-50 text-blue-500 border border-blue-100';
    icon = <Info className="w-4.5 h-4.5" />;
  }

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden flex items-start gap-4 p-5 pb-7 rounded-2xl bg-white border-y border-r border-y-gray-200/70 border-r-gray-200/70 border-l-[5px] ${leftStripeColor} shadow-[0_10px_35px_rgba(0,0,0,0.05)] animate-slideInRight transition-all duration-300 w-[380px]`}
      role="alert"
    >
      {/* Styled Round Icon Badge */}
      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${iconContainerClass}`}>
        {icon}
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0 pr-2">
        <h5 className="text-[13px] font-extrabold text-gray-900 leading-snug">
          {title}
        </h5>
        <p className="text-[11px] font-semibold text-gray-400 mt-1 leading-normal">
          {description}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="shrink-0 self-start p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors -mr-1.5 -mt-1"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Subtle Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-50/50">
        <div
          className={`h-full ${progressBg} animate-progressShrink`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
}
