"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  head: string;
  head_n: string | null;
  geminiOrder: string | null;
}

interface SidebarNavProps {
  sections: Section[];
  activeSectionId?: string;
  onSectionClick?: (sectionId: string) => void;
  className?: string;
}

export default function SidebarNav({
  sections,
  activeSectionId,
  onSectionClick,
  className,
}: SidebarNavProps) {
  const handleSectionClick = (sectionId: string) => {
    if (onSectionClick) {
      onSectionClick(sectionId);
    }
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Group sections hierarchically
  const groupSections = (sections: Section[]) => {
    const hierarchy: Record<
      string,
      {
        section: Section;
        subsections: Record<
          string,
          {
            section: Section;
            subsections: Section[];
          }
        >;
      }
    > = {};

    sections.forEach((section) => {
      if (!section.head_n) return;

      const parts = section.head_n.split(".");

      if (parts.length === 1) {
        // Main section
        if (!hierarchy[parts[0]]) {
          hierarchy[parts[0]] = {
            section,
            subsections: {},
          };
        }
      } else if (parts.length === 2) {
        // Subsection
        const [main, sub] = parts;
        if (!hierarchy[main]) {
          hierarchy[main] = {
            section: sections.find((s) => s.head_n === main) || section,
            subsections: {},
          };
        }
        if (!hierarchy[main].subsections[sub]) {
          hierarchy[main].subsections[sub] = {
            section,
            subsections: [],
          };
        }
      } else if (parts.length === 3) {
        // Sub-subsection
        const [main, sub] = parts;
        if (!hierarchy[main]?.subsections[sub]) {
          hierarchy[main] = hierarchy[main] || {
            section: sections.find((s) => s.head_n === main) || section,
            subsections: {},
          };
          hierarchy[main].subsections[sub] = {
            section:
              sections.find((s) => s.head_n === `${main}.${sub}`) || section,
            subsections: [],
          };
        }
        hierarchy[main].subsections[sub].subsections.push(section);
      }
    });

    return hierarchy;
  };

  const hierarchy = groupSections(sections);

  return (
    <Sidebar className={cn("w-[22rem] ", className)}>
      <SidebarContent className="bg-background p-[1rem]">
        <SidebarMenu>
          {Object.entries(hierarchy).map(
            ([mainNumber, { section: mainSection, subsections }]) => {
              const hasSubsections = Object.keys(subsections).length > 0;

              return hasSubsections ? (
                <Collapsible
                  key={mainNumber}
                  defaultOpen
                  className="group/main"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        asChild
                        isActive={activeSectionId === mainSection.id}
                      >
                        <button className="flex items-center justify-between w-full px-6 py-2">
                          <span className="text-sm font-medium">
                            {mainSection.head_n} {mainSection.head}
                          </span>
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/main:rotate-180" />
                        </button>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {Object.entries(subsections).map(
                          ([
                            subNumber,
                            {
                              section: subSection,
                              subsections: subSubsections,
                            },
                          ]) => {
                            const hasSubSubsections = subSubsections.length > 0;

                            return hasSubSubsections ? (
                              <Collapsible
                                key={subNumber}
                                defaultOpen
                                className="group/sub"
                              >
                                <SidebarMenuSubItem>
                                  <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                      asChild
                                      isActive={
                                        activeSectionId === subSection.id
                                      }
                                    >
                                      <button
                                        onClick={() =>
                                          handleSectionClick(subSection.id)
                                        }
                                        className="flex items-center justify-between w-full pl-8 pr-6 py-2"
                                      >
                                        <span className="text-sm">
                                          {subSection.head_n} {subSection.head}
                                        </span>
                                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/sub:rotate-180" />
                                      </button>
                                    </SidebarMenuButton>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <SidebarMenuSub>
                                      {subSubsections.map((subSubSection) => (
                                        <SidebarMenuSubItem
                                          key={subSubSection.id}
                                        >
                                          <SidebarMenuButton
                                            asChild
                                            isActive={
                                              activeSectionId ===
                                              subSubSection.id
                                            }
                                          >
                                            <button
                                              onClick={() =>
                                                handleSectionClick(
                                                  subSubSection.id
                                                )
                                              }
                                              className="w-full text-left py-2 pl-10 pr-6 text-sm"
                                            >
                                              {subSubSection.head_n}{" "}
                                              {subSubSection.head}
                                            </button>
                                          </SidebarMenuButton>
                                        </SidebarMenuSubItem>
                                      ))}
                                    </SidebarMenuSub>
                                  </CollapsibleContent>
                                </SidebarMenuSubItem>
                              </Collapsible>
                            ) : (
                              <SidebarMenuSubItem key={subNumber}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={activeSectionId === subSection.id}
                                >
                                  <button
                                    onClick={() =>
                                      handleSectionClick(subSection.id)
                                    }
                                    className="w-full text-left py-2 pl-8 pr-6 text-sm"
                                  >
                                    {subSection.head_n} {subSection.head}
                                  </button>
                                </SidebarMenuButton>
                              </SidebarMenuSubItem>
                            );
                          }
                        )}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={mainNumber}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeSectionId === mainSection.id}
                  >
                    <button
                      onClick={() => handleSectionClick(mainSection.id)}
                      className="w-full text-left px-6 py-2 text-sm font-medium"
                    >
                      {mainSection.head_n} {mainSection.head}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }
          )}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
