import {
  GithubLogoIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  useParentInstance,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import { Link } from "react-router";
import type { OurTeamQuery } from "storefront-api.generated";
import { Image } from "~/components/image";

type MemberType = {
  name: string;
  title: string;
  bio: string;
  avatar: WeaverseImage;
  github_url: string;
  linkedin_url: string;
  x_url: string;
};

interface TeamMembersProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

const MEMBER_PLACEHOLDER: Partial<MemberType> = {
  name: "Team member",
  title: "Job title",
  bio: "Add a short bio for this team member.",
  avatar: { url: IMAGES_PLACEHOLDERS.image } as WeaverseImage,
};

function TeamMembers(props: TeamMembersProps) {
  const { ref, ...rest } = props;
  const parent = useParentInstance();
  const { metaobjects }: OurTeamQuery = parent.data?.loaderData || {};
  const membersCount = Number(parent.data?.data?.membersCount ?? 4);

  // Nothing picked yet: show placeholder cards instead of real store data.
  const members: { id: string; member: Partial<MemberType> }[] = metaobjects
    ?.nodes?.length
    ? metaobjects.nodes.map(({ id, fields }) => {
        const member: Partial<MemberType> = {};
        for (const { key, value, reference } of fields) {
          member[key] = key === "avatar" ? reference?.image : value;
        }
        return { id, member };
      })
    : new Array(membersCount).fill(null).map((_, index) => ({
        id: `placeholder-${index}`,
        member: MEMBER_PLACEHOLDER,
      }));

  return (
    <div
      ref={ref}
      {...rest}
      className="mb-6 grid gap-8 pt-4 md:grid-cols-2 lg:mb-16"
    >
      {members.map(({ id, member }) => {
        const { name, title, bio, avatar, github_url, linkedin_url, x_url } =
          member;
        return (
          <div key={id} className="items-center bg-gray-50 sm:flex">
            {avatar && (
              <Image
                data={avatar}
                sizes="auto"
                className="h-auto w-full sm:h-48 sm:w-48"
                aspectRatio="1/1"
                width={500}
              />
            )}
            <div className="p-5">
              <div className="font-semibold text-xl tracking-tight">{name}</div>
              <span className="text-gray-600">{title}</span>
              {bio && (
                <p className="mt-3 mb-4 font-light text-gray-600">{bio}</p>
              )}
              <ul className="flex space-x-3">
                {linkedin_url && (
                  <li>
                    <Link
                      to={linkedin_url}
                      target="_blank"
                      className="text-gray-500 hover:text-gray-900"
                    >
                      <LinkedinLogoIcon className="h-6 w-6" />
                    </Link>
                  </li>
                )}
                {github_url && (
                  <li>
                    <Link
                      to={github_url}
                      target="_blank"
                      className="text-gray-500 hover:text-gray-900"
                    >
                      <GithubLogoIcon className="h-6 w-6" />
                    </Link>
                  </li>
                )}
                {x_url && (
                  <li>
                    <Link
                      to={x_url}
                      target="_blank"
                      className="text-gray-500 hover:text-gray-900"
                    >
                      <XLogoIcon className="h-6 w-6" />
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TeamMembers;

export const schema = createSchema({
  type: "our-team-members",
  title: "Members",
  settings: [],
});
