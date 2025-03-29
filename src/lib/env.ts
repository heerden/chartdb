export const APP_URL: string = import.meta.env.VITE_APP_URL;
export const HOST_URL: string = import.meta.env.VITE_HOST_URL ?? '';
export const HIDE_BUCKLE_DOT_DEV: boolean =
    (window?.env?.HIDE_BUCKLE_DOT_DEV ??
        import.meta.env.VITE_HIDE_BUCKLE_DOT_DEV) === 'true';
