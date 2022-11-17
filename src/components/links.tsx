import { LinkType } from "../types/link";

export interface LinksProps {
    links: LinkType[],
    target?: string
}

export const Links = ({ links, target }: LinksProps) => {
    const linkTarget = target ? target : "_self";
    return (
        <div>
            {links.map(link => (
                <span key={link.id}>
                    <a href={link.link} target={linkTarget}>
                        {link.description}
                    </a><br />
                </span>
            ))}
        </div>
    )
}

