import * as cheerio from "cheerio";

/**
 * Sanitize wordpress input and return cleaned html with URL replacements
 * @param {any} html
 * @returns {any}
 */
const sanitize = (html) => {
  if (!html || typeof html !== "string") return html;

  try {
    const $ = cheerio.load(html, null, false);

    // Clean up whitespace in text nodes
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

    // Clean WordPress URLs in links (convert to relative paths)
    $('a[href]').each(function() {
      const $link = $(this);
      const href = $link.attr('href');
      
      if (href && href.includes(process.env.WP_SITE_URL?.replace(/https?:\/\//, '') || 'wordpress.responsible-it.nl')) {
        // Extract just the path part: https://wordpress.site.com/page → /page
        const url = new URL(href);
        $link.attr('href', url.pathname);
      }
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