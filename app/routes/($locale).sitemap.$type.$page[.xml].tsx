import { getSitemap } from "@shopify/hydrogen";
import type { LoaderFunctionArgs } from "react-router";
import { DEFAULT_LOCALE } from "~/utils/const";
import { intlLocale } from "~/utils/locale";

// Match Shopify's own sitemap pagination so the page numbers in the index
// (`sitemap/articles/1.xml`, `.../2.xml`, …) keep meaning the same thing.
const ARTICLES_PER_SITEMAP_PAGE = 250;

const BLOGS_QUERY = `#graphql
  query SitemapBlogs($first: Int!, $after: String) {
    blogs(first: $first, after: $after) {
      nodes {
        handle
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
` as const;

const BLOG_ARTICLES_QUERY = `#graphql
  query SitemapBlogArticles(
    $blogHandle: String!
    $first: Int!
    $after: String
  ) {
    blog(handle: $blogHandle) {
      articles(
        first: $first
        after: $after
        sortKey: PUBLISHED_AT
        reverse: true
      ) {
        nodes {
          handle
          publishedAt
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
` as const;

type ArticleSitemapNode = {
  handle: string;
  publishedAt: string;
  blogHandle: string;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Hydrogen's `getSitemap` links articles as `/articles/<handle>`, but this
 * theme serves them at `/blogs/<blogHandle>/<articleHandle>`, so every
 * built-in article URL 404s. Its sitemap query returns only the article
 * handle — never the parent blog — so articles need their own query and
 * renderer.
 */
async function articlesSitemap({
  request,
  params,
  storefront,
}: {
  request: Request;
  params: LoaderFunctionArgs["params"];
  storefront: LoaderFunctionArgs["context"]["storefront"];
}) {
  const page = Number(params.page);
  if (!Number.isInteger(page) || page < 1) {
    throw new Response("Not found", { status: 404 });
  }

  const baseUrl = new URL(request.url).origin;
  const endIndex = page * ARTICLES_PER_SITEMAP_PAGE;
  const nodes: ArticleSitemapNode[] = [];
  const blogHandles: string[] = [];
  let blogsAfter: string | null = null;

  // The Storefront API has no root `articles` connection. Collect the blog
  // handles first, then page through each blog's articles, so every URL is
  // built with the parent blog it is actually served under.
  while (true) {
    const data: {
      blogs: {
        nodes: Array<{ handle: string }>;
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    } = await storefront.query(BLOGS_QUERY, {
      variables: { first: 250, after: blogsAfter },
    });
    blogHandles.push(...data.blogs.nodes.map((blog) => blog.handle));
    if (!data.blogs.pageInfo.hasNextPage) {
      break;
    }
    blogsAfter = data.blogs.pageInfo.endCursor;
  }

  for (const blogHandle of blogHandles) {
    let articlesAfter: string | null = null;
    while (nodes.length < endIndex) {
      const data: {
        blog: {
          articles: {
            nodes: Array<{ handle: string; publishedAt: string }>;
            pageInfo: { hasNextPage: boolean; endCursor: string | null };
          };
        } | null;
      } = await storefront.query(BLOG_ARTICLES_QUERY, {
        variables: {
          blogHandle,
          first: ARTICLES_PER_SITEMAP_PAGE,
          after: articlesAfter,
        },
      });
      if (!data.blog) {
        break;
      }
      nodes.push(
        ...data.blog.articles.nodes.map((article) => ({
          ...article,
          blogHandle,
        })),
      );
      if (!data.blog.articles.pageInfo.hasNextPage) {
        break;
      }
      articlesAfter = data.blog.articles.pageInfo.endCursor;
    }
    if (nodes.length >= endIndex) {
      break;
    }
  }

  const pageNodes = nodes.slice(endIndex - ARTICLES_PER_SITEMAP_PAGE, endIndex);
  if (pageNodes.length === 0) {
    throw new Response("Not found", { status: 404 });
  }

  const urls = pageNodes
    .filter((node) => node.handle && node.blogHandle)
    .map((node) => {
      const loc = escapeXml(
        `${baseUrl}/blogs/${node.blogHandle}/${node.handle}`,
      );
      // No `xhtml:link` alternates here: an article handle is localized per
      // market and an article may be unpublished in one, so pasting a prefix
      // onto this handle would advertise a URL that redirects or 404s.
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${escapeXml(node.publishedAt)}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": `max-age=${60 * 60 * 24}`,
    },
  });
}

export async function loader({
  request,
  params,
  context: { storefront },
}: LoaderFunctionArgs) {
  if (params.type === "articles") {
    return articlesSitemap({ request, params, storefront });
  }

  const response = await getSitemap({
    storefront,
    request,
    params,
    // Only the default market is listed. Handing `getSitemap` every locale
    // makes it build `hreflang` alternates by pasting a prefix onto one
    // handle, but a handle belongs to a market: Shopify localizes it, and a
    // resource can be unpublished in one market and not another. Those
    // alternates would then redirect or 404. Missing an alternate only costs
    // discovery in that market; a wrong one tells search engines a page is
    // there when it is not.
    locales: [intlLocale(DEFAULT_LOCALE)],
    getLink: ({ type, baseUrl, handle }) => `${baseUrl}/${type}/${handle}`,
  });

  response.headers.set("Cache-Control", `max-age=${60 * 60 * 24}`);

  return response;
}
