import type { ActionFunction, LoaderFunction } from "react-router";
import { data } from "react-router";
import type {
  JudgeMeReviewType,
  JudgemeProduct,
  JudgemeStarsRatingData,
  JudgemeWidgetData,
} from "~/types/judgeme";
import { parseBadgeHtml, parseJudgemeWidgetHTML } from "~/utils/judgeme";
import { constructURL, formDataToObject } from "~/utils/misc";

const JUDGEME_PRODUCT_API = "https://judge.me/api/v1/products/-1";
const JUDGEME_BADGE_API = "https://api.judge.me/api/v1/widgets/preview_badge";
const JUDGEME_WIDGET_API = "https://api.judge.me/api/v1/widgets/product_review";
const JUDGEME_REVIEWS_API = "https://api.judge.me/api/v1/reviews";
const GENERIC_ERROR = "Reviews are unavailable.";

const EMPTY_RATING: JudgemeStarsRatingData = {
  totalReviews: 0,
  averageRating: 0,
  badge: "",
};

const EMPTY_REVIEWS = {
  reviews: [] as JudgeMeReviewType[],
  totalPage: 0,
  currentPage: 1,
  perPage: 5,
  averageRating: 0,
  totalReviews: 0,
  ratingDistribution: [],
};

function isJudgemeConfigured(env: Env) {
  return Boolean(env.JUDGEME_PRIVATE_API_TOKEN && env.PUBLIC_STORE_DOMAIN);
}

/**
 * Judge.me reviews API.
 *
 * GET  `/api/product/{handle}/reviews` — review list + summary
 * GET  `/api/product/{handle}/reviews?type=rating` — star rating badge
 * POST `/api/product/{handle}/reviews` — submit a review
 *
 * The private API token stays on the server. Missing/invalid config returns
 * empty data so product pages keep rendering.
 */
export const loader: LoaderFunction = async ({ request, context, params }) => {
  try {
    const { weaverse, env } = context;
    const { fetchWithCache } = weaverse;
    const { searchParams } = new URL(request.url);
    const { productHandle } = params;
    const type = searchParams.get("type");

    if (!productHandle || !isJudgemeConfigured(env)) {
      return data(type === "rating" ? EMPTY_RATING : EMPTY_REVIEWS);
    }

    const { JUDGEME_PRIVATE_API_TOKEN, PUBLIC_STORE_DOMAIN } = env;

    if (type === "rating") {
      const badgeResponse = await fetchWithCache<{
        product_external_id: number;
        badge: string;
      }>(
        constructURL(JUDGEME_BADGE_API, {
          api_token: JUDGEME_PRIVATE_API_TOKEN,
          shop_domain: PUBLIC_STORE_DOMAIN,
          handle: productHandle,
        }),
      );

      if (!badgeResponse?.badge) {
        return data(EMPTY_RATING);
      }
      return data(parseBadgeHtml(badgeResponse.badge));
    }

    const judgemeProductRes = await fetchWithCache<{
      product: JudgemeProduct;
    }>(
      constructURL(JUDGEME_PRODUCT_API, {
        handle: productHandle,
        shop_domain: PUBLIC_STORE_DOMAIN,
        api_token: JUDGEME_PRIVATE_API_TOKEN,
      }),
    );
    if (!judgemeProductRes?.product?.id) {
      return data(EMPTY_REVIEWS);
    }

    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const perPage = Number.parseInt(searchParams.get("per_page") || "5", 10);

    let reviewSummary: JudgemeWidgetData | null = null;
    let totalPage = 0;
    const widgetResponse = await fetchWithCache<{
      product_external_id: number;
      widget: string;
    }>(
      constructURL(JUDGEME_WIDGET_API, {
        api_token: JUDGEME_PRIVATE_API_TOKEN,
        shop_domain: PUBLIC_STORE_DOMAIN,
        handle: productHandle,
        per_page: perPage,
        page,
      }),
    );

    if (widgetResponse?.widget) {
      reviewSummary = parseJudgemeWidgetHTML(widgetResponse.widget);
      totalPage = Math.ceil(
        reviewSummary.totalReviews / (perPage > 0 ? perPage : 5),
      );
    }

    const reviewsData = await fetchWithCache<{
      reviews: JudgeMeReviewType[];
      current_page: number;
      per_page: number;
    }>(
      constructURL(JUDGEME_REVIEWS_API, {
        api_token: JUDGEME_PRIVATE_API_TOKEN,
        shop_domain: PUBLIC_STORE_DOMAIN,
        product_id: judgemeProductRes.product.id,
        per_page: perPage,
        page,
      }),
    );

    return data({
      reviews: reviewsData?.reviews || [],
      totalPage,
      currentPage: reviewsData?.current_page || 1,
      perPage: reviewsData?.per_page || perPage || 5,
      ...reviewSummary,
    });
  } catch (err) {
    console.error("[Error in reviews API loader]", err);
    const type = new URL(request.url).searchParams.get("type");
    return data(type === "rating" ? EMPTY_RATING : EMPTY_REVIEWS);
  }
};

export const action: ActionFunction = async ({ request, context, params }) => {
  try {
    const { env } = context;
    const { productHandle } = params;

    if (!productHandle || !isJudgemeConfigured(env)) {
      console.error("Judge.me review submit unavailable: token is not set");
      return data({ review: null, error: GENERIC_ERROR }, { status: 503 });
    }

    const { JUDGEME_PRIVATE_API_TOKEN, PUBLIC_STORE_DOMAIN } = env;
    const formData = await request.formData();
    const response = await fetch(
      constructURL(JUDGEME_REVIEWS_API, {
        api_token: JUDGEME_PRIVATE_API_TOKEN,
        shop_domain: PUBLIC_STORE_DOMAIN,
      }),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_domain: PUBLIC_STORE_DOMAIN,
          platform: "shopify",
          ...formDataToObject(formData),
        }),
      },
    );

    if (!response.ok) {
      console.error(
        `[Error in reviews API action] Judge.me responded ${response.status}`,
      );
      await response.body?.cancel();
      return data({ review: null, error: GENERIC_ERROR }, { status: 502 });
    }

    const payload = await response.json<JudgeMeReviewType>();
    return data({ review: payload }, { status: 201 });
  } catch (err) {
    console.error("[Error in reviews API action]", err);
    return data({ review: null, error: GENERIC_ERROR }, { status: 500 });
  }
};
