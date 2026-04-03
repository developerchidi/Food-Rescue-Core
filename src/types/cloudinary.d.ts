declare module 'cloudinary' {
  export const v2: {
    config: (options: Record<string, string | undefined>) => void;
    uploader: {
      upload: (file: string, options?: Record<string, any>) => Promise<{
        secure_url: string;
        public_id: string;
        [key: string]: any;
      }>;
      destroy: (publicId: string) => Promise<{ result: string }>;
    };
  };
}
