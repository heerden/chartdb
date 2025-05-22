import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HOST_URL } from '@/lib/env';

export interface TemplatesPageHelmetProps {
    tag?: string;
    isFeatured: boolean;
}

const CHARTDB_HOST_URL = 'https://db.virelyn.com';
export const TemplatesPageHelmet: React.FC<TemplatesPageHelmetProps> = ({
    tag,
    isFeatured,
}) => {
    const { tag: tagParam } = useParams<{ tag: string }>();

    const formattedUrlTag = useMemo(
        () => tag?.toLowerCase().replace(/ /g, '-'),
        [tag]
    );

    const canonicalUrl = useMemo(() => {
        let suffix = '/templates';
        if (formattedUrlTag) {
            suffix += `/tags/${formattedUrlTag}`;
        } else if (isFeatured) {
            suffix += '/featured';
        }

        return `${CHARTDB_HOST_URL}${suffix}`;
    }, [isFeatured, formattedUrlTag]);

    const needCanonical =
        HOST_URL !== CHARTDB_HOST_URL || (tag && formattedUrlTag !== tagParam);

    return (
        <Helmet>
            {needCanonical ? (
                <link rel="canonical" href={canonicalUrl} />
            ) : null}

            {tag ? (
                <title>{`Virelyn - ${tag} database schema diagram templates`}</title>
            ) : isFeatured ? (
                <title>
                    Virelyn - Featured database schema diagram templates
                </title>
            ) : (
                <title>Virelyn - Database schema diagram templates</title>
            )}

            {tag ? (
                <meta
                    name="description"
                    content={`Discover a collection of real-world database schema diagrams for ${tag}, featuring example applications and popular open-source projects.`}
                />
            ) : (
                <meta
                    name="description"
                    content="Discover a collection of real-world database schema diagrams, featuring example applications and popular open-source projects."
                />
            )}

            {tag ? (
                <meta
                    property="og:title"
                    content={`Virelyn - ${tag} database schema diagram templates`}
                />
            ) : isFeatured ? (
                <meta
                    property="og:title"
                    content="Virelyn - Featured database schema diagram templates"
                />
            ) : (
                <meta
                    property="og:title"
                    content="Virelyn - Database schema diagram templates"
                />
            )}

            {tag ? (
                <meta
                    property="og:url"
                    content={`${HOST_URL}/templates/${tagParam}`}
                />
            ) : isFeatured ? (
                <meta
                    property="og:url"
                    content={`${HOST_URL}/templates/featured`}
                />
            ) : (
                <meta property="og:url" content={`${HOST_URL}/templates`} />
            )}

            {tag ? (
                <meta
                    property="og:description"
                    content={`Discover a collection of real-world database schema diagrams for ${tag}, featuring example applications and popular open-source projects.`}
                />
            ) : (
                <meta
                    property="og:description"
                    content="Discover a collection of real-world database schema diagrams, featuring example applications and popular open-source projects."
                />
            )}
            <meta
                property="og:image"
                content="https://github.com/heerden/chartdb/raw/fork/public/virelyn.png"
            />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="Virelyn" />

            {tag ? (
                <meta
                    name="twitter:title"
                    content={`Virelyn - ${tag} database schema diagram templates`}
                />
            ) : (
                <meta
                    name="twitter:title"
                    content="Virelyn - Database schema diagram templates"
                />
            )}

            {tag ? (
                <meta
                    name="twitter:description"
                    content={`Discover a collection of real-world database schema diagrams for ${tag}, featuring example applications and popular open-source projects.`}
                />
            ) : (
                <meta
                    name="twitter:description"
                    content="Discover a collection of real-world database schema diagrams, featuring example applications and popular open-source projects."
                />
            )}

            <meta
                name="twitter:image"
                content="https://github.com/heerden/virelyn/raw/fork/public/virelyn.png"
            />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@PFDIO" />
            <meta name="twitter:creator" content="@PFDIO" />
        </Helmet>
    );
};
