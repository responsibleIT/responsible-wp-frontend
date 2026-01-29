// lib/filters/sanitize.js
import * as cheerio from "cheerio";


/**
 * Sanitize wordpress input and return cleaned html
 * @param {any} html
 * @returns {any}
 */
const sanitize = (html) => {
  if (!html || typeof html !== "string") return html;

  try {
    const $ = cheerio.load(html, null, false);

    $("*").each(function () {
      const $el = $(this);
      const children = $el.contents();

      children.each(function () {
        if (this.type === "text") {
          const text = $(this).text();
          const cleaned = text.replace(/\s+/g, " ").trim();
          if (cleaned) {
            $(this).replaceWith(cleaned);
          } else {
            $(this).remove();
          }
        }
      });
    });

    return $.html().trim();
  } catch (error) {
    return html
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

export default sanitize;