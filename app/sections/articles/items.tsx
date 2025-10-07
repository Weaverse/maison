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

const variants = cva("grid", {
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
    mobileGridSize: "2",
    desktopGridSize: "4",
    gap: 16,
  },
});

interface ArticlesItemsProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  imageAspectRatio: ImageAspectRatio;
  showAuthor: boolean;
  showDate: boolean;
  imageBorderRadius: number;
  titleColor: string;
  metaColor: string;
  gap: number;
  mobileGridSize: "1" | "2" | "3";
  desktopGridSize: "3" | "4" | "5" | "6";
}

function ArticlesItems(props: ArticlesItemsProps) {
  const {
    ref,
    gap,
    imageAspectRatio,
    showAuthor,
    showDate,
    imageBorderRadius,
    titleColor,
    metaColor,
    mobileGridSize,
    desktopGridSize,
    ...rest
  } = props;

  const parent = useParentInstance();
  const data: ArticlesLoaderData = parent.data?.loaderData;
  const itemsToShow = Number(parent.data?.data?.articlesToShow ?? 4);

  if (!data?.articles?.length) {
    return (
      <div ref={ref} {...rest}>
        <div
          className={cn(
            variants({
              mobileGridSize,
              desktopGridSize,
              gap,
            }),
          )}
        >
          {Array.from({ length: itemsToShow }).map((_, i) => (
            <div key={i} className="flex flex-col gap-5">
              <div className="w-full overflow-hidden bg-gray-100 rounded-lg">
                <Image
                  data={{ url: IMAGES_PLACEHOLDERS.image }}
                  aspectRatio="1/1"
                  sizes="auto"
                />
              </div>
              <div className="flex flex-col gap-4">
                <h6
                  className="text-2xl leading-8 font-normal"
                  style={{ color: titleColor }}
                >
                  Title here
                </h6>
                <div
                  className="flex flex-col sm:flex-row sm:items-center gap-1 text-sm"
                  style={{ color: metaColor }}
                >
                  <span className="text-sm">Date here —</span>
                  <span className="text-sm">Author here</span>
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
      <div
        className={cn(
          variants({
            mobileGridSize,
            desktopGridSize,
            gap,
          }),
        )}
      >
        {articles.slice(0, itemsToShow).map((article, i) => (
          <ArticleCard
            key={article.id}
            article={article}
            blogHandle={blogHandle}
            imageAspectRatio={imageAspectRatio}
            showAuthor={showAuthor}
            showDate={showDate}
            imageBorderRadius={imageBorderRadius}
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
  imageAspectRatio,
  showAuthor,
  showDate,
  imageBorderRadius,
  titleColor,
  metaColor,
}: {
  article: ArticleFragment;
  blogHandle?: string;
  imageAspectRatio: ImageAspectRatio;
  showAuthor: boolean;
  showDate: boolean;
  imageBorderRadius: number;
  titleColor: string;
  metaColor: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      {article.image && (
        <Link
          to={blogHandle ? `/blogs/${blogHandle}/${article.handle}` : `#`}
          className="flex flex-col"
        >
          <Image
            alt={article.image.altText || article.title}
            data={article.image}
            aspectRatio={calculateAspectRatio(article.image, imageAspectRatio)}
            sizes="auto"
            style={{ borderRadius: `${imageBorderRadius}px` }}
          />
        </Link>
      )}
      <div className="flex flex-col gap-4">
        <Link
          to={blogHandle ? `/blogs/${blogHandle}/${article.handle}` : `#`}
          className="inline-block"
        >
          <h6
            className="text-2xl leading-8 font-normal hover:underline sm:line-clamp-2"
            style={{
              color: titleColor,
            }}
          >
            {article.title}
          </h6>
        </Link>
        {(showDate || showAuthor) && (
          <div
            className="flex flex-col sm:flex-row sm:items-center gap-1 text-sm"
            style={{ color: metaColor }}
          >
            {showDate && (
              <span className="text-sm">
                {new Date(article.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {showAuthor && " —"}
              </span>
            )}
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
      group: "Layout",
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
        {
          type: "toggle-group",
          name: "mobileGridSize",
          label: "Mobile grid layout",
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
          label: "Desktop grid layout",
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
      ],
    },
    {
      group: "Article card",
      inputs: [
        {
          type: "color",
          name: "titleColor",
          label: "Title color",
        },
        {
          type: "color",
          name: "metaColor",
          label: "Meta color (date/author)",
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
      ],
    },
  ],
  presets: {
    gap: 16,
    mobileGridSize: "2",
    desktopGridSize: "4",
    imageAspectRatio: "1/1",
    showAuthor: true,
    showDate: true,
    imageBorderRadius: 4,
    titleColor: "#000000",
    metaColor: "#666666",
  },
});
