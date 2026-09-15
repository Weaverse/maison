# Maison section guide

This guide explains how to compose Maison pages in Weaverse Studio. It is
written for merchants, implementers, and developers who do not work on the theme
every day.

The component registry in `app/weaverse/components.ts` and the schemas in
`app/sections` are the technical source of truth. Settings described as
"required" below are required for a useful storefront result, even when Studio
allows the section to be saved with an empty value.

For local setup, environment variables, and deployment see
[`docs/setup.md`](setup.md). For third-party app configuration see
[`docs/integrations.md`](integrations.md).

## Quick start in Weaverse Studio

1. Choose the correct page type before adding a section. Template sections such
   as Main product, Collection filters, Collection list, All products, Blogs,
   Blog post, Page, Related products, Related articles, and Variant list only
   appear on their matching page type.
2. Add the top-level section first, then add or reorder its child blocks inside
   it. Blocks such as Slide, Collection items, Accordion item, or Newsletter
   form are not standalone sections.
3. Start from the Maison preset, select Shopify resources, then replace copy and
   media. Preserve the preset structure unless the layout intentionally changes.
4. Preview at roughly 430 px, 834 px, and 1440 px before publishing. Maison's
   breakpoints are em-based, so browser zoom shifts them.
5. Test every link, slider control, hotspot, form, and product action on the
   storefront preview. Studio may intentionally disable autoplay.

Publishing in Studio ships content only. Registering a new section, changing a
schema, or editing a component is a code change and needs a deployment.

## Content and media standards

Maison uses responsive Shopify images, so the dimensions below are
recommendations rather than upload validation rules. Match the aspect ratio of
the selected setting and upload the largest clean source available.

| Use | Recommended source | Notes |
| --- | --- | --- |
| Desktop hero or full-width editorial image | 2400 × 1200 px, 2:1 | Keep the subject and any text-safe area near the centre. |
| Mobile hero or slideshow override | 1200 × 1500 px, 4:5 | Supply a separate crop when the desktop focal point will not survive a narrow viewport. |
| Landscape card | 1600 × 1200 px, 4:3 | Articles, promotions, and content cards. |
| Square product or collection card | 1200 × 1200 px, 1:1 | Keep product scale and background treatment consistent across a set. |
| Portrait card | 1200 × 1600 px, 3:4 | Editorial, lifestyle, and vertical collection cards. |
| Standard landscape video | 1920 × 1080 px, 16:9 | Supply a poster with the same crop for Hero video. |
| Blog or article image | 1600 × 1200 px, 4:3 | Use one ratio consistently across the blog index. |
| Logo | Optimized SVG, or PNG on a transparent background | Trim whitespace so logos in Logo list align optically. |
| Team or founder portrait | 1200 × 1600 px, 3:4 | Consistent crop and lighting across the set. |

Copy guidance:

- One message per section. A heading should fit one or two desktop lines and no
  more than three mobile lines.
- Roughly 3–10 words for a promotional heading, 15–35 words for supporting copy,
  and 1–3 words for a CTA label.
- Sentence case for body copy. Reserve uppercase for short headings, labels, and
  CTAs.
- Describe a customer benefit rather than repeating the product or collection
  title.
- Use real destination URLs. Never publish a placeholder or `#` link.

Maison's base font size is 14 px, not the browser default of 16 px. Copy that
reads comfortably in another theme may look smaller here, so check line counts
in preview rather than estimating from a document.

## Section usage table

| Studio section | Use it for | Main data or blocks | Available on |
| --- | --- | --- | --- |
| Hero image | One primary campaign message without motion | Subheading, Heading, Paragraph, Button | Any page |
| Hero video | An immersive introduction where motion matters | Subheading, Heading, Paragraph, Button | Any page |
| Slideshow | Several rotating campaign messages | Slide | Any page |
| Promotion grid | A grid of 4, 9, or 16 promotional tiles | Promotion | Any page |
| Countdown | A deadline for a launch or sale | Heading, Subheading, Timer, Button | Any page |
| Featured collections | Navigation into several collections | Collection header, Collection items | Any page |
| Featured products | A product row from a collection or manual list | Products header, Product items | Any page |
| Single product | One hero product with media and buy controls | Judge.me stars block | Any page |
| Variant list | A purchasable table of every variant | Configured directly | Product page only |
| Hotspots | Shoppable markers over a lifestyle image | Hotspots item | Any page |
| Image with product | One image paired with a product card | Product card | Any page |
| Image with text | An image beside editorial copy | Content, Image | Any page |
| Columns with images | Two to four illustrated columns | Items → Column | Any page |
| Multicolumn | Two to four text columns with optional icons | Header, Items → Item | Any page |
| Image gallery | A curated set of images | Images → Image | Any page |
| Video embed | One or more hosted or embedded videos | Heading, Paragraph, Video | Any page |
| Testimonials | Customer or press quotes | Header, Items → Testimonial | Any page |
| Highlights | Short service or brand benefits | Highlight | Any page |
| Logo list | Stockists, press, or certification marks | Heading, Logo items → Logo | Any page |
| Instagram | A social feed row | Instagram post | Any page |
| Rich text | A block of standalone editorial copy | Subheading, Heading, Paragraph, Button | Any page |
| Accordion | FAQs and grouped supporting information | Information group, Accordion items → Accordion item | Any page |
| Contact form | A general enquiry form | Heading, Subheading, Contact form fields, Paragraph, Button | Any page |
| B2B Signup | A reseller or wholesale application form | Configured directly | Any page |
| Company story | An about-us block of image, copy, and contact details | Image, Content, Separator, Contact | Any page |
| Our team | Team or founder profiles | Heading, Paragraph, Members | Any page |
| Map | A store location with address details | Configured directly | Any page |
| Newsletter | Email capture | Subheading, Heading, Paragraph, Form | Any page |
| Judgeme reviews widget | A full review summary and list | Heading, Paragraph, Summary, List | Product page only |
| Articles | An editorial row of articles | Articles header, Articles items | Any page |
| Related articles | Articles related to the current one | Header, Items | Article page only |
| Related products | Products related to the current one | Header | Product page only |
| Main product | The product template | Product blocks, see below | Product page only |
| Collection filters | The collection template with filters and sort | Configured directly | Collection page only |
| Collection list | The collection index | Subheading, Heading, Paragraph, Collection items | Collection list page only |
| All products | The full catalogue template | Configured directly | All products page only |
| Blogs | The blog index template | Configured directly | Blog page only |
| Blog post | The article template | Configured directly | Article page only |
| Page | The Shopify page template | Configured directly | Page type only |
| Spacer | Deliberate vertical space | Configured directly | Any page |

Sections marked "only" are restricted by `enabledOn` in their schema and will
not appear in Studio's section picker on any other page type.

## Shared blocks

These blocks appear inside several top-level sections. Add them from the parent
section's block list rather than as standalone page sections.

| Block | Purpose | Important settings |
| --- | --- | --- |
| Heading | Semantic display heading | Content, HTML tag, size, weight, colour, alignment |
| Subheading | Eyebrow or supporting label | Content, tag, size, weight, colour, alignment |
| Paragraph | Supporting rich text | Content, width, size, colour, alignment |
| Button | Navigation CTA | Label, destination, variant, custom and hover colours |
| View all button | A link to the full collection or blog | Label, destination |
| Slide | One slideshow message | Media, copy, content position, overlay, CTA |
| Collection items | Collection cards | Collections, layout, gaps |
| Product items | Product cards | Source, collection or manual list, counts |
| Column | One illustrated column | Image, heading, copy, link |
| Accordion item | One question and answer | Icon, title, answer, colours |
| Timer | Countdown values | End time, number and label sizes |
| Newsletter form | Email field and submission | Labels, success text, width, colours, radius |
| Instagram post | One social tile | Image, link |
| Logo | One brand mark | Image, link, alt text |
| Testimonial | One quote | Quote, author, role, image |
| Highlight | One service or brand benefit | Icon, label, description, link |
| Hotspots item | One product marker on an image | Product, X/Y offset, icon |
| Product card | The product tile used inside Image with product | Product selection, display options |

Structural blocks named Items, Images, Members, Content, Header, and Form own
layout and group their child blocks. Keep them nested under the parent shown
below rather than treating them as content.

### Parent and child composition map

An arrow means nesting: the block after the arrow belongs inside the one before
it.

| Parent section | Direct and nested blocks |
| --- | --- |
| Hero image | Subheading, Heading, Paragraph, Button |
| Hero video | Subheading, Heading, Paragraph, Button |
| Slideshow | Slide → Subheading, Heading, Paragraph, Button |
| Promotion grid | Promotion → Subheading, Heading, Paragraph, Buttons → Button |
| Countdown | Heading, Subheading, Timer, Button |
| Featured collections | Collection header → Heading, View all button; Collection items |
| Featured products | Products header → Heading, View all button; Product items; Heading, Subheading, Paragraph |
| Single product | Judge.me stars rating |
| Hotspots | Hotspots item |
| Image with product | Product card |
| Image with text | Content (max 1) → Subheading, Heading, Paragraph, Button; Image (max 1) |
| Columns with images | Subheading, Heading, Paragraph; Items → Column |
| Multicolumn | Header → Heading, View all button; Items → Item → Heading, Paragraph, Button |
| Image gallery | Subheading, Heading, Paragraph; Images → Image |
| Video embed | Heading, Paragraph, Video |
| Testimonials | Header → Heading, Subheading, Paragraph; Items → Testimonial |
| Highlights | Highlight |
| Logo list | Heading; Logo items → Logo |
| Instagram | Instagram post |
| Rich text | Subheading, Heading, Paragraph, Button |
| Accordion | Information group → Heading, Subheading, Paragraph; Accordion items → Accordion item |
| Contact form | Heading, Subheading, Contact form fields, Paragraph, Button |
| Company story | Image, Content → Heading/Paragraph, Separator, Contact → Paragraph |
| Our team | Heading, Paragraph, Members |
| Newsletter | Subheading, Heading, Paragraph, Form |
| Judgeme reviews widget | Heading, Paragraph, Reviews summary, Reviews list |
| Articles | Articles header → Heading, View all button; Articles items |
| Related articles | Header → Heading, View all button; Items |
| Related products | Header → Heading, View all button |
| Collection list | Subheading, Heading, Paragraph, Collection items |
| Main product | See the Main product block list below |

Sections not listed here are configured directly and expose no child blocks:
Variant list, Map, B2B Signup, Collection filters, All products, Blogs, Blog
post, Page, and Spacer.

The Ali Reviews section and its list block exist in `app/sections/ali-reviews`
but their registry entries are commented out in `app/weaverse/components.ts`.
They are not available in Studio and are not covered by this guide.

## Hero and campaign sections

### Hero image

- **Purpose:** One primary campaign message where motion is unnecessary.
- **Blocks:** Optional subheading, heading, paragraph, and button.
- **Required:** A background image.
- **Optional:** Section height (Small, Medium, Large, Fullscreen, or Custom with
  separate mobile and desktop pixel heights), content position, overlay.
- **Media:** A 2:1 desktop image around 2400 × 1200 px. There is no separate
  mobile image input, so choose a crop with a safe central subject.
- **Copy:** One heading, one short sentence, one primary CTA.
- **Mobile:** Height and content reflow, but the same image is reused. Check
  text contrast at narrow widths.
- **Avoid:** Busy imagery behind text without an overlay, or several competing
  buttons.

### Hero video

- **Purpose:** An immersive introduction where motion materially improves the
  story.
- **Blocks:** Optional subheading, heading, paragraph, and button.
- **Required:** Video URL. A poster image is strongly recommended.
- **Optional:** Section height including custom desktop and mobile heights,
  content spacing, overlay.
- **Media:** Prepare a 16:9 source and a poster with the same crop.
- **Copy:** Autoplay video is muted, so never rely on audio to carry a message.
- **Mobile:** Video crops like a cover image. Confirm the subject survives the
  narrower frame.
- **Avoid:** Long clips, essential copy baked into the video, and uploads large
  enough to delay first paint.

### Slideshow

- **Purpose:** Several rotating campaign messages in one viewport slot.
- **Blocks:** Slide, each with its own subheading, heading, paragraph, and
  button.
- **Required:** At least two slides. One slide should be a Hero image instead.
- **Optional:** Section height, Fade or Slide effect, auto-rotate and interval,
  loop, arrows (icon, size, hover-only, colour, shape), dots (position, colour).
- **Copy:** Keep every slide the same shape — same number of lines, same CTA
  style — so the layout does not jump between slides.
- **Mobile:** Arrows are easy to miss on touch devices. Keep dots enabled.
- **Avoid:** More than four or five slides, and intervals short enough that a
  visitor cannot finish reading.

### Promotion grid

- **Purpose:** A grid of promotional tiles pointing into collections or
  campaigns.
- **Blocks:** Promotion, each with subheading, heading, paragraph, and a Buttons
  block holding one or more buttons.
- **Required:** Grid size — 2x2, 3x3, or 4x4 — and one promotion per cell.
- **Optional:** Items gap, background, overlay.
- **Media:** Use one ratio across every tile in the grid.
- **Mobile:** Tiles stack. A 4x4 grid becomes a very long mobile column; prefer
  2x2 unless the page is desktop-led.
- **Avoid:** Leaving cells empty, or mixing portrait and landscape crops in one
  grid.

### Countdown

- **Purpose:** A deadline for a launch, drop, or sale.
- **Blocks:** Heading, subheading, timer, button.
- **Required:** An end time on the Timer block.
- **Optional:** Content width, alignment, spacing, vertical padding, border
  radius, background, overlay.
- **Copy:** Say what happens when the timer ends.
- **Avoid:** Publishing a countdown whose end time has already passed, and
  leaving one on the page after the campaign closes.

## Merchandising sections

### Featured collections

- **Purpose:** Navigation into several collections from one row.
- **Blocks:** Collection header (heading and View all button), Collection items.
- **Required:** At least one collection selected, plus "Collections to show".
- **Media:** Collection images come from Shopify. Set a collection image for
  each one selected, or the card falls back to an empty tile.
- **Avoid:** Selecting more collections than "Collections to show" allows and
  assuming the rest will wrap.

### Featured products

- **Purpose:** A curated product row.
- **Blocks:** Products header (heading and View all button), Product items.
- **Required:** A Source — Auto (best selling), From a collection, or Manual
  selection — and the matching collection or product list.
- **Optional:** Layout counts, heading, subheading, paragraph.
- **Mobile:** The row becomes a horizontal swimlane. Verify the trailing card is
  partly visible so the row reads as scrollable.
- **Avoid:** Manual selection for a row that must stay in stock; auto sources
  survive inventory changes without editing.

### Single product

- **Purpose:** One hero product with media and buy controls outside the product
  template.
- **Blocks:** Judge.me stars rating.
- **Required:** A selected product.
- **Optional:** Show thumbnails, image border radius, thumbnail border radius,
  background colour, layout.
- **Avoid:** Using it as a substitute for the product page; it carries no
  breadcrumb, description, or reviews list.

### Variant list

- **Purpose:** A purchasable table listing every variant of the current product,
  built for wholesale and B2B ordering.
- **Available on:** Product pages only.
- **Required:** Nothing beyond placement; it reads the current product.
- **Layout:** On desktop, five columns for a product with selling plans and
  four without, since the purchase method column only exists when there is a
  plan to pick. Tablet drops to three, and mobile becomes stacked cards. The
  variant column is flexible while the others are fixed, so the table adapts to
  the theme's page width.
- **Mobile:** Each variant becomes a card with its own quantity stepper.
- **Avoid:** Adding it to a product with only one variant, and pairing it with
  Main product's own quantity selector on the same page — two steppers for one
  product confuses buyers.

### Hotspots

- **Purpose:** Shoppable markers over a lifestyle image.
- **Blocks:** Hotspots item, one per product.
- **Required:** An image and at least one marker with a product selected.
- **Optional:** Content width, spacing, vertical padding, aspect ratio (Adapt to
  image, 1:1, 3:4, 4:3, or 16:9), optional heading.
- **Mobile:** Markers stay at their percentage offsets. Keep them away from the
  edges so the popover has room.
- **Avoid:** More than four or five markers on one image, and markers placed
  over a busy area where the icon disappears.

### Image with product

- **Purpose:** One lifestyle image paired with a single product card.
- **Blocks:** Product card.
- **Required:** An image and a selected product.
- **Avoid:** Using it where a Featured products row would serve better; this
  section is for one deliberate pairing.

### Judgeme reviews widget

- **Purpose:** The full review summary and list.
- **Available on:** Product pages only.
- **Blocks:** Heading, paragraph, Reviews summary, Reviews list.
- **Required:** `JUDGEME_PRIVATE_API_TOKEN` in the environment. See
  [`docs/integrations.md`](integrations.md).
- **Behaviour:** With no token the section does not render on the storefront, so
  shoppers are never offered a review form that cannot submit. Studio still shows
  it so it can be designed before the token exists.

### Main product

- **Purpose:** The product template.
- **Available on:** Product pages only. Limit one per page.
- **Blocks, in the order the schema lists them:** Breadcrumb, Badges, Vendor,
  Title, Prices, Stock, Judge.me stars rating, Summary, Bundled variants,
  Variant selector, Quantity selector, Buy buttons, Description.
- Each block is limited to one instance.
- **Required:** Title, Prices, Variant selector, and Buy buttons for a usable
  page.
- **Avoid:** Removing Buy buttons to "clean up" the layout, and reordering so
  price sits below the fold on mobile.

### Related products

- **Purpose:** Products related to the one being viewed.
- **Available on:** Product pages only. Limit one per page.
- **Blocks:** Header with heading and View all button.

## Brand, service, and social sections

### Image with text

- **Purpose:** An image beside editorial copy.
- **Blocks:** Content (max one) holding subheading, heading, paragraph, and
  button; Image (max one).
- **Required:** An image and at least a heading.
- **Mobile:** The two columns stack. Decide deliberately whether image or copy
  should lead.

### Columns with images

- **Purpose:** Two to four illustrated columns for categories or values.
- **Blocks:** Subheading, heading, paragraph, and Items → Column.
- **Required:** One image and one label per column.
- **Media:** Identical ratio and crop across every column.

### Multicolumn

- **Purpose:** Two to four text columns, optionally with icons.
- **Blocks:** Header → heading and View all button; Items → Item → heading,
  paragraph, button.
- **Use it instead of Columns with images** when the point is the copy rather
  than the imagery.

### Image gallery

- **Purpose:** A curated set of images.
- **Blocks:** Subheading, heading, paragraph, and Images → Image.
- **Media:** Keep one ratio across the set unless the layout is deliberately a
  mosaic.

### Video embed

- **Purpose:** One or more hosted or embedded videos.
- **Blocks:** Heading, paragraph, Video.
- **Required:** A video URL per Video block.

### Testimonials

- **Purpose:** Customer or press quotes.
- **Blocks:** Header → heading, subheading, paragraph; Items → Testimonial.
- **Copy:** Attribute every quote. An unattributed testimonial reads as
  marketing copy.

### Highlights

- **Purpose:** Short service or brand benefits such as shipping, returns, and
  guarantees.
- **Blocks:** Highlight.
- **Copy:** Two to four words per label, one short sentence beneath.

### Logo list

- **Purpose:** Stockists, press mentions, or certifications.
- **Blocks:** Heading; Logo items → Logo.
- **Media:** Trim whitespace so marks align optically rather than
  mathematically.

### Instagram

- **Purpose:** A social feed row.
- **Blocks:** Instagram post.

### Rich text

- **Purpose:** A standalone block of editorial copy.
- **Blocks:** Subheading, heading, paragraph, button.

### Accordion

- **Purpose:** FAQs and grouped supporting information.
- **Blocks:** Information group → heading, subheading, paragraph; Accordion
  items → Accordion item.
- **Required:** A title and answer per item.
- **Optional:** Per-item icon and colours. An item with no icon selected renders
  text only, which is the intended default.
- **Layout:** Accordion items render in a single column. Wrap the section in a
  narrower content width rather than splitting questions across two columns.
- **Avoid:** Answers long enough that the open panel pushes the next question
  off screen.

### Contact form

- **Purpose:** A general enquiry form.
- **Blocks:** Heading, subheading, Contact form fields, paragraph, button.
- **Note:** Contact form fields is the block that renders the inputs. The
  section without it renders copy only.

### Company story

- **Purpose:** An about-us block combining image, copy, a separator, and contact
  details.
- **Blocks:** Image, Content → heading and paragraph, Separator, Contact →
  paragraph.
- **Layout:** The section clips its children to a 16 px radius, so child blocks
  should not set their own corner radius.
- **Optional:** Separator thickness, minimum 1 px.

### Our team

- **Purpose:** Team or founder profiles.
- **Blocks:** Heading, paragraph, Members.
- **Media:** One portrait crop across the whole team.

### Map

- **Purpose:** A store location.
- **Required:** A map address. It drives the pin and the Get Directions link and
  is not rendered as text, so the Store info group supplies the visible address.
- **Optional:** Map height (Small, Medium, Large), heading, store details.

### Newsletter

- **Purpose:** Email capture.
- **Blocks:** Subheading, heading, paragraph, Form.
- **Required:** `KLAVIYO_PRIVATE_API_TOKEN` for submissions to reach Klaviyo.
- **Behaviour:** With no token the newsletter surfaces are hidden on the
  storefront while remaining visible in Studio so they can be designed. See
  [`docs/integrations.md`](integrations.md).

### B2B Signup

- **Purpose:** A reseller or wholesale application form.
- **Required:** `WEAVERSE_HOST` and `WEAVERSE_API_KEY`, which the submission
  route uses. Without them the form renders but submission fails.
- **Optional:** Heading, description, button text, background colour.
- **Note:** This schema still uses the legacy `inspector` key rather than
  `settings`. It behaves identically; see "Maintaining this guide".

### Spacer

- **Purpose:** Deliberate vertical space between sections.
- **Use sparingly.** Prefer each section's own vertical padding, so spacing
  stays consistent when sections are reordered.

## Editorial sections

### Articles

- **Purpose:** An editorial row of articles anywhere on the site.
- **Blocks:** Articles header → heading and View all button; Articles items.

### Related articles

- **Purpose:** Articles related to the one being read.
- **Available on:** Article pages only. Limit one per page.
- **Blocks:** Header → heading and View all button; Items.

### Blogs

- **Purpose:** The blog index template.
- **Available on:** Blog pages only. Limit one per page.

### Blog post

- **Purpose:** The article template.
- **Available on:** Article pages only. Limit one per page.

## Commerce template sections

### Collection filters

- **Purpose:** The collection template with filtering and sorting.
- **Available on:** Collection pages only. Limit one per page.
- **Optional:** Show breadcrumb, show description, show banner. A custom banner
  can be stored in a collection metafield; the metafield key is set by
  `CUSTOM_COLLECTION_BANNER_METAFIELD`.
- **Avoid:** Publishing a collection page without this section — the collection
  will render no products.

### Collection list

- **Purpose:** The collection index.
- **Available on:** Collection list pages only. Limit one per page.
- **Blocks:** Subheading, heading, paragraph, Collection items.

### All products

- **Purpose:** The full catalogue template.
- **Available on:** All products pages only. Limit one per page.

### Page

- **Purpose:** The Shopify page template, rendering the page body.
- **Available on:** Page type only. Limit one per page.
- **Note:** A Shopify page can be composed entirely from Maison sections instead
  of this block. Use Page when the merchant maintains the body in Shopify admin.

## Example page compositions

### Homepage — product-led

1. Hero image or Slideshow
2. Featured collections
3. Featured products
4. Image with text
5. Highlights
6. Testimonials
7. Newsletter

### Homepage — editorial

1. Hero video
2. Company story
3. Image gallery
4. Articles
5. Logo list
6. Newsletter

### Collection page

1. Collection filters

Add campaign sections above or below only when the collection needs a
merchandising story. The template section must be present.

### Product page

1. Main product, with blocks ordered Breadcrumb, Badges, Vendor, Title, Prices,
   Stock, Stars rating, Summary, Variant selector, Quantity selector, Buy
   buttons, Description
2. Judgeme reviews widget
3. Related products

### Wholesale or B2B product page

1. Main product
2. Variant list
3. Related products

Remove Main product's Quantity selector when Variant list is present, so the
page offers one quantity control per variant rather than two.

### About page

1. Hero image
2. Company story
3. Our team
4. Logo list
5. Map

### Reseller page

1. Hero image
2. B2B Signup
3. Accordion for the FAQ
4. Contact form

### Blog index

1. Blogs

### Article page

1. Blog post
2. Related articles

## Common mistakes to avoid

- Adding a template section to the wrong page type, then reporting it as
  missing. Check the "Available on" column first.
- Expecting `/search` to be editable. It is the one route with a full UI that
  never calls `loadPage`, so it renders entirely from code.
- Changing a `defaultValue` in a schema and expecting saved pages to update.
  Defaults seed new instances only; change the saved value in Studio.
- Publishing content and expecting a code change to ship with it. Section
  registration and schema edits need a deployment.
- Using Spacer to fix spacing that belongs in a section's vertical padding.
- Leaving a Countdown live after its end time.
- Selecting more collections than the layout will show.
- Setting a corner radius on a child block inside Company story, which already
  clips its children.
- Publishing placeholder or `#` links.
- Uploading one desktop crop and assuming it will work at 430 px.

## Pre-publish checklist

- [ ] The page uses the correct template section for its page type.
- [ ] Every image uses the recommended ratio and has meaningful alt text.
- [ ] Every link points at a real destination.
- [ ] Headings fit within three lines at 430 px.
- [ ] Sliders, accordions, hotspots, and forms have been tested in the
      storefront preview, not only in Studio.
- [ ] Forms have been submitted once end to end.
- [ ] The page has been checked at roughly 430 px, 834 px, and 1440 px.
- [ ] No section is left with placeholder copy or an empty required resource.

## Maintaining this guide

Update this file in the same pull request that adds, removes, or renames a
section. In particular:

- A new section is only usable once it is exported from `app/sections` **and**
  registered in `app/weaverse/components.ts`. Registration is what makes it
  appear in Studio.
- `app/weaverse/components.ts` currently lists `Blogs`, `BlogPost`, and
  `AllProducts` twice. The duplicates are harmless but should be removed the
  next time the file is touched.
- Most schemas use `createSchema()`. The Accordion section and its two child
  blocks still export a plain `HydrogenComponentSchema` object, and B2B Signup
  still uses the legacy `inspector` key instead of `settings`. Both forms work;
  converge on `createSchema()` with `settings` when editing those files.
- Ali Reviews remains in the codebase with its registry entries commented out.
  Uncomment them and document the section here if the integration is revived.
