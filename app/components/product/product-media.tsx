import { VideoCameraIcon } from "@phosphor-icons/react";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";
import { useEffect, useState } from "react";
import type {
  Media_MediaImage_Fragment,
  Media_Video_Fragment,
  MediaFragment,
  ProductVariantFragment,
} from "storefront-api.generated";
import { FreeMode, Navigation, Pagination, Thumbs } from "swiper/modules";
import { Swiper, type SwiperClass, SwiperSlide } from "swiper/react";
import { ArrowLeft, ArrowRight } from "~/components/icons";
import { Image } from "~/components/image";
import type { ImageAspectRatio } from "~/types/image";
import { cn } from "~/utils/cn";
import { calculateAspectRatio } from "~/utils/image";
import { CollectionBadge, SaleBadge } from "./badges";
import { ZoomButton, ZoomModal } from "./media-zoom";

const variants = cva(
  [
    "grid w-full justify-start gap-2 lg:gap-1",
    "lg:grid-cols-1",
    "grid-flow-col lg:grid-flow-row",
    "scroll-px-6 overflow-x-scroll md:overflow-x-auto",
    "snap-x snap-mandatory",
  ],
  {
    variants: {
      gridSize: {
        "1x1": "",
        "2x2": "2xl:grid-cols-2",
        mix: "2xl:grid-cols-2",
      },
    },
  },
);

export interface ProductMediaProps extends VariantProps<typeof variants> {
  mediaLayout: "grid" | "slider";
  imageAspectRatio?: ImageAspectRatio;
  showThumbnails: boolean;
  selectedVariant: ProductVariantFragment;
  media: MediaFragment[];
  enableZoom?: boolean;
  zoomTrigger?: "image" | "button" | "both";
  zoomButtonVisibility?: "always" | "hover";
  collectionTitle?: string;
  showCollectionBadge?: boolean;
  showSaleBadge?: boolean;
}

export function ProductMedia(props: ProductMediaProps) {
  const {
    mediaLayout: initialMediaLayout,
    gridSize: initialGridSize,
    showThumbnails,
    imageAspectRatio,
    selectedVariant,
    media,
    enableZoom,
    zoomTrigger = "button",
    zoomButtonVisibility = "hover",
    collectionTitle,
    showCollectionBadge,
    showSaleBadge,
  } = props;

  const [swiper, setSwiper] = useState<SwiperClass | null>(null);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperClass | null>(null);
  const [zoomMediaId, setZoomMediaId] = useState<string | null>(null);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation> --- IGNORE ---
  useEffect(() => {
    if (selectedVariant && swiper) {
      const index = getSelectedVariantMediaIndex(media, selectedVariant);
      if (index !== swiper.activeIndex) {
        swiper.slideTo(index);
      }
    }
  }, [selectedVariant]);

  useEffect(() => {
    if (!swiper) {
      return;
    }

    const handleSlideChange = () => {
      const slideIndex = swiper.realIndex ?? swiper.activeIndex;
      setActiveIndex(slideIndex);
    };

    swiper.on("slideChange", handleSlideChange);
    handleSlideChange();

    return () => {
      swiper.off("slideChange", handleSlideChange);
    };
  }, [swiper]);

  let mediaLayout = initialMediaLayout;
  let gridSize = initialGridSize;
  if (media.length === 1) {
    mediaLayout = "grid";
    gridSize = "1x1";
  }

  const shouldShowButton =
    enableZoom && (zoomTrigger === "button" || zoomTrigger === "both");
  const canClickImage =
    enableZoom && (zoomTrigger === "image" || zoomTrigger === "both");

  if (mediaLayout === "grid") {
    return (
      <>
        <div className="relative">
          {(showCollectionBadge || showSaleBadge) && (
            <div className="absolute top-3 left-3 md:top-5 md:left-5 flex items-center gap-2 z-[2]">
              {showCollectionBadge && (
                <CollectionBadge collectionTitle={collectionTitle || ""} />
              )}
              {showSaleBadge && (
                <SaleBadge
                  price={selectedVariant?.price as MoneyV2}
                  compareAtPrice={selectedVariant?.compareAtPrice as MoneyV2}
                />
              )}
            </div>
          )}
          <div className={variants({ gridSize })}>
            {media.map((med, idx) => {
              return (
                <div
                  key={med.id}
                  className={clsx(
                    "group relative",
                    gridSize === "mix" && idx % 3 === 0 && "lg:col-span-2",
                  )}
                >
                  <div
                    onClick={
                      canClickImage
                        ? () => {
                            setZoomMediaId(med.id);
                            setZoomModalOpen(true);
                          }
                        : undefined
                    }
                    className={canClickImage ? "cursor-zoom-in" : ""}
                  >
                    <Media
                      media={med}
                      imageAspectRatio={imageAspectRatio}
                      index={idx}
                      className={cn(
                        "w-full max-w-none object-cover lg:h-full lg:w-full rounded",
                        idx === 0 &&
                          "[&_img]:[view-transition-name:image-expand]",
                      )}
                    />
                  </div>
                  {shouldShowButton && (
                    <ZoomButton
                      className={clsx(
                        "absolute top-2 right-2 md:top-4 md:right-4",
                        zoomButtonVisibility === "hover" &&
                          "opacity-0 group-hover:opacity-100",
                      )}
                      onClick={() => {
                        setZoomMediaId(med.id);
                        setZoomModalOpen(true);
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {enableZoom && (
          <ZoomModal
            media={media}
            zoomMediaId={zoomMediaId}
            setZoomMediaId={setZoomMediaId}
            open={zoomModalOpen}
            onOpenChange={setZoomModalOpen}
          />
        )}
      </>
    );
  }

  return (
    <div className="product-media-slider">
      <div className="flex flex-col gap-3">
        <div className="relative w-[calc(100%-var(--thumbs-width,0px))]">
          <Swiper
            onSwiper={setSwiper}
            thumbs={{ swiper: thumbsSwiper }}
            slidesPerView={1}
            spaceBetween={4}
            autoHeight
            loop
            navigation={{
              nextEl: ".media_slider__next",
              prevEl: ".media_slider__prev",
            }}
            pagination={{ type: "fraction" }}
            modules={[Pagination, Navigation, Thumbs]}
            className="overflow-hidden pb-10 md:pb-0 md:[&_.swiper-pagination]:hidden"
          >
            {media.map((med, idx) => {
              return (
                <SwiperSlide
                  key={med.id}
                  className="group bg-gray-100 rounded overflow-hidden"
                >
                  <div
                    onClick={
                      canClickImage
                        ? () => {
                            setZoomMediaId(med.id);
                            setZoomModalOpen(true);
                          }
                        : undefined
                    }
                    className={canClickImage ? "cursor-zoom-in" : ""}
                  >
                    <Media
                      media={med}
                      imageAspectRatio={imageAspectRatio}
                      index={idx}
                      className={
                        idx === 0 &&
                        "[&_img]:[view-transition-name:image-expand]"
                      }
                    />
                  </div>
                  {shouldShowButton && (
                    <ZoomButton
                      className={clsx(
                        "absolute top-2 right-2 md:top-6 md:right-6",
                        zoomButtonVisibility === "hover" &&
                          "opacity-0 group-hover:opacity-100",
                      )}
                      onClick={() => {
                        setZoomMediaId(med.id);
                        setZoomModalOpen(true);
                      }}
                    />
                  )}
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* progress bar */}
          {media.length > 1 && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[1] flex items-center justify-center pb-10">
              <div className="w-[160px] h-[2px] bg-(--color-line-subtle) relative">
                <div
                  className="absolute left-0 top-0 h-full bg-(--color-line) transition-all duration-300"
                  style={{
                    width: `${((activeIndex + 1) / media.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {(showCollectionBadge || showSaleBadge) && (
            <div className="absolute top-3 left-3 md:top-5 md:left-5 flex items-center gap-2 z-[2]">
              {showCollectionBadge && (
                <CollectionBadge collectionTitle={collectionTitle || ""} />
              )}
              {showSaleBadge && (
                <SaleBadge
                  price={selectedVariant?.price as MoneyV2}
                  compareAtPrice={selectedVariant?.compareAtPrice as MoneyV2}
                />
              )}
            </div>
          )}

          <div className="absolute -left-2 -right-2 md:-left-3 md:-right-3 lg:-left-7 lg:-right-7 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-[3]">
            <button
              type="button"
              className="media_slider__prev p-4 pointer-events-auto rounded-full border border-transparent bg-(--btn-secondary-bg) transition-all duration-200 disabled:cursor-not-allowed disabled:text-body-subtle"
            >
              <ArrowLeft />
            </button>
            <button
              type="button"
              className="media_slider__next p-4 pointer-events-auto rounded-full border border-transparent bg-(--btn-secondary-bg) transition-all duration-200 disabled:cursor-not-allowed disabled:text-body-subtle"
            >
              <ArrowRight />
            </button>
          </div>
        </div>

        {showThumbnails && (
          <div className="w-full opacity-0 transition-opacity duration-300">
            <Swiper
              onSwiper={setThumbsSwiper}
              direction="horizontal"
              spaceBetween={12}
              slidesPerView={6}
              watchSlidesProgress
              rewind
              freeMode
              className="w-full overflow-hidden"
              onInit={(sw) => {
                if (sw.el.parentElement) {
                  sw.el.parentElement.style.opacity = "1";
                }
              }}
              modules={[Navigation, Thumbs, FreeMode]}
            >
              {media.map(({ id, previewImage, alt, mediaContentType }) => {
                return (
                  <SwiperSlide
                    key={id}
                    className={cn(
                      "relative",
                      "h-auto! cursor-pointer rounded overflow-hidden",
                      "[&.swiper-slide-thumb-active]:border-[3px] [&.swiper-slide-thumb-active]:border-(--color-line) [&.swiper-slide-thumb-active]:p-0",
                    )}
                  >
                    <Image
                      data={{
                        ...previewImage,
                        altText: alt || "Product image",
                      }}
                      loading="lazy"
                      width={200}
                      aspectRatio="1/1"
                      className="h-auto w-full object-cover"
                      sizes="auto"
                    />
                    {mediaContentType === "VIDEO" && (
                      <div className="absolute right-2 bottom-2 bg-gray-900 p-0.5 text-white">
                        <VideoCameraIcon className="h-4 w-4" />
                      </div>
                    )}
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        )}
      </div>

      {enableZoom && (
        <ZoomModal
          media={media}
          zoomMediaId={zoomMediaId}
          setZoomMediaId={setZoomMediaId}
          open={zoomModalOpen}
          onOpenChange={setZoomModalOpen}
        />
      )}
    </div>
  );
}

function Media({
  media,
  imageAspectRatio,
  index,
  className,
}: {
  media: MediaFragment;
  imageAspectRatio: ImageAspectRatio;
  index: number;
  className?: string;
}) {
  if (media.mediaContentType === "IMAGE") {
    const { image, alt } = media as Media_MediaImage_Fragment;
    return (
      <Image
        data={{ ...image, altText: alt || "Product image" }}
        loading={index === 0 ? "eager" : "lazy"}
        className={cn("h-auto w-full object-cover", className)}
        width={2048}
        aspectRatio={calculateAspectRatio(image, imageAspectRatio)}
        sizes="auto"
      />
    );
  }
  if (media.mediaContentType === "VIDEO") {
    const mediaVideo = media as Media_Video_Fragment;
    return (
      <video
        controls
        aria-label={mediaVideo.alt || "Product video"}
        className={cn("h-auto w-full object-cover", className)}
        style={{ aspectRatio: imageAspectRatio }}
        onError={console.error}
      >
        <track
          kind="captions"
          src={mediaVideo.sources[0].url}
          label="English"
          srcLang="en"
          default
        />
        <source src={mediaVideo.sources[0].url} type="video/mp4" />
      </video>
    );
  }
  return null;
}

function getSelectedVariantMediaIndex(
  media: MediaFragment[],
  selectedVariant: ProductVariantFragment,
) {
  if (!selectedVariant) {
    return 0;
  }
  const mediaUrl = selectedVariant.image?.url;
  return media.findIndex((med) => med.previewImage?.url === mediaUrl);
}
