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
import { ChevronDown, Icon, Menu, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@radix-ui/react-scroll-area";

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
    <Collapsible className="relative border-t border-r overflow-clip">
      <CollapsibleTrigger asChild>
        <button className="fixed top-[5rem] cursor-pointer left-[1rem] z-30 bg-black rounded-sm p-2 shadow hover:bg-neutral-800 transition focus:outline-none">
          <PanelLeft className="h-4 w-4 text-white" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Sidebar
          collapsible="icon"
          className={cn(
            "w-[22rem] text-[1rem] border-none p-[1rem]",
            className
          )}
        >
          <SidebarContent className="bg-background text-[1rem] overflow-hidden">
            <SidebarMenu>
              {Object.entries(hierarchy).map(
                ([mainNumber, { section: mainSection, subsections }]) => {
                  const hasSubsections = Object.keys(subsections).length > 0;

                  return hasSubsections ? (
                    <Collapsible
                      key={mainNumber}
                      defaultOpen
                      className="group/main text-[1rem]"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={activeSectionId === mainSection.id}
                            className={cn(
                              activeSectionId === mainSection.id &&
                                "!bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent",
                              "bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                            )}
                          >
                            <button className="flex items-center justify-between w-full hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group">
                              <span
                                className={cn(
                                  "truncate text-[1rem] overflow-hidden whitespace-nowrap w-[calc(100%-2rem)] text-muted-foreground ",
                                  activeSectionId === mainSection.id &&
                                    "text-foreground"
                                )}
                              >
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
                                const hasSubSubsections =
                                  subSubsections.length > 0;

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
                                          className={cn(
                                            activeSectionId === subSection.id &&
                                              "!bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent",
                                            "bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                                          )}
                                        >
                                          <button
                                            onClick={() =>
                                              handleSectionClick(subSection.id)
                                            }
                                            className="flex items-center justify-between w-full text-[1rem] pl-[1rem] pr-6 py-2 hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group"
                                          >
                                            <span
                                              className={cn(
                                                "truncate overflow-hidden whitespace-nowrap w-[calc(100%-2rem)] text-muted-foreground ",
                                                activeSectionId ===
                                                  subSection.id &&
                                                  "text-foreground"
                                              )}
                                            >
                                              {subSection.head_n}{" "}
                                              {subSection.head}
                                            </span>
                                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/sub:rotate-180" />
                                          </button>
                                        </SidebarMenuButton>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <SidebarMenuSub>
                                          {subSubsections.map(
                                            (subSubSection) => (
                                              <SidebarMenuSubItem
                                                key={subSubSection.id}
                                              >
                                                <SidebarMenuButton
                                                  asChild
                                                  isActive={
                                                    activeSectionId ===
                                                    subSubSection.id
                                                  }
                                                  className={cn(
                                                    activeSectionId ===
                                                      subSubSection.id &&
                                                      "!bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent",
                                                    "bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                                                  )}
                                                >
                                                  <button
                                                    onClick={() =>
                                                      handleSectionClick(
                                                        subSubSection.id
                                                      )
                                                    }
                                                    className="w-full text-left py-2 pl-[1rem] text-[1rem] text-muted-foreground hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group"
                                                  >
                                                    <span
                                                      className={cn(
                                                        "truncate overflow-hidden whitespace-nowrap w-full block text-muted-foreground ",
                                                        activeSectionId ===
                                                          subSubSection.id &&
                                                          "text-foreground"
                                                      )}
                                                    >
                                                      {subSubSection.head_n}{" "}
                                                      {subSubSection.head}
                                                    </span>
                                                  </button>
                                                </SidebarMenuButton>
                                              </SidebarMenuSubItem>
                                            )
                                          )}
                                        </SidebarMenuSub>
                                      </CollapsibleContent>
                                    </SidebarMenuSubItem>
                                  </Collapsible>
                                ) : (
                                  <SidebarMenuSubItem key={subNumber}>
                                    <SidebarMenuButton
                                      asChild
                                      isActive={
                                        activeSectionId === subSection.id
                                      }
                                      className={cn(
                                        activeSectionId === subSection.id &&
                                          "!bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent",
                                        "bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                                      )}
                                    >
                                      <button
                                        onClick={() =>
                                          handleSectionClick(subSection.id)
                                        }
                                        className="w-full text-left py-2 pl-[1rem] pr-6 text-[1rem] hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group"
                                      >
                                        <span
                                          className={cn(
                                            "truncate overflow-hidden whitespace-nowrap w-full block text-muted-foreground ",
                                            activeSectionId === subSection.id &&
                                              "text-foreground"
                                          )}
                                        >
                                          {subSection.head_n} {subSection.head}
                                        </span>
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
                        className={cn(
                          activeSectionId === mainSection.id &&
                            "!bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent",
                          "bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                        )}
                      >
                        <button
                          onClick={() => handleSectionClick(mainSection.id)}
                          className="w-full text-left py-2 text-[1rem] hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group"
                        >
                          <span
                            className={cn(
                              "truncate overflow-hidden whitespace-nowrap w-full block text-muted-foreground ",
                              activeSectionId === mainSection.id &&
                                "text-foreground"
                            )}
                          >
                            {mainSection.head_n} {mainSection.head}
                          </span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
              )}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </CollapsibleContent>
    </Collapsible>
  );
}
