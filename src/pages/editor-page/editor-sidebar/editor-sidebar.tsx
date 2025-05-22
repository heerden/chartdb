import React, { useMemo } from 'react';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/sidebar/sidebar';
import { SquareStack, Table, Workflow } from 'lucide-react';
import { useLayout } from '@/hooks/use-layout';
import { useTranslation } from 'react-i18next';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import ChartDBLogo from '@/assets/logo-light.png';
import ChartDBDarkLogo from '@/assets/logo-dark.png';
import { useTheme } from '@/hooks/use-theme';
import { useChartDB } from '@/hooks/use-chartdb';

export interface SidebarItem {
    title: string;
    icon: React.FC;
    onClick: () => void;
    active: boolean;
    badge?: string;
}

export interface EditorSidebarProps {}

export const EditorSidebar: React.FC<EditorSidebarProps> = () => {
    const { selectSidebarSection, selectedSidebarSection, showSidePanel } =
        useLayout();
    const { t } = useTranslation();
    const { isMd: isDesktop } = useBreakpoint('md');
    const { effectiveTheme } = useTheme();
    const { dependencies } = useChartDB();

    const items: SidebarItem[] = useMemo(() => {
        const baseItems = [
            {
                title: t('side_panel.tables_section.tables'),
                icon: Table,
                onClick: () => {
                    showSidePanel();
                    selectSidebarSection('tables');
                },
                active: selectedSidebarSection === 'tables',
            },
            {
                title: t('side_panel.relationships_section.relationships'),
                icon: Workflow,
                onClick: () => {
                    showSidePanel();
                    selectSidebarSection('relationships');
                },
                active: selectedSidebarSection === 'relationships',
            },
            {
                title: t('side_panel.areas_section.areas'),
                icon: Group,
                onClick: () => {
                    showSidePanel();
                    selectSidebarSection('areas');
                },
                active: selectedSidebarSection === 'areas',
            },
        ];

        if (dependencies && dependencies.length > 0) {
            baseItems.splice(2, 0, {
                title: t('side_panel.dependencies_section.dependencies'),
                icon: SquareStack,
                onClick: () => {
                    showSidePanel();
                    selectSidebarSection('dependencies');
                },
                active: selectedSidebarSection === 'dependencies',
            });
        }

        return baseItems;
    }, [
        selectSidebarSection,
        selectedSidebarSection,
        t,
        showSidePanel,
        dependencies,
    ]);

    return (
        <Sidebar
            side="left"
            collapsible="icon"
            variant="sidebar"
            className="relative h-full"
        >
            {!isDesktop ? (
                <SidebarHeader>
                    <a
                        href="https://chartdb.io"
                        className="cursor-pointer"
                        rel="noreferrer"
                    >
                        <img
                            src={
                                effectiveTheme === 'light'
                                    ? ChartDBLogo
                                    : ChartDBDarkLogo
                            }
                            alt="chartDB"
                            className="h-4 max-w-fit"
                        />
                    </a>
                </SidebarHeader>
            ) : null}
            <SidebarContent>
                <SidebarGroup>
                    {/* <SidebarGroupLabel /> */}
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        className="hover:bg-gray-200 data-[active=true]:bg-gray-100 data-[active=true]:text-sky-950 data-[active=true]:hover:bg-pink-100 dark:hover:bg-gray-800 dark:data-[active=true]:bg-gray-900 dark:data-[active=true]:text-pink-400 dark:data-[active=true]:hover:bg-pink-950"
                                        isActive={item.active}
                                        asChild
                                        tooltip={item.title}
                                    >
                                        <button onClick={item.onClick}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </button>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
};
