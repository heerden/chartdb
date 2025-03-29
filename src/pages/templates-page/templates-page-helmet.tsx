import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HOST_URL } from '@/lib/env';

export interface TemplatesPageHelmetProps {
    tag?: string;
    isFeatured: boolean;
}

const CHARTDB_HOST_URL = 'https://db.pfd.io';
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
                <title>{`PFDDB - ${tag} database schema diagram templates`}</title>
            ) : isFeatured ? (
                <title>
                    PFDDB - Featured database schema diagram templates
                </title>
            ) : (
                <title>PFDDB - Database schema diagram templates</title>
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
                    content={`PFDDB - ${tag} database schema diagram templates`}
                />
            ) : isFeatured ? (
                <meta
                    property="og:title"
                    content="PFDDB - Featured database schema diagram templates"
                />
            ) : (
                <meta
                    property="og:title"
                    content="PFDDB - Database schema diagram templates"
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
                content="https://github.com/heerden/pfddb/raw/fork/public/pfddb.png"
            />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="PFDDB" />

            {tag ? (
                <meta
                    name="twitter:title"
                    content={`PFDDB - ${tag} database schema diagram templates`}
                />
            ) : (
                <meta
                    name="twitter:title"
                    content="PFDDB - Database schema diagram templates"
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
                content="https://github.com/heerden/pfddb/raw/fork/public/pfddb.png"
            />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@PFDIO" />
            <meta name="twitter:creator" content="@PFDIO" />
        </Helmet>
    );
};
