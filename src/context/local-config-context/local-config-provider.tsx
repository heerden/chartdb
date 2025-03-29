import React, { useEffect } from 'react';
import type { SchemasFilter, ScrollAction } from './local-config-context';
import { LocalConfigContext } from './local-config-context';
import type { Theme } from '../theme-context/theme-context';

const themeKey = 'theme';
const scrollActionKey = 'scroll_action';
const schemasFilterKey = 'schemas_filter';
const showCardinalityKey = 'show_cardinality';
const hideMultiSchemaNotificationKey = 'hide_multi_schema_notification';
const githubRepoOpenedKey = 'github_repo_opened';
const showDependenciesOnCanvasKey = 'show_dependencies_on_canvas';
const showMiniMapOnCanvasKey = 'show_minimap_on_canvas';

export const LocalConfigProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [theme, setTheme] = React.useState<Theme>(
        (localStorage.getItem(themeKey) as Theme) || 'system'
    );

    const [scrollAction, setScrollAction] = React.useState<ScrollAction>(
        (localStorage.getItem(scrollActionKey) as ScrollAction) || 'pan'
    );

    const [schemasFilter, setSchemasFilter] = React.useState<SchemasFilter>(
        JSON.parse(
            localStorage.getItem(schemasFilterKey) || '{}'
        ) as SchemasFilter
    );

    const [showCardinality, setShowCardinality] = React.useState<boolean>(
        (localStorage.getItem(showCardinalityKey) || 'true') === 'true'
    );

    const [hideMultiSchemaNotification, setHideMultiSchemaNotification] =
        React.useState<boolean>(
            (localStorage.getItem(hideMultiSchemaNotificationKey) ||
                'false') === 'true'
        );

    const [githubRepoOpened, setGithubRepoOpened] = React.useState<boolean>(
        (localStorage.getItem(githubRepoOpenedKey) || 'false') === 'true'
    );

    const [showDependenciesOnCanvas, setShowDependenciesOnCanvas] =
        React.useState<boolean>(
            (localStorage.getItem(showDependenciesOnCanvasKey) || 'false') ===
                'true'
        );

    const [showMiniMapOnCanvas, setShowMiniMapOnCanvas] =
        React.useState<boolean>(
            (localStorage.getItem(showMiniMapOnCanvasKey) || 'true') === 'true'
        );

    useEffect(() => {
        localStorage.setItem(githubRepoOpenedKey, githubRepoOpened.toString());
    }, [githubRepoOpened]);

    useEffect(() => {
        localStorage.setItem(
            hideMultiSchemaNotificationKey,
            hideMultiSchemaNotification.toString()
        );
    }, [hideMultiSchemaNotification]);

    useEffect(() => {
        localStorage.setItem(themeKey, theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem(scrollActionKey, scrollAction);
    }, [scrollAction]);

    useEffect(() => {
        localStorage.setItem(schemasFilterKey, JSON.stringify(schemasFilter));
    }, [schemasFilter]);

    useEffect(() => {
        localStorage.setItem(showCardinalityKey, showCardinality.toString());
    }, [showCardinality]);

    useEffect(() => {
        localStorage.setItem(
            showDependenciesOnCanvasKey,
            showDependenciesOnCanvas.toString()
        );
    }, [showDependenciesOnCanvas]);

    useEffect(() => {
        localStorage.setItem(
            showMiniMapOnCanvasKey,
            showMiniMapOnCanvas.toString()
        );
    }, [showMiniMapOnCanvas]);

    return (
        <LocalConfigContext.Provider
            value={{
                theme,
                setTheme,
                scrollAction,
                setScrollAction,
                schemasFilter,
                setSchemasFilter,
                showCardinality,
                setShowCardinality,
                hideMultiSchemaNotification,
                setHideMultiSchemaNotification,
                setGithubRepoOpened,
                githubRepoOpened,
                showDependenciesOnCanvas,
                setShowDependenciesOnCanvas,
                showMiniMapOnCanvas,
                setShowMiniMapOnCanvas,
            }}
        >
            {children}
        </LocalConfigContext.Provider>
    );
};
