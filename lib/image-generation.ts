import type { ImageStyleSlug } from "@/lib/image-style-slugs";

export const IMAGE_GENERATION_MODEL =
  "Rundiffusion/Juggernaut-Lightning-Flux" as const;

export const IMAGE_GENERATION_WIDTH = 1024;
export const IMAGE_GENERATION_HEIGHT = 768;
export const IMAGE_GENERATION_STEPS = 4;
export const ITERATIVE_MODE_SEED = 123;
// Canonical model page: https://www.together.ai/models/juggernaut-lightning-flux
export const IMAGE_GENERATION_PRICE_PER_MEGAPIXEL = 0.0017;
export const IMAGE_GENERATION_PRICING_BASE_STEPS = 4;

const IMAGE_STYLE_PROMPTS: Record<ImageStyleSlug, string> = {
  "pop-art":
    "Create an image in the bold and vibrant style of classic pop art, using bright primary colors, thick outlines, and a playful comic book flair. Incorporate stylized, mass-produced imagery or dotted shading for added impact.",
  minimal:
    "Generate a simple, clean composition with limited shapes and subtle color accents. Emphasize negative space and precise lines to achieve an elegant, understated look.",
  retro:
    "Design a vintage-inspired scene with nostalgic color palettes, distressed textures, and bold mid-century typography. Capture the essence of old posters, ads, or signs for an authentic throwback vibe.",
  watercolor:
    "Produce a delicate, painterly image emulating fluid watercolor strokes and soft gradients. Blend pastel hues and dreamy splashes to create a light, handcrafted feel.",
  fantasy:
    "Illustrate a whimsical realm filled with magical creatures, enchanted forests, and otherworldly elements. Use vibrant colors and ornate detailing to evoke a sense of wonder and adventure.",
  moody:
    "Craft an atmospheric scene defined by dramatic lighting, deep shadows, and rich textures. Evoke emotion with subdued color tones and an underlying sense of tension.",
  vibrant:
    "Generate an energetic, eye-popping design with bold, saturated hues and dynamic contrasts. Layer vivid gradients and striking shapes for a lively, high-impact result.",
  cinematic:
    "Compose a visually stunning frame reminiscent of a movie still, complete with dramatic lighting and evocative color grading. Convey a strong sense of story through expressive angles and rich detail.",
  cyberpunk:
    "Envision a futuristic, neon-lit cityscape infused with advanced technology and dystopian undertones. Layer towering skyscrapers, holographic signage, and edgy urban elements for a gritty, high-tech aesthetic.",
  surreal:
    "Construct a dreamlike world blending unexpected, fantastical elements in bizarre yet captivating ways. Use vivid colors and warped perspectives to create an otherworldly, mind-bending atmosphere.",
  "art-deco":
    "Design a scene characterized by bold geometric shapes, streamlined forms, and luxe metallic accents. Channel the sophistication of the 1920s and 1930s with glamorous patterns and elegant symmetry.",
  grafiti:
    "Produce an urban-inspired piece rich with spray paint textures, edgy lettering, and vibrant color bursts. Layer paint drips, splatters, and bold typography for a raw, street-art aesthetic.",
};

export type ImageGenerationInput = {
  prompt: string;
  iterativeMode: boolean;
  style?: ImageStyleSlug;
};

export function buildImageGenerationRequest(input: ImageGenerationInput) {
  const effectivePrompt = input.style
    ? `${input.prompt}. ${IMAGE_STYLE_PROMPTS[input.style]}`
    : input.prompt;

  return {
    effectivePrompt,
    model: IMAGE_GENERATION_MODEL,
    width: IMAGE_GENERATION_WIDTH,
    height: IMAGE_GENERATION_HEIGHT,
    steps: IMAGE_GENERATION_STEPS,
    seed: input.iterativeMode ? ITERATIVE_MODE_SEED : undefined,
  };
}

export function estimateImageGenerationCost({
  width,
  height,
  steps,
  imageCount,
}: {
  width: number;
  height: number;
  steps: number;
  imageCount: number;
}) {
  const billableMegapixels = (width * height * imageCount) / 1_000_000;
  const stepMultiplier =
    Math.max(steps, IMAGE_GENERATION_PRICING_BASE_STEPS) /
    IMAGE_GENERATION_PRICING_BASE_STEPS;

  return {
    billableMegapixels,
    estimatedCost: Number(
      (
        billableMegapixels *
        IMAGE_GENERATION_PRICE_PER_MEGAPIXEL *
        stepMultiplier
      ).toFixed(12),
    ),
    pricePerMegapixel: IMAGE_GENERATION_PRICE_PER_MEGAPIXEL,
    pricingBaseSteps: IMAGE_GENERATION_PRICING_BASE_STEPS,
    stepMultiplier,
  };
}

export const CONFIGURED_IMAGE_MODELS = [IMAGE_GENERATION_MODEL] as const;
