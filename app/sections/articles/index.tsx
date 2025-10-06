import {
  type ComponentLoaderArgs,
  createSchema,
  type WeaverseBlog,
} from "@weaverse/hydrogen";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";
import { Link } from "~/components/link";
import Heading, {
  headingInputs,
  type HeadingProps,
} from "~/components/heading";

interface ArticlesData {
  blog?: WeaverseBlog;
  articlesToShow: number;
  heading: string;
  headingTagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  color?: HeadingProps["color"];
  size?: HeadingProps["size"];
  mobileSize?: HeadingProps["mobileSize"];
  desktopSize?: HeadingProps["desktopSize"];
  weight?: HeadingProps["weight"];
  letterSpacing?: HeadingProps["letterSpacing"];
  alignment?: HeadingProps["alignment"];
  minSize?: HeadingProps["minSize"];
  maxSize?: HeadingProps["maxSize"];
  animate?: HeadingProps["animate"];
  viewAllText: string;
  viewAllTextColor: string;
  imageAspectRatio: "adapt" | "1/1" | "3/4" | "4/3" | "16/9";
  titleLineClamp: number;
  showAuthor: boolean;
  showDate: boolean;
  imageBorderRadius: number;
  itemSpacing: number;
  backgroundColor: string;
}

interface ArticlesProps
  extends Omit<SectionProps<ArticlesLoaderData>, "backgroundColor">,
    ArticlesData {
  ref: React.Ref<HTMLElement>;
}

export default function Articles(props: ArticlesProps) {
  const {
    ref,
    loaderData,
    children,
    heading,
    headingTagName,
    color,
    size,
    mobileSize,
    desktopSize,
    weight,
    letterSpacing,
    alignment,
    minSize,
    maxSize,
    animate,
    viewAllText,
    viewAllTextColor,
    imageAspectRatio,
    titleLineClamp,
    showAuthor,
    showDate,
    imageBorderRadius,
    itemSpacing,
    backgroundColor,
    ...rest
  } = props;
  return (
    <Section
      ref={ref}
      {...rest}
      backgroundColor={backgroundColor}
      style={undefined}
    >
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: `${itemSpacing}px` }}
      >
        <Heading
          content={heading}
          as={headingTagName}
          color={color}
          size={size}
          mobileSize={mobileSize}
          desktopSize={desktopSize}
          weight={weight}
          letterSpacing={letterSpacing}
          alignment={alignment}
          minSize={minSize}
          maxSize={maxSize}
          animate={animate}
        />
        {loaderData?.blogHandle && (
          <div className="flex items-center gap-2">
            <Link
              to={`/blogs/${loaderData.blogHandle}`}
              className="text-sm"
              style={{ color: viewAllTextColor }}
            >
              {viewAllText}
            </Link>
            {/* <ArrowRightIcon /> */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="11"
              viewBox="0 0 20 11"
              fill="none"
            >
              <path
                d="M14.0575 0.376953L13.1737 1.26082L16.9236 5.0107H0.625V6.26074H16.9234L13.1737 10.0105L14.0575 10.8944L19.3163 5.63566L14.0575 0.376953Z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}
      </div>
      <div>{children}</div>
    </Section>
  );
}

const BLOG_QUERY = `#graphql
query BlogSingle(
    $language: LanguageCode
    $blogHandle: String!
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      articles(first: 8) {
        nodes {
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
          blog {
            handle
          }
        }
      }
    }
  }
` as const;

export type ArticlesLoaderData = Awaited<ReturnType<typeof loader>>;

export const loader = async (args: ComponentLoaderArgs<ArticlesData>) => {
  let { weaverse, data } = args;
  let { storefront } = weaverse;
  if (data.blog?.handle) {
    const res = await storefront.query(BLOG_QUERY, {
      variables: {
        blogHandle: data.blog.handle,
        language: storefront.i18n.language,
      },
    });

    return {
      articles: res?.blog?.articles?.nodes ?? [],
      blogHandle: data.blog.handle,
    };
  }
  return null;
};

export const schema = createSchema({
  type: "articles",
  title: "Articles",
  childTypes: ["articles-items"],
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter((i) => i.name !== "borderRadius"),
    },
    {
      group: "Article selection",
      inputs: [
        {
          type: "blog",
          name: "blog",
          label: "Select blog",
          shouldRevalidate: true,
        },
        {
          type: "range",
          name: "articlesToShow",
          label: "Articles to show",
          defaultValue: 4,
          shouldRevalidate: true,
          configs: {
            min: 1,
            max: 12,
            step: 1,
          },
        },
      ],
    },
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Articles",
          placeholder: "Articles",
        },
        ...headingInputs.map((input) => {
          if (input.name === "as")
            return { ...input, name: "headingTagName", defaultValue: "h3" };
          if (input.name === "weight") return { ...input, defaultValue: 400 };
          return input;
        }),
        {
          type: "text",
          name: "viewAllText",
          label: "View all text",
          defaultValue: "VIEW ALL",
        },
        {
          type: "color",
          name: "viewAllTextColor",
          label: "View all text color",
          defaultValue: "#3C3428",
        },
      ],
    },
    {
      group: "Colors",
      inputs: [
        {
          type: "color",
          name: "backgroundColor",
          label: "Background color",
          defaultValue: "#F9F7F4",
        },
      ],
    },
  ],
  presets: {
    gap: 60,
    heading: "Articles",
    headingTagName: "h3",
    weight: 400,
    alignment: "left",
    color: "#3C3428",
    viewAllText: "VIEW ALL",
    viewAllTextColor: "#3C3428",
    itemSpacing: 60,
    backgroundColor: "#F9F7F4",
    children: [
      {
        type: "articles-items",
        imageAspectRatio: "1/1",
        titleLineClamp: 2,
        showAuthor: true,
        showDate: true,
        imageBorderRadius: 4,
        gap: 16,
        itemSpacing: 20,
      },
    ],
  },
});
