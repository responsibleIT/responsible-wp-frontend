// Central config + helper to skip specific items
// from collection endpoints like 'pages', 'posts', etc.
//
// Extend this object when you need more SSR-only items.
const skipConfig = {
  pages: {
    // Skip by slug for the 'pages' endpoint
    slugs: ["projecten"],
    ids: []
  }
  // Example for posts in the future:
  // posts: {
  //   slugs: ["some-post-slug"],
  //   ids: [123]
  // }
};

const specifiedSkip = (endpoint, items) => {
  const config = skipConfig[endpoint];
  if (!config || !Array.isArray(items)) return items;

  let filtered = items;

  if (config.slugs && config.slugs.length > 0) {
    filtered = filtered.filter((item) => !config.slugs.includes(item.slug));
  }

  if (config.ids && config.ids.length > 0) {
    filtered = filtered.filter((item) => !config.ids.includes(item.id));
  }

  return filtered;
};

export default specifiedSkip;