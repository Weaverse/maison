import {
  createSchema,
  type HydrogenComponentProps,
  useTranslation,
  type WeaverseVideo,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

const variants = cva("mx-auto aspect-video w-full", {
  variants: {
    size: {
      small: "md:w-1/2",
      medium: "md:w-3/4",
      large: "",
    },
    borderRadius: {
      0: "",
      2: "rounded-xs",
      4: "rounded-sm",
      6: "rounded-md",
      8: "rounded-lg",
      10: "rounded-[10px]",
      12: "rounded-xl",
      14: "rounded-[14px]",
      16: "rounded-2xl",
      18: "rounded-[18px]",
      20: "rounded-[20px]",
      22: "rounded-[22px]",
      24: "rounded-3xl",
      26: "rounded-[26px]",
      28: "rounded-[28px]",
      30: "rounded-[30px]",
      32: "rounded-[32px]",
      34: "rounded-[34px]",
      36: "rounded-[36px]",
      38: "rounded-[38px]",
      40: "rounded-[40px]",
    },
  },
  defaultVariants: {
    size: "medium",
    borderRadius: 0,
  },
});

interface VideoItemProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps {
  ref: React.Ref<HTMLIFrameElement>;
  video: WeaverseVideo;
  videoUrl: string;
}

/**
 * YouTube and Vimeo only allow their `/embed/` URLs inside an iframe. A
 * youtu.be or watch?v= link answers with `X-Frame-Options: SAMEORIGIN`, which
 * the browser refuses to frame, so the section renders an empty box. Merchants
 * copy the Share link, so accept it and rewrite it rather than asking them to
 * hand-build an embed URL.
 */
export function toEmbedUrl(url: string): string {
  if (!url) {
    return url;
  }

  const value = fromIframeTag(url.trim());

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return value;
  }

  const host = parsed.hostname.replace(/^www\./, "");
  const segments = parsed.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    return segments[0] ? youtubeEmbed(segments[0], parsed) : value;
  }

  if (host.endsWith("youtube.com") || host === "youtube-nocookie.com") {
    if (segments[0] === "embed") {
      return value;
    }
    const id =
      parsed.searchParams.get("v") ||
      (["shorts", "live", "v"].includes(segments[0]) ? segments[1] : "");
    return id ? youtubeEmbed(id, parsed) : value;
  }

  if (host === "vimeo.com") {
    const id = segments.find((part) => /^\d+$/.test(part));
    return id ? `https://player.vimeo.com/video/${id}` : value;
  }

  return value;
}

/**
 * The field used to be labelled "Embed URL" and its help text linked YouTube's
 * instructions for getting an embed *code*, which hands you a whole `<iframe>`
 * tag. Stores that followed it have markup saved in this field, so read the src
 * back out rather than dropping the tag into another iframe's src.
 */
function fromIframeTag(value: string): string {
  if (!value.startsWith("<")) {
    return value;
  }
  const src = value.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  return src ? src[1].trim() : value;
}

function youtubeEmbed(id: string, source: URL): string {
  const embed = new URL(`https://www.youtube.com/embed/${id}`);
  // Carry a start offset across; drop share tracking such as `si`.
  const start =
    source.searchParams.get("t") || source.searchParams.get("start");
  if (start) {
    embed.searchParams.set("start", start.replace(/[^\d]/g, ""));
  }
  return embed.toString();
}

export default function VideoEmbedItem(props: VideoItemProps) {
  const { t } = useTranslation();
  const { ref, video, videoUrl, size, borderRadius, ...rest } = props;
  return (
    <iframe
      ref={ref}
      {...rest}
      className={variants({ size, borderRadius })}
      src={toEmbedUrl(video?.url || videoUrl)}
      allowFullScreen
      title={t("video.youtubePlayer")}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      sandbox="allow-presentation allow-same-origin allow-scripts"
    />
  );
}

export const schema = createSchema({
  type: "video-embed--item",
  title: "Video",
  settings: [
    {
      group: "Video",
      inputs: [
        {
          type: "video",
          name: "video",
          label: "Video",
          helpText:
            "If no video is selected, the component will fallback to use the Embed URL below.",
        },
        {
          type: "text",
          name: "videoUrl",
          label: "Video URL",
          defaultValue: "https://www.youtube.com/embed/Su-x4Mo5xmU",
          placeholder: "https://youtu.be/Su-x4Mo5xmU",
          helpText:
            "Paste the link from Share on YouTube or Vimeo — watch, youtu.be and Shorts links all work, as does a full embed code. Ignored when a video is selected above.",
        },
        {
          type: "select",
          name: "size",
          label: "Size",
          defaultValue: "medium",
          configs: {
            options: [
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ],
          },
          helpText: "For desktop only.",
        },
        {
          type: "range",
          name: "borderRadius",
          label: "Border radius",
          configs: {
            min: 0,
            max: 40,
            step: 2,
            unit: "px",
          },
          defaultValue: 0,
        },
      ],
    },
  ],
});
