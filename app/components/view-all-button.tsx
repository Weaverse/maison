import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { Link } from "~/components/link";

const ArrowRight = () => (
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
);

interface ViewAllButtonProps extends HydrogenComponentProps {
  text: string;
  link?: string;
  textColor?: string;
  showButton?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

const ViewAllButton = (props: ViewAllButtonProps) => {
  const { ref, text, link, textColor, showButton } = props;

  if (!showButton) {
    return null;
  }

  return (
    <div ref={ref} className="flex gap-2.5 items-center">
      <Link to={link} className="text-sm" style={{ color: textColor }}>
        {text}
      </Link>
      <ArrowRight />
    </div>
  );
};

export default ViewAllButton;

export const schema = createSchema({
  type: "view-all-button",
  title: "View all button",
  settings: [
    {
      group: "Button",
      inputs: [
        {
          type: "switch",
          name: "showButton",
          label: "Show button",
          defaultValue: true,
        },
        {
          type: "text",
          name: "text",
          label: "Button text",
          defaultValue: "VIEW ALL",
        },
        {
          type: "text",
          name: "link",
          label: "Button link",
          defaultValue: "/",
        },
        {
          type: "color",
          name: "textColor",
          label: "Text color",
        },
      ],
    },
  ],
});
