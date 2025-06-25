/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MODELS_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
