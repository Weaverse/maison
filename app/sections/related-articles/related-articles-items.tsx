import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
} from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import { useLoaderData } from "react-router";
import type { ArticleFragment } from "storefront-api.generated";
import { Image } from "~/components/image";
import { useAnimation } from "~/hooks/use-animation";
import { ArticleCard } from "~/sections/blogs";
import type { ImageAspectRatio } from "~/types/image";
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
  },
  defaultVariants: {
    mobileGridSize: "2",
    desktopGridSize: "4",
  },
});

interface RelatedArticlesItemsData {
  gap?: number;
  imageAspectRatio: ImageAspectRatio;
  showAuthor: boolean;
  showDate: boolean;
  showExcerpt: boolean;
  showReadmore: boolean;
  imageBorderRadius: number;
  articlesToShow: number;
}

interface RelatedArticlesItemsProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps,
    RelatedArticlesItemsData {
  ref?: React.Ref<HTMLDivElement>;
}

function RelatedArticlesItems(props: RelatedArticlesItemsProps) {
  const {
    ref,
    gap,
    imageAspectRatio,
    showAuthor,
    showDate,
    showExcerpt,
    showReadmore,
    imageBorderRadius,
    mobileGridSize,
    desktopGridSize,
    articlesToShow,
    ...rest
  } = props;

  const [scope] = useAnimation(ref);

  const { blog, relatedArticles } = useLoaderData<{
    relatedArticles: ArticleFragment[];
    blog: { handle: string };
  }>();

  if (!relatedArticles?.length) {
    return (
      <div
        ref={scope}
        {...rest}
        className={cn(variants({ mobileGridSize, desktopGridSize }))}
        style={{ gap: `${gap}px` }}
      >
        {Array.from({ length: articlesToShow }).map((_, i) => (
          <div key={i} className="flex flex-col gap-5">
            <div className="w-full overflow-hidden bg-gray-100 rounded-lg">
              <Image
                data={{ url: IMAGES_PLACEHOLDERS.image }}
                aspectRatio="1/1"
                sizes="auto"
              />
            </div>
            <div className="flex flex-col gap-4">
              <h6 className="text-2xl leading-8 font-normal">Title here</h6>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-sm text-body-subtle">
                <span className="text-sm">Date here —</span>
                <span className="text-sm">Author here</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={scope}
      {...rest}
      className={cn(variants({ mobileGridSize, desktopGridSize }))}
      style={{ gap: `${gap}px` }}
    >
      {relatedArticles.slice(0, articlesToShow).map((article) => (
        <ArticleCard
          key={article.id}
          blogHandle={blog.handle}
          article={article}
          showExcerpt={showExcerpt}
          showAuthor={showAuthor}
          showDate={showDate}
          showReadmore={showReadmore}
          imageAspectRatio={imageAspectRatio}
          imageBorderRadius={imageBorderRadius}
          cardGap={16}
        />
      ))}
    </div>
  );
}

export default RelatedArticlesItems;

export const schema = createSchema({
  type: "related-articles--items",
  title: "Related articles items",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Items gap",
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
      ],
    },
    {
      group: "Article card",
      inputs: [
        {
          type: "range",
          name: "articlesToShow",
          label: "Max articles",
          defaultValue: 4,
          configs: {
            min: 1,
            max: 10,
            step: 1,
          },
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
              { value: "3/4", label: "Portrait (3/4)" },
              { value: "16/9", label: "Widescreen (16/9)" },
            ],
          },
          helpText:
            'Learn more about image <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio" target="_blank" rel="noopener noreferrer">aspect ratio</a> property.',
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
          type: "switch",
          name: "showAuthor",
          label: "Show author name",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showDate",
          label: "Show date",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showExcerpt",
          label: "Show excerpt",
          defaultValue: false,
        },
        {
          type: "switch",
          name: "showReadmore",
          label: "Show 'Read more' link",
          defaultValue: false,
        },
      ],
    },
  ],
});
