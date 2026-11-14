import { AUTH_SECRET_PLACEHOLDER, envConfigs } from '@/config';

export const PREVIEW_MAX_EDGE = 512;

/** Encode a separate, reduced-resolution preview. The original is never sent to the browser. */
export async function createImagePreview(
  bytes: Uint8Array
): Promise<Uint8Array> {
  const { PhotonImage, SamplingFilter, resize } =
    await import('@cf-wasm/photon');
  const original = PhotonImage.new_from_byteslice(bytes);
  let preview: InstanceType<typeof PhotonImage> | undefined;
  try {
    const width = original.get_width();
    const height = original.get_height();
    if (!width || !height || width * height > 16_777_216)
      throw new Error('Image is too large');
    // Even a small source gets reduced, so a trial never exposes the original pixels.
    const scale = Math.min(0.5, PREVIEW_MAX_EDGE / Math.max(width, height));
    preview = resize(
      original,
      Math.max(1, Math.round(width * scale)),
      Math.max(1, Math.round(height * scale)),
      SamplingFilter.Lanczos3
    );
    return preview.get_bytes_jpeg(45);
  } finally {
    preview?.free();
    original.free();
  }
}

function encryptionSecret() {
  if (envConfigs.auth_secret) return envConfigs.auth_secret;
  if (process.env.NODE_ENV !== 'production') return AUTH_SECRET_PLACEHOLDER;
  throw new Error('AUTH_SECRET is required to protect original images');
}

async function keyFor(secret: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`image-original:v1:${secret}`)
  );
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
}

/** Public object storage contains ciphertext only; each payload is bound to its task ID. */
export async function sealImageOriginal(
  bytes: Uint8Array,
  id: string,
  secret = encryptionSecret()
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(id) },
      await keyFor(secret),
      new Uint8Array(bytes)
    )
  );
  const packed = new Uint8Array(iv.length + ciphertext.length);
  packed.set(iv);
  packed.set(ciphertext, iv.length);
  return packed;
}

export async function openImageOriginal(
  bytes: Uint8Array,
  id: string,
  secret = encryptionSecret()
) {
  if (bytes.length < 29) throw new Error('Invalid original image');
  return new Uint8Array(
    await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(bytes.slice(0, 12)),
        additionalData: new TextEncoder().encode(id),
      },
      await keyFor(secret),
      new Uint8Array(bytes.slice(12))
    )
  );
}
