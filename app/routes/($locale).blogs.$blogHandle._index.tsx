import type { SeoConfig } from "@shopify/hydrogen";
import { flattenConnection, getSeoMeta } from "@shopify/hydrogen";
import type { MetaFunction } from "react-router";
import { data, type LoaderFunctionArgs } from "react-router";
import type { BlogQuery } from "storefront-api.generated";
import invariant from "tiny-invariant";
import { routeHeaders } from "~/utils/cache";
import { PAGINATION_SIZE } from "~/utils/const";
import { redirectIfHandleIsLocalized } from "~/utils/redirect";
import { seoPayload } from "~/utils/seo.server";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;

export const loader = async (args: LoaderFunctionArgs) => {
  const { params, request, context } = args;
  const storefront = context.storefront;
  const { language } = storefront.i18n;

  invariant(params.blogHandle, "Missing blog handle");

  // Load blog data and weaverseData in parallel
  const [{ blog }, weaverseData] = await Promise.all([
    storefront.query<BlogQuery>(BLOGS_QUERY, {
      variables: {
        blogHandle: params.blogHandle,
        pageBy: PAGINATION_SIZE,
      },
    }),
    context.weaverse.loadPage({
      type: "BLOG",
      handle: params.blogHandle,
    }),
  ]);

  if (!blog?.articles) {
    throw new Response("Not found", { status: 404 });
  }
  redirectIfHandleIsLocalized(request, {
    handle: params.blogHandle,
    data: blog,
  });

  // `publishedAt` stays the raw timestamp. `ArticleCard` formats it at render,
  // and the article route hands it the same shape, so both callers agree.
  const articles = flattenConnection(blog.articles);

  const seo = seoPayload.blog({ blog, url: request.url });

  return data({
    blog,
    articles,
    seo,
    weaverseData,
  });
};

export const meta: MetaFunction<typeof loader> = ({ data: loaderData }) => {
  return getSeoMeta(loaderData?.seo as SeoConfig);
};

export default function Blogs() {
  return <WeaverseContent />;
}

const BLOGS_QUERY = `#graphql
  query blog(
    $country: CountryCode
    $language: LanguageCode
    $blogHandle: String!
    $pageBy: Int!
    $cursor: String
  ) @inContext(country: $country, language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      seo {
        title
        description
      }
      articles(first: $pageBy, after: $cursor) {
        edges {
          node {
            ...Article
          }
        }
      }
    }
  }

  fragment Article on Article {
    author: authorV2 {
      name
    }
    contentHtml
    excerpt
    excerptHtml
    handle
    id
    image {
      id
      altText
      url
      width
      height
    }
    publishedAt
    title
  }
` as const;
