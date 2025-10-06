import {
  createSchema,
  type HydrogenComponentProps,
  useParentInstance,
  IMAGES_PLACEHOLDERS,
} from "@weaverse/hydrogen";
import type { ArticleFragment } from "storefront-api.generated";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import type { ArticlesLoaderData } from ".";
import { calculateAspectRatio } from "~/utils/image";
import type { ImageAspectRatio } from "~/types/image";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "~/utils/cn";

const variants = cva("", {
  variants: {
    gap: {
      8: "gap-2",
      12: "gap-3",
      16: "gap-4",
      20: "gap-5",
      24: "gap-6",
      28: "gap-7",
      32: "gap-8",
    },
  },
  defaultVariants: {
    gap: 16,
  },
});

interface ArticlesItemsProps
  extends HydrogenComponentProps,
    VariantProps<typeof variants> {
  ref?: React.Ref<HTMLDivElement>;
  imageAspectRatio: ImageAspectRatio;
  showAuthor: boolean;
  showDate: boolean;
  imageBorderRadius: number;
  itemSpacing: number;
  titleColor: string;
  metaColor: string;
}

function ArticlesItems(props: ArticlesItemsProps) {
  const {
    ref,
    gap,
    imageAspectRatio,
    showAuthor,
    showDate,
    imageBorderRadius,
    itemSpacing,
    titleColor,
    metaColor,
    ...rest
  } = props;

  const parent = useParentInstance();
  const data: ArticlesLoaderData = parent.data?.loaderData;

  if (!data?.articles?.length) {
    return (
      <div ref={ref} {...rest}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-5">
              <div className="w-full overflow-hidden bg-gray-100 rounded-lg">
                <Image
                  data={{ url: IMAGES_PLACEHOLDERS.image }}
                  aspectRatio="1/1"
                  sizes="(min-width: 768px) 25vw, 100vw"
                  loading="lazy"
                />
              </div>
              <div className="space-y-2.5">
                <h6
                  className="text-2xl leading-8 font-medium"
                  style={{ color: titleColor }}
                >
                  Title here
                </h6>
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: metaColor }}
                >
                  <span>Date here</span>
                  <span>—</span>
                  <span>Author here</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { articles, blogHandle } = data;

  return (
    <div ref={ref} {...rest}>
      <div className={cn("grid grid-cols-1 lg:grid-cols-4", variants({ gap }))}>
        {articles.map((article, i) => (
          <ArticleCard
            key={article.id}
            article={article}
            blogHandle={blogHandle}
            loading={i < 2 ? "eager" : "lazy"}
            imageAspectRatio={imageAspectRatio}
            showAuthor={showAuthor}
            showDate={showDate}
            imageBorderRadius={imageBorderRadius}
            itemSpacing={itemSpacing}
            titleColor={titleColor}
            metaColor={metaColor}
          />
        ))}
      </div>
    </div>
  );
}

function ArticleCard({
  article,
  blogHandle,
  loading,
  imageAspectRatio,
  showAuthor,
  showDate,
  imageBorderRadius,
  itemSpacing,
  titleColor,
  metaColor,
}: {
  article: ArticleFragment;
  blogHandle?: string;
  loading?: HTMLImageElement["loading"];
  imageAspectRatio: ImageAspectRatio;
  showAuthor: boolean;
  showDate: boolean;
  imageBorderRadius: number;
  itemSpacing: number;
  titleColor: string;
  metaColor: string;
}) {
  return (
    <div className="flex flex-col" style={{ gap: `${itemSpacing}px` }}>
      {article.image && (
        <Link
          to={blogHandle ? `/blogs/${blogHandle}/${article.handle}` : `#`}
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
      <div className="flex flex-col" style={{ gap: `${itemSpacing / 2}px` }}>
        <Link
          to={blogHandle ? `/blogs/${blogHandle}/${article.handle}` : `#`}
          className="inline-block"
        >
          <h6
            className="text-2xl leading-8 font-medium hover:underline line-clamp-2"
            style={{
              color: titleColor,
            }}
          >
            {article.title}
          </h6>
        </Link>
        {(showDate || showAuthor) && (
          <div
            className="flex items-center gap-1 text-sm"
            style={{ color: metaColor }}
          >
            {showDate && (
              <span className="text-sm">
                {new Date(article.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
            {showDate && showAuthor && <span className="text-sm">—</span>}
            {showAuthor && (
              <span className="text-sm">{article.author?.name}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArticlesItems;

export const schema = createSchema({
  type: "articles-items",
  title: "Articles items",
  settings: [
    {
      group: "Articles items",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Items gap",
          configs: {
            min: 8,
            max: 32,
            step: 4,
          },
          defaultValue: 16,
        },
      ],
    },
    {
      group: "Article card",
      inputs: [
        {
          type: "color",
          name: "titleColor",
          label: "Title color",
          defaultValue: "#3C3428",
        },
        {
          type: "color",
          name: "metaColor",
          label: "Meta color (date/author)",
          defaultValue: "#7B7165",
        },
        {
          type: "select",
          name: "imageAspectRatio",
          label: "Image aspect ratio",
          defaultValue: "1/1",
          configs: {
            options: [
              { value: "adapt", label: "Adapt to image" },
              { value: "1/1", label: "Square (1/1)" },
              { value: "3/4", label: "Square (3/4)" },
              { value: "16/9", label: "Square (16/9)" },
            ],
          },
          helpText:
            'Learn more about image <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio" target="_blank" rel="noopener noreferrer">aspect ratio</a> property.',
        },
        {
          type: "switch",
          name: "showAuthor",
          label: "Show author",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showDate",
          label: "Show date",
          defaultValue: true,
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
        {
          type: "range",
          name: "itemSpacing",
          label: "Item spacing",
          defaultValue: 20,
          configs: {
            min: 0,
            max: 40,
            step: 1,
            unit: "px",
          },
        },
      ],
    },
  ],
});
