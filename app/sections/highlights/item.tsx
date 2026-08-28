import {
  ArrowsClockwiseIcon,
  CheckFatIcon,
  ClockIcon,
  CreditCardIcon,
  GiftIcon,
  HeadsetIcon,
  type Icon,
  LeafIcon,
  MedalIcon,
  PackageIcon,
  ShieldCheckIcon,
  TruckIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

const ICONS: Record<string, Icon> = {
  ArrowsClockwise: ArrowsClockwiseIcon,
  CheckFat: CheckFatIcon,
  Clock: ClockIcon,
  CreditCard: CreditCardIcon,
  Gift: GiftIcon,
  Headset: HeadsetIcon,
  Leaf: LeafIcon,
  Medal: MedalIcon,
  Package: PackageIcon,
  ShieldCheck: ShieldCheckIcon,
  Truck: TruckIcon,
  User: UserIcon,
};

interface HighlightsItemProps extends HydrogenComponentProps {
  icon?: string;
  title?: string;
  description?: string;
  backgroundColor?: string;
  iconBackgroundColor?: string;
  iconColor?: string;
  titleColor?: string;
  descriptionColor?: string;
  ref?: React.Ref<HTMLDivElement>;
}

const HighlightsItem = (props: HighlightsItemProps) => {
  const {
    ref,
    icon = "User",
    title,
    description,
    backgroundColor,
    iconBackgroundColor,
    iconColor,
    titleColor,
    descriptionColor,
    ...rest
  } = props;
  const IconComponent = ICONS[icon] || UserIcon;

  return (
    <div
      ref={ref}
      {...rest}
      className="flex flex-col items-start gap-5 rounded-[16px] p-7"
      style={{ backgroundColor }}
    >
      <div
        className="flex items-center rounded-full p-3"
        style={{ backgroundColor: iconBackgroundColor }}
      >
        <IconComponent size={28} style={{ color: iconColor }} />
      </div>
      <h5
        className="font-serif text-[32px] leading-[1.1] tracking-[-0.64px]"
        style={{ color: titleColor }}
      >
        {title}
      </h5>
      <p
        className="font-sans text-base leading-[1.6] tracking-[0.28px]"
        style={{ color: descriptionColor }}
      >
        {description}
      </p>
    </div>
  );
};

export default HighlightsItem;

export const schema = createSchema({
  type: "highlights--item",
  title: "Highlight",
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "select",
          name: "icon",
          label: "Icon",
          defaultValue: "User",
          configs: {
            options: [
              { value: "User", label: "User" },
              { value: "Headset", label: "Headset" },
              { value: "CheckFat", label: "Check" },
              { value: "ShieldCheck", label: "Shield check" },
              { value: "Medal", label: "Medal" },
              { value: "Package", label: "Package" },
              { value: "Truck", label: "Truck" },
              { value: "ArrowsClockwise", label: "Returns" },
              { value: "CreditCard", label: "Credit card" },
              { value: "Gift", label: "Gift" },
              { value: "Leaf", label: "Leaf" },
              { value: "Clock", label: "Clock" },
            ],
          },
        },
        {
          type: "text",
          name: "title",
          label: "Title",
          defaultValue: "Customer Support",
        },
        {
          type: "textarea",
          name: "description",
          label: "Description",
          defaultValue:
            "Our dedicated team provides timely assistance, committed to addressing your queries.",
        },
      ],
    },
    {
      group: "Colors",
      inputs: [
        {
          type: "color",
          name: "backgroundColor",
          label: "Card background",
          defaultValue: "#EBEAE5",
        },
        {
          type: "color",
          name: "iconBackgroundColor",
          label: "Icon background",
          defaultValue: "#FFFFFF",
        },
        {
          type: "color",
          name: "iconColor",
          label: "Icon color",
          defaultValue: "#000000",
        },
        {
          type: "color",
          name: "titleColor",
          label: "Title color",
          defaultValue: "#000000",
        },
        {
          type: "color",
          name: "descriptionColor",
          label: "Description color",
          defaultValue: "#000000",
        },
      ],
    },
  ],
  presets: {
    icon: "User",
    title: "Customer Support",
    description:
      "Our dedicated team provides timely assistance, committed to addressing your queries.",
    backgroundColor: "#EBEAE5",
    iconBackgroundColor: "#FFFFFF",
    iconColor: "#000000",
    titleColor: "#000000",
    descriptionColor: "#000000",
  },
});
