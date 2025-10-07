import {
  type ComponentLoaderArgs,
  createSchema,
  type WeaverseBlog,
} from "@weaverse/hydrogen";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";
import { Link } from "~/components/link";
import { backgroundInputs } from "~/components/background-image";
import Heading, {
  headingInputs,
  type HeadingProps,
} from "~/components/heading";

interface ArticlesData {
  blog?: WeaverseBlog;
  articlesToShow: number;
  heading: string;
  headingTagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  headingTextColor?: string;
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
  itemSpacing: number;
}

interface ArticlesProps extends SectionProps<ArticlesLoaderData>, ArticlesData {
  ref: React.Ref<HTMLElement>;
}

export default function Articles(props: ArticlesProps) {
  const {
    ref,
    loaderData,
    children,
    heading,
    headingTagName,
    headingTextColor,
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
    itemSpacing,
    ...rest
  } = props;
  return (
    <Section ref={ref} {...rest}>
      <div className="flex flex-col" style={{ gap: `${itemSpacing}px` }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Heading
            content={heading}
            as={headingTagName}
            color={headingTextColor}
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
          {viewAllText && (
            <div className="flex items-center gap-2">
              <Link
                to={
                  loaderData?.blogHandle
                    ? `/blogs/${loaderData.blogHandle}`
                    : "#"
                }
                className="text-sm"
                style={{ color: headingTextColor }}
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
      </div>
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
      group: "Layout",
      inputs: [
        ...layoutInputs.filter(
          (i) => i.name !== "borderRadius" && i.name !== "gap",
        ),
        {
          type: "range",
          name: "itemSpacing",
          label: "Item spacing",
          defaultValue: 60,
          shouldRevalidate: true,
          configs: {
            min: 0,
            max: 100,
            step: 5,
            unit: "px",
          },
        },
      ],
    },
    {
      group: "Header",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Articles",
          placeholder: "Articles",
        },
        ...headingInputs
          .filter((input) => input.name !== "color")
          .map((input) => {
            if (input.name === "as")
              return { ...input, name: "headingTagName", defaultValue: "h3" };
            if (input.name === "weight") return { ...input, defaultValue: 400 };
            return input;
          }),
        {
          type: "color",
          name: "headingTextColor",
          label: "Heading text color",
        },
        {
          type: "text",
          name: "viewAllText",
          label: "View all text",
          defaultValue: "VIEW ALL",
        },
      ],
    },
    {
      group: "Background",
      inputs: [
        ...backgroundInputs.filter(
          (inp) =>
            inp.name !== "backgroundImage" &&
            inp.name !== "backgroundFit" &&
            inp.name !== "backgroundPosition",
        ),
      ],
    },
  ],
  presets: {
    heading: "Articles",
    headingTagName: "h3",
    weight: 400,
    alignment: "left",
    viewAllText: "VIEW ALL",
    itemSpacing: 60,
    children: [
      {
        type: "articles-items",
        gap: 16,
        mobileGridSize: "2",
        desktopGridSize: "4",
        imageAspectRatio: "1/1",
        showAuthor: true,
        showDate: true,
        imageBorderRadius: 4,
        itemSpacing: 20,
      },
    ],
  },
});
