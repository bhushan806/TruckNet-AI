// ── Toast Notification Helpers ──
// FIX 10: Centralised toast helpers replacing hardcoded error strings throughout the app.
// All error messages in Hinglish for drivers/owners. Technical logs remain in English.

import { toast } from 'sonner';

// HTTP status → Hinglish user message
const HTTP_ERROR_MESSAGES: Record<number, string> = {
    400: 'Galat request hai. Dobara check karo.',
    401: 'Session khatam ho gaya. Dobara login karo. 🔐',
    403: 'Yeh karne ki permission nahi hai. 🚫',
    404: 'Yeh cheez nahi mili. 🔍',
    408: 'Request timeout ho gaya. Dobara try karo. ⏱️',
    429: 'Bahut zyada requests. Thodi der ruko. ⏳',
    500: 'Server mein kuch gadbad hui. Thodi der mein try karo. 🔧',
    502: 'Backend service se problem. AI engine check karo. 🤖',
    503: 'Server abhi available nahi. Waking up... 🚛',
    504: 'Server timeout. Internet check karo. 📶',
};

export const notify = {
    success: (msg: string) => toast.success(msg),
    error: (msg: string) => toast.error(msg),
    warning: (msg: string) => toast.warning(msg),
    info: (msg: string) => toast.info(msg),

    loading: (msg: string): string | number => toast.loading(msg),
    dismiss: (id: string | number) => toast.dismiss(id),

    promise: <T>(
        promise: Promise<T>,
        msgs: { loading: string; success: string; error: string }
    ) => toast.promise(promise, msgs),

    /**
     * Extracts HTTP status from an Axios error and shows the appropriate Hinglish toast.
     * Falls back to generic network error message.
     */
    apiError: (err: unknown, customMessage?: string) => {
        const status = (err as any)?.response?.status;
        const serverMessage = (err as any)?.response?.data?.message;

        // Prefer: custom message > server message > status-based message > generic
        const message =
            customMessage ||
            serverMessage ||
            HTTP_ERROR_MESSAGES[status] ||
            'Network error. Internet aur server check karo. 📶';

        toast.error(message);
    },

    /**
     * AI-specific error handler for chat failures.
     */
    aiError: (err: unknown) => {
        const status = (err as any)?.response?.status;
        const detail = (err as any)?.response?.data?.detail;
        const message = detail?.message || HTTP_ERROR_MESSAGES[status] || 'TruckNet Dost abhi busy hai. Dobara try karo. 🚛';
        toast.error(message);
    },
};
