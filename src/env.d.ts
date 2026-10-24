interface ImportMetaEnv {
  /** Override the inquiry endpoint. Defaults to the same-origin platform API, /api/inquiries. */
  readonly PUBLIC_INQUIRY_ENDPOINT?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
