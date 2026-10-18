import { useEffect, useRef, useState } from "react";

export type ImageAttachment = {
  file: File;
  url: string;
};

export function useImageAttach() {
  const [attach, setAttach] = useState<ImageAttachment | null>(null);
  const urlRef = useRef<string | null>(null);

  function pick(file: File | null) {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    if (!file) {
      setAttach(null);
      return;
    }
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    setAttach({ file, url });
  }

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  return { attach, pick };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("unreadable"));
    reader.onerror = () => reject(new Error("unreadable"));
    reader.readAsDataURL(file);
  });
}
