# JF product media

JF-branded website assets are saved in `public/images/products/jf/`. All original photos remain unchanged. The existing branded camera photo is used as the shield/wordmark reference and also appears in the black four-lens camera gallery.

Fourteen raster edits were produced with the built-in imagegen tool and optimized to WebP. These are branding edits to supplied photos, not photographs of newly manufactured goods. Native SVG product illustrations were branded with `scripts/brand-vector-products.mjs`, which writes separate SVG copies in the same folder. Run that script after changing the original sample illustrations.

The two supplied videos show solar panels and a yellow hybrid inverter. Their original files are in `public/videos/` and play on the relevant product detail pages with no autoplay and no initial video download. Branding was applied to their still product images; the videos themselves are unchanged.

No lithium-battery photograph was included in this batch. Battery, kit, accessory and other sample-only listings are now hidden until real photos and verified product information are supplied. Sample records remain available in source as sampleProducts but are not displayed or prerendered.

## Image prompts

Reference for every edit: `WhatsApp Image 2026-09-27 at 7.45.12 AM.jpeg` (existing JF-branded camera).

New-photo prompt template: "Edit only target image 1. Image 2 is solely the JF branding reference. Preserve the exact product shape, all lenses, controls, colors, lighting, original scene and physical details. Add the same small JF shield logo and exact wordmark 'Jim-Frankell Ltd' found on the product in reference 2 [placement]. Make this look physically printed onto the surface with matching perspective, not a corner badge or floating watermark. No new claims or features, no other changes. Return edited image 1 only."

Placements: panel — silver top frame, dark red ink, no photovoltaic cells covered; round spy camera — blank top-center white housing, dark red ink; clock spy camera — black top surface right of the buttons, white ink, not the display; four-lens camera — blank central cylindrical band, white ink; yellow inverter — blank housing below HYBRID, dark red ink, rotate the full photo 180 degrees upright.

Silver camera prompt: "Edit target image 1 only, preserve the exact product geometry, all camera lenses, colors, lighting, composition and background. Add the same small JF shield logo and exact wordmark 'Jim-Frankell Ltd' from reference image 2 to the blank left metallic front housing of the product in image 1, physically printed onto its surface with matching perspective and realistic subtle white ink. Do not overlay a UI badge or watermark. Do not change any other aspect. Return the edited first image only. Save project asset."

Existing camera prompt template: "Edit target image 1 only. Image 2 is a logo reference. Preserve exact product geometry, all lenses and lights and buttons, pose, colors, and original background. Add the small JF shield and exact wordmark 'Jim-Frankell Ltd' from image 2 [placement], naturally printed onto product surface with correct perspective. No floating watermark or badge. No other changes. Return only edited first image."

Placements: floodlight cutout — black housing between light panel and camera assembly, white ink, preserve alpha; white triple camera — blank white housing above lenses, dark red ink; 4G dual camera — white side housing above 4G, dark red ink; floodlight array and silver multi camera — left silver arm, dark red ink; black multi camera — cylindrical band, white ink; white dual camera — crown above lens, dark red ink; 4G solar camera — upper housing between antennas, dark red ink.

## Background cutouts

Seven supplied photographs were edited using the built-in imagegen tool. Website-ready files use the `-cutout.webp` suffix in `public/images/products/jf/`. Prompt: accurately isolate the complete actual product on a transparent background, preserve JF branding and product details, remove packaging, hands, straps and background objects, center upright with 3% margin. For the panel isolate the foremost panel; for the round spy camera keep the actual device, not the printed packaging; for the clock remove the explanatory lens/beam. A refinement pass on the panel and inverter requested smooth edges and removal of stray pixels without changing the product. Originals are preserved.
