import { puter } from "@heyputer/puter.js";
import { ROOMIFY_RENDER_PROMPT } from "./constants";
import { isHostedUrl } from "./utils";

export const fetchAsDataUrl = async (url: string): Promise<string> => {
  if (url.startsWith("data:")) return url;

  // If it's a puter.site hosted url, attempt to read directly from puter.fs first to bypass CORS
  if (isHostedUrl(url)) {
    try {
      const urlObj = new URL(url);
      const fsPath = urlObj.pathname.startsWith("/")
        ? urlObj.pathname.slice(1)
        : urlObj.pathname;
      const fileBlob = await puter.fs.read(fsPath);
      if (fileBlob instanceof Blob) {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileBlob);
        });
      }
    } catch (fsErr) {
      console.warn("Direct puter.fs read fallback:", fsErr);
    }
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generate3DView = async ({ sourceImage }: Generate3DViewParams) => {
  const dataUrl = sourceImage.startsWith("data:")
    ? sourceImage
    : await fetchAsDataUrl(sourceImage);

  const base64Data = dataUrl.split(",")[1];
  const mimeType = dataUrl.split(";")[0].split(":")[1];

  if (!mimeType || !base64Data) throw new Error("Invalid source image payload");

  // Supported Gemini image models to try in sequence
  const modelsToTry = [
    "gemini-2.5-flash-image-preview",
    "gemini-2.5-flash-image",
    "google/gemini-2.5-flash-image",
    "google/gemini-3.1-flash-image",
  ];

  let response: any = null;
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      response = await puter.ai.txt2img(ROOMIFY_RENDER_PROMPT, {
        provider: "gemini",
        model,
        input_image: base64Data,
        input_image_mime_type: mimeType,
        ratio: { w: 1024, h: 1024 },
      });
      if (response) break;
    } catch (e: any) {
      console.warn(`Puter txt2img with model ${model} (base64) failed:`, e);
      lastError = e;
      
      if (
        e?.code === "insufficient_funds" ||
        e?.errorCode === "moderation_flagged"
      ) {
        continue;
      }
      // Also try with full data URI as input_image
      try {
        response = await puter.ai.txt2img(ROOMIFY_RENDER_PROMPT, {
          provider: "gemini",
          model,
          input_image: dataUrl,
          input_image_mime_type: mimeType,
          ratio: { w: 1024, h: 1024 },
        });
        if (response) break;
      } catch (e2: any) {
        console.warn(`Puter txt2img with model ${model} (dataUrl) failed:`, e2);
        lastError = e2;
      }
    }
  }

  // Fallback: try provider default without specifying model
  if (!response) {
    try {
      response = await puter.ai.txt2img(ROOMIFY_RENDER_PROMPT, {
        provider: "gemini",
        input_image: dataUrl,
        input_image_mime_type: mimeType,
        ratio: { w: 1024, h: 1024 },
      });
    } catch (fallbackErr: any) {
      console.error("All Puter txt2img model attempts failed:", fallbackErr);
      throw fallbackErr || lastError || new Error("Failed to generate 3D view");
    }
  }

  const rawImageUrl =
    (response as HTMLImageElement)?.src ??
    (typeof response === "string" ? response : null);

  if (!rawImageUrl) return { renderedImage: null, renderedPath: undefined };

  const renderedImage = rawImageUrl.startsWith("data:")
    ? rawImageUrl
    : await fetchAsDataUrl(rawImageUrl);

  return { renderedImage, renderedPath: undefined };
};
