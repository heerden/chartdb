import React from 'react';
import { Helmet } from 'react-helmet-async';

export const HelmetData: React.FC = () => (
    <Helmet>
        <meta
            name="description"
            content="From your CI pipeline, create a visual database schema, editable and ready to evolve"
        />
        <meta property="og:type" content="website" />
        <meta
            property="og:title"
            content="Virelyn - From your CI pipeline, create a visual database schema, editable and ready to evolve"
        />
        <meta
            property="og:description"
            content="From your CI pipeline, create a visual database schema, editable and ready to evolve"
        />
        <meta
            property="og:image"
            content="https://github.com/heerden/chartdb/raw/fork/public/virelyn.png"
        />
        <meta property="og:url" content="https://db.virelyn.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
            name="twitter:title"
            content="From your CI pipeline, create a visual database schema, editable and ready to evolve"
        />
        <meta
            name="twitter:description"
            content="From your CI pipeline, create a visual database schema, editable and ready to evolve"
        />
        <meta
            name="twitter:image"
            content="https://github.com/heerden/chartdb/raw/fork/public/virelyn.png"
        />
        <title>
            Virelyn - From your CI pipeline, create a visual database schema,
            editable and ready to evolve
        </title>
    </Helmet>
);
