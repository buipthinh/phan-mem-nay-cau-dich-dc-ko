/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Địa chỉ API khi API chạy ở máy khác. Để trống thì gọi /api trên cùng địa chỉ với trang. */
  readonly VITE_API_URL?: string;
}
