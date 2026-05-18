import * as Accordion from "@radix-ui/react-accordion";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import clsx from "clsx";
import { Link, useLoaderData } from "react-router";
import type { loader as productLoader } from "~/routes/($locale).products.$productHandle";

function getExcerpt(text: string) {
  const regex = /<p.*>(.*?)<\/p>/;
  const match = regex.exec(text);
  return match?.length ? match[0] : text;
}

interface CollapsibleDetailsProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  showShippingPolicy: boolean;
  showRefundPolicy: boolean;
}

export default function CollapsibleDetails(props: CollapsibleDetailsProps) {
  const { ref, showShippingPolicy, showRefundPolicy, ...rest } = props;
  const { shop, product } = useLoaderData<typeof productLoader>();
  const { description } = product;
  const { shippingPolicy, refundPolicy } = shop;
  const details = [
    { title: "Description", content: description },
    showShippingPolicy &&
      shippingPolicy?.body && {
        title: "Shipping",
        content: getExcerpt(shippingPolicy.body),
        learnMore: `/policies/${shippingPolicy.handle}`,
      },
    showRefundPolicy &&
      refundPolicy?.body && {
        title: "Returns",
        content: getExcerpt(refundPolicy.body),
        learnMore: `/policies/${refundPolicy.handle}`,
      },
  ].filter(Boolean);

  return (
    <div ref={ref} {...rest}>
      <Accordion.Root type="multiple" className="border-b border-line-subtle">
        {details.map(({ title, content, learnMore }) => (
          <Accordion.Item key={title} value={title}>
            <Accordion.Header>
              <Accordion.Trigger
                className={clsx([
                  "group flex w-full justify-between font-bold py-[24px]",
                  "border-line-subtle border-t",
                ])}
              >
                <span>{title}</span>
                <div className="relative size-3 flex items-center justify-center">
                  <span className="absolute h-[1px] w-full bg-current" />
                  <span className="absolute h-[1px] w-full bg-current rotate-90 group-data-[state=open]:rotate-0 transition-transform duration-200" />
                </div>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content
              style={
                {
                  "--expand-to": "var(--radix-accordion-content-height)",
                  "--expand-duration": "0.15s",
                  "--collapse-from": "var(--radix-accordion-content-height)",
                  "--collapse-duration": "0.15s",
                } as React.CSSProperties
              }
              className={clsx([
                "overflow-hidden",
                "data-[state=closed]:animate-collapse",
                "data-[state=open]:animate-expand",
              ])}
            >
              <div
                suppressHydrationWarning
                className="prose dark:prose-invert py-2.5 text-body-subtle"
                dangerouslySetInnerHTML={{ __html: content }}
              />
              {learnMore && (
                <Link
                  className="border-line-subtle border-b pb-px text-body-subtle"
                  to={learnMore}
                >
                  Learn more
                </Link>
              )}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
}

export const schema = createSchema({
  type: "mp--collapsible-details",
  title: "Collapsible details",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [
    {
      group: "General",
      inputs: [
        {
          type: "switch",
          label: "Show shipping policy",
          name: "showShippingPolicy",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show refund policy",
          name: "showRefundPolicy",
          defaultValue: true,
        },
      ],
    },
  ],
});
