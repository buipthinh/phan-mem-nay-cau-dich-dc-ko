/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Địa chỉ dịch vụ dịch máy (tuỳ chọn). Bỏ trống thì dùng bản dịch mẫu. */
  readonly VITE_TRANSLATE_URL?: string;
  /** Địa chỉ trang web của khách, in vào mã QR. Bỏ trống thì dùng thư mục khach/ cạnh web quản trị. */
  readonly VITE_GUEST_URL?: string;
  /** Địa chỉ API khi API chạy ở máy khác. Bỏ trống thì gọi /api trên cùng địa chỉ với web. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
