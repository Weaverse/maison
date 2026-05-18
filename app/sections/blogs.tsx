import { createSchema } from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import { useState } from "react";
import { useLoaderData } from "react-router";
import type { ArticleFragment, BlogQuery } from "storefront-api.generated";
import { Button } from "~/components/button";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { layoutInputs, Section, type SectionProps } from "~/components/section";
import type { ImageAspectRatio } from "~/types/image";
import { cn } from "~/utils/cn";
import { calculateAspectRatio, getImageLoadingPriority } from "~/utils/image";

const variants = cva("grid gap-x-4 gap-y-10", {
  variants: {
    mobileGridSize: {
      "1": "grid-cols-1",
      "2": "grid-cols-2",
      "3": "grid-cols-3",
    },
    desktopGridSize: {
      "3": "md:grid-cols-3",
      "4": "md:grid-cols-4",
      "5": "md:grid-cols-5",
      "6": "md:grid-cols-6",
    },
  },
  defaultVariants: {
    mobileGridSize: "2",
    desktopGridSize: "4",
  },
});

interface BlogsData {
  layout: "blog" | "default";
  cardGap: number;
  imageBorderRadius: number;
  showLoadMore: boolean;
  loadMoreText: string;
  initialArticlesToShow: number;
  loadMoreCount: number;
}

interface BlogsProps
  extends Omit<ArticleCardProps, "article" | "blogHandle" | "loading">,
    SectionProps,
    VariantProps<typeof variants>,
    BlogsData {
  ref: React.Ref<HTMLElement>;
}

export default function Blogs(props: BlogsProps) {
  const {
    ref,
    layout,
    showExcerpt,
    showAuthor,
    showDate,
    showReadmore,
    imageAspectRatio,
    cardGap,
    mobileGridSize,
    desktopGridSize,
    imageBorderRadius,
    showLoadMore,
    loadMoreText,
    initialArticlesToShow,
    loadMoreCount,
    ...rest
  } = props;

  const { blog, articles } = useLoaderData<
    BlogQuery & { articles: ArticleFragment[] }
  >();

  const [visibleCount, setVisibleCount] = useState(initialArticlesToShow);
  const visibleArticles = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;

  const handleLoadMore = () => {
    setVisibleCount((v) => v + loadMoreCount);
  };

  if (blog) {
    return (
      <Section ref={ref} {...rest}>
        <div className={cn(variants({ mobileGridSize, desktopGridSize }))}>
          {visibleArticles.map((article, i) => (
            <ArticleCard
              key={article.id}
              blogHandle={blog.handle}
              article={article}
              loading={getImageLoadingPriority(i, 2)}
              showAuthor={showAuthor}
              showExcerpt={showExcerpt}
              showDate={showDate}
              showReadmore={showReadmore}
              imageAspectRatio={imageAspectRatio}
              imageBorderRadius={imageBorderRadius}
              cardGap={cardGap}
            />
          ))}
        </div>

        {showLoadMore && hasMore && (
          <div className="flex justify-center mt-10">
            <Button type="button" onClick={handleLoadMore}>
              {loadMoreText}
            </Button>
          </div>
        )}
      </Section>
    );
  }
  return <Section ref={ref} {...rest} />;
}

export interface ArticleCardProps {
  article: ArticleFragment;
  blogHandle: string;
  loading?: HTMLImageElement["loading"];
  showDate: boolean;
  showExcerpt: boolean;
  showAuthor: boolean;
  showReadmore: boolean;
  imageAspectRatio: ImageAspectRatio;
  imageBorderRadius: number;
  cardGap: number;
  className?: string;
}

export function ArticleCard({
  blogHandle,
  article,
  loading,
  showExcerpt,
  showAuthor,
  showDate,
  showReadmore,
  imageAspectRatio,
  imageBorderRadius,
  cardGap,
  className,
}: ArticleCardProps) {
  return (
    <div
      className={cn("flex flex-col", className)}
      style={{ gap: `${cardGap}px` }}
    >
      {article.image && (
        <Link
          to={`/blogs/${blogHandle}/${article.handle}`}
          className="flex flex-col"
        >
          <Image
            alt={article.image.altText || article.title}
            data={article.image}
            aspectRatio={calculateAspectRatio(article.image, imageAspectRatio)}
            loading={loading}
            sizes="(min-width: 768px) 50vw, 100vw"
            style={{ borderRadius: `${imageBorderRadius}px` }}
          />
        </Link>
      )}
      <Link
        to={`/blogs/${blogHandle}/${article.handle}`}
        className="inline-block"
      >
        <h6 className="text-2xl leading-8 font-normal hover:underline line-clamp-5 lg:line-clamp-2">
          {article.title}
        </h6>
      </Link>
      {(showDate || showAuthor) && (
        <div className="flex flex-wrap text-sm gap-1 text-body-subtle">
          {showDate && (
            <span>
              {new Date(article.publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {showAuthor && " —"}
            </span>
          )}
          {showAuthor && <span>{article.author?.name}</span>}
        </div>
      )}
      {showExcerpt && (
        <div className="line-clamp-2 lg:line-clamp-4 text-body-subtle">
          {article.excerpt}
        </div>
      )}
      {showReadmore && (
        <div>
          <Link
            to={`/blogs/${blogHandle}/${article.handle}`}
            variant="underline"
          >
            Read more →
          </Link>
        </div>
      )}
    </div>
  );
}

export const schema = createSchema({
  type: "blogs",
  title: "Blogs",
  limit: 1,
  enabledOn: {
    pages: ["BLOG"],
  },
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter(
        (i) => i.name !== "gap" && i.name !== "borderRadius",
      ),
    },
    {
      group: "Article item",
      inputs: [
        {
          type: "range",
          name: "cardGap",
          label: "Card content gap",
          configs: {
            min: 0,
            max: 40,
            step: 4,
            unit: "px",
          },
          defaultValue: 16,
        },
        {
          type: "toggle-group",
          name: "mobileGridSize",
          label: "Items per row (mobile)",
          defaultValue: "2",
          configs: {
            options: [
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
            ],
          },
        },
        {
          type: "toggle-group",
          name: "desktopGridSize",
          label: "Items per row (desktop)",
          defaultValue: "4",
          configs: {
            options: [
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5" },
              { value: "6", label: "6" },
            ],
          },
        },
        {
          type: "switch",
          name: "showLoadMore",
          label: "Show 'Load more' button",
          defaultValue: true,
        },
        {
          type: "text",
          name: "loadMoreText",
          label: "Load more button text",
          defaultValue: "LOAD MORE",
        },
        {
          type: "range",
          name: "initialArticlesToShow",
          label: "Initial articles to show",
          configs: {
            min: 1,
            max: 20,
            step: 1,
          },
          defaultValue: 12,
        },
        {
          type: "range",
          name: "loadMoreCount",
          label: "Load more count",
          configs: {
            min: 1,
            max: 20,
            step: 1,
          },
          defaultValue: 8,
        },
      ],
    },
    {
      group: "Article card",
      inputs: [
        {
          type: "select",
          name: "imageAspectRatio",
          label: "Image aspect ratio",
          defaultValue: "1/1",
          configs: {
            options: [
              { value: "adapt", label: "Adapt to image" },
              { value: "1/1", label: "Square (1/1)" },
              { value: "3/4", label: "Portrait (3/4)" },
              { value: "4/3", label: "Landscape (4/3)" },
              { value: "16/9", label: "Widescreen (16/9)" },
            ],
          },
          helpText:
            'Learn more about image <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio" target="_blank" rel="noopener noreferrer">aspect ratio</a> property.',
        },
        {
          type: "switch",
          name: "showExcerpt",
          label: "Show excerpt",
          defaultValue: false,
        },
        {
          type: "switch",
          name: "showDate",
          label: "Show date",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showAuthor",
          label: "Show author name",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showReadmore",
          label: "Show 'Read more' link",
          defaultValue: false,
        },
        {
          type: "range",
          name: "imageBorderRadius",
          label: "Image border radius",
          defaultValue: 4,
          configs: {
            min: 0,
            max: 50,
            step: 1,
            unit: "px",
          },
        },
      ],
    },
  ],
});
