import Image from "@11ty/eleventy-img";
import { join } from "path";
import { rm } from "fs/promises";
import { existsSync } from "fs";
import * as cheerio from "cheerio";

export default function (eleventyConfig) {
  // Copy everything from public/ to /
  eleventyConfig.addPassthroughCopy({ "public/": "/" });

  // Remove project-visuals/ after build
  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    const projectVisualsPath = join(
      dir.output,
      "assets",
      "img",
    );

    if (existsSync(projectVisualsPath)) {
      await rm(projectVisualsPath, { recursive: true, force: true });
      console.log("Removed:", projectVisualsPath);
    }
  });

  // HTML sanitization filter - removes newlines and normalizes whitespace
  eleventyConfig.addLiquidFilter("sanitize", function(html) {
    if (!html || typeof html !== 'string') return html;
    
    try {
      const $ = cheerio.load(html, null, false);
      
      // Remove empty text nodes and normalize whitespace
      $('*').each(function() {
        const $el = $(this);
        const children = $el.contents();
        
        children.each(function() {
          if (this.type === 'text') {
            const text = $(this).text();
            // Replace multiple whitespace/newlines with single space, trim
            const cleaned = text.replace(/\s+/g, ' ').trim();
            if (cleaned) {
              $(this).replaceWith(cleaned);
            } else {
              $(this).remove();
            }
          }
        });
      });
      
      // Get cleaned HTML and remove leading/trailing whitespace
      return $.html().trim();
    } catch (error) {
      // If parsing fails, just clean up newlines and extra whitespace
      return html
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  });

  // Image generation shortcode
  eleventyConfig.addLiquidShortcode(
    "image",
    async function (src, alt = "", sizes, loading = "lazy") {
      try {
        let metadata = await Image(src, {
          widths: [300, 600, 1200, 1600],
          formats: ["avif", "webp", "jpeg"],
          outputDir: "./dist/assets/img/",
          urlPath: "/assets/img/",
          transformOnRequest: false, // Disable image transformation
        });

        let imageAttributes = {
          alt,
          sizes: sizes || "(max-width: 768px) 100vw, 50vw",
          loading,
          decoding: "async",
        };
        // console.log(metadata, "created metadata");

        return Image.generateHTML(metadata, imageAttributes);
      } catch (error) {
        // handle missing images (empty image)
        // console.error(`Error processing image ${src}:`, error);
        return `<picture><img src="" alt="${alt ? alt : "Image not found"}" /></picture>`;
      }
    }
  );

  return {
    dir: {
      input: "views",
      includes: "partials",
      layouts: "layouts",
      data: "../_data", // <-- Go up one level from 'views' to reach root/_data
      output: "dist",
    },
    templateFormats: ["liquid", "md", "html"],
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    passthroughFileCopy: true,
  };
}
