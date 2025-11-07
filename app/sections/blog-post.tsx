import {
  FacebookLogoIcon,
  PinterestLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { createSchema, isBrowser } from "@weaverse/hydrogen";
import { useLoaderData, useRouteLoaderData } from "react-router";
import {
  FacebookShareButton,
  PinterestShareButton,
  TwitterShareButton,
} from "react-share";
import type { ArticleQuery } from "storefront-api.generated";
import { Image } from "~/components/image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";
import type { RootLoader } from "~/root";

interface BlogPostProps extends SectionProps {
  ref: React.Ref<HTMLElement>;
  showTags: boolean;
  showShareButtons: boolean;
}

export default function BlogPost(props: BlogPostProps) {
  const { ref, showTags, showShareButtons, ...rest } = props;
  const { layout } = useRouteLoaderData<RootLoader>("root");
  const { article, blog, formattedDate } = useLoaderData<{
    article: ArticleQuery["blog"]["articleByHandle"];
    blog: ArticleQuery["blog"];
    formattedDate: string;
  }>();
  const { title, handle, image, contentHtml, author, tags } = article;
  if (article) {
    let domain = layout.shop.primaryDomain.url;
    if (isBrowser) {
      const origin = window.location.origin;
      if (!origin.includes("localhost")) {
        domain = origin;
      }
    }
    const { handle: blogHandle } = blog;
    const articleUrl = `${domain}/blogs/${blogHandle}/${handle}`;
    return (
      <Section ref={ref} {...rest}>
        {image && (
          <div className="w-full h-[600px]">
            <Image
              data={image}
              sizes="100vw"
              width={1920}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="px-5 py-20 md:px-20 lg:px-0 lg:max-w-[728px] mx-auto">
          <h3 className="h3 leading-tight!">{title}</h3>

          <div className="text-sm flex flex-wrap gap-1 pt-4 text-body-subtle">
            {formattedDate && (
              <span>
                {formattedDate}
                {author?.name && " —"}
              </span>
            )}
            {author?.name && <span>{author.name}</span>}
          </div>

          <article className="prose max-w-full">
            <div className="mx-auto space-y-8 md:space-y-16">
              <div
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />

              {(showTags || showShareButtons) && (
                <div className="mx-auto w-1/3 border-line-subtle border-t" />
              )}

              <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
                {showTags && (
                  <div>
                    <strong>Tags:</strong>
                    <span className="ml-2">{tags.join(", ")}</span>
                  </div>
                )}
                {showShareButtons && (
                  <div className="flex items-center gap-2">
                    <strong>Share:</strong>
                    <FacebookShareButton url={articleUrl}>
                      <FacebookLogoIcon size={24} />
                    </FacebookShareButton>
                    <PinterestShareButton url={articleUrl} media={image?.url}>
                      <PinterestLogoIcon size={24} />
                    </PinterestShareButton>
                    <TwitterShareButton url={articleUrl} title={title}>
                      <XLogoIcon size={24} />
                    </TwitterShareButton>
                  </div>
                )}
              </div>
            </div>
          </article>
        </div>
      </Section>
    );
  }
  return <Section ref={ref} {...rest} />;
}

export const schema = createSchema({
  type: "blog-post",
  title: "Blog post",
  limit: 1,
  enabledOn: {
    pages: ["ARTICLE"],
  },
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter((input) => input.name !== "borderRadius"),
    },
    {
      group: "Article",
      inputs: [
        {
          type: "switch",
          label: "Show tags",
          name: "showTags",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show share buttons",
          name: "showShareButtons",
          defaultValue: true,
        },
      ],
    },
  ],
});
