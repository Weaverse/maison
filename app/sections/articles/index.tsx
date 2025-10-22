import {
  type ComponentLoaderArgs,
  createSchema,
  type WeaverseBlog,
} from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

interface ArticlesData {
  blog?: WeaverseBlog;
  articlesToShow: number;
}

interface ArticlesProps extends SectionProps<ArticlesLoaderData>, ArticlesData {
  ref: React.Ref<HTMLElement>;
}

export default function Articles(props: ArticlesProps) {
  const { ref, children, ...rest } = props;
  return (
    <Section ref={ref} {...rest}>
      {children}
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
  childTypes: ["articles--header", "articles--items"],
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
      inputs: [...layoutInputs.filter((i) => i.name !== "borderRadius")],
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
    gap: 60,
    children: [
      {
        type: "articles--header",
        gap: 16,
        children: [
          {
            type: "heading",
            content: "Articles",
            as: "h4",
            weight: 400,
            alignment: "left",
          },
          {
            type: "view-all-button",
            text: "VIEW ALL",
            link: "/blogs",
            showButton: true,
          },
        ],
      },
      {
        type: "articles--items",
        gap: 16,
        mobileGridSize: "2",
        desktopGridSize: "4",
        imageAspectRatio: "1/1",
        showAuthor: true,
        showDate: true,
        imageBorderRadius: 4,
      },
    ],
  },
});
