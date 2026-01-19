import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const isStaging = process.env.NEXT_PUBLIC_IS_STAGING === "true";

  // Block all crawling on staging
  if (isStaging) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  // Webapp should never be indexed - it's all authenticated content
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
