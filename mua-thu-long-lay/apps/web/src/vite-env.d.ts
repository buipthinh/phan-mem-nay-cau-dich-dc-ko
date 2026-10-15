/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Địa chỉ Edge Function dịch máy (tuỳ chọn). Bỏ trống thì dùng bản dịch mẫu. */
  readonly VITE_TRANSLATE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
