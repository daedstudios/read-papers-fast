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
import { ChevronDown, Icon, Loader2, Menu, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useState, useEffect } from "react";

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
  id?: string; // Added optional id prop
}

export default function SidebarNav({
  sections,
  activeSectionId,
  onSectionClick,
  className,
  id,
}: SidebarNavProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sections && sections.length > 0) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [sections]);

  const handleSectionClick = (sectionId: string) => {
    if (onSectionClick) {
      onSectionClick(sectionId);
    }
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  // Group sections hierarchically based on geminiOrder
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

    // First, sort sections by their geminiOrder
    const sortedSections = [...sections].sort((a, b) => {
      // Handle null geminiOrder values
      if (!a.geminiOrder) return 1;
      if (!b.geminiOrder) return -1;

      // Convert to numeric parts for proper sorting (e.g., "10.1" should come after "2.3")
      const aParts = a.geminiOrder.split(".").map(Number);
      const bParts = b.geminiOrder.split(".").map(Number);

      // Compare first level
      if (aParts[0] !== bParts[0]) {
        return aParts[0] - bParts[0];
      }

      // Compare second level if first is equal
      if (aParts.length > 1 && bParts.length > 1) {
        return aParts[1] - bParts[1];
      }

      // If one has a second level and the other doesn't
      return aParts.length - bParts.length;
    });

    sortedSections.forEach((section) => {
      if (!section.geminiOrder) return; // Skip if no geminiOrder

      const parts = section.geminiOrder.split(".");

      if (parts.length === 1) {
        // Main section (e.g., "1", "2", "3")
        if (!hierarchy[parts[0]]) {
          hierarchy[parts[0]] = {
            section,
            subsections: {},
          };
        }
      } else if (parts.length === 2) {
        // Subsection (e.g., "1.1", "2.3")
        const [main, sub] = parts;
        if (!hierarchy[main]) {
          // Create a placeholder for the main section if it doesn't exist
          const mainSection = sortedSections.find(
            (s) => s.geminiOrder === main
          );
          hierarchy[main] = {
            section: mainSection || section, // Use the main section if found, otherwise use this one
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
        // Sub-subsection (e.g., "1.1.1", "2.3.4")
        const [main, sub, subSub] = parts;

        // Ensure main section exists
        if (!hierarchy[main]) {
          const mainSection = sortedSections.find(
            (s) => s.geminiOrder === main
          );
          hierarchy[main] = {
            section: mainSection || section,
            subsections: {},
          };
        }

        // Ensure subsection exists
        const mainSubKey = `${main}.${sub}`;
        if (!hierarchy[main].subsections[sub]) {
          const subSection = sortedSections.find(
            (s) => s.geminiOrder === mainSubKey
          );
          hierarchy[main].subsections[sub] = {
            section: subSection || section,
            subsections: [],
          };
        }

        // Add the sub-subsection to its parent
        hierarchy[main].subsections[sub].subsections.push(section);
      }
    });

    return hierarchy;
  };

  const hierarchy = groupSections(sections);

  return (
    <Collapsible
      className="relative border-t border-r overflow-clip"
      defaultOpen
    >
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
          {" "}
          <SidebarContent className="bg-background text-[1rem] overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <p className="text-muted-foreground text-sm">
                  Loading paper structure...
                </p>
              </div>
            ) : (
              <SidebarMenu>
                {Object.entries(hierarchy).map(
                  ([mainNumber, { section: mainSection, subsections }]) => {
                    const hasSubsections = Object.keys(subsections).length > 0;

                    return hasSubsections ? (
                      <Collapsible
                        key={mainNumber}
                        defaultOpen={false}
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
                                  {mainSection.geminiOrder} {mainSection.head}
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
                                      defaultOpen={false}
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
                                              activeSectionId ===
                                                subSection.id &&
                                                "!bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent",
                                              "bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                                            )}
                                          >
                                            <button
                                              onClick={() =>
                                                handleSectionClick(
                                                  subSection.id
                                                )
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
                                                {subSection.geminiOrder}{" "}
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
                                              activeSectionId ===
                                                subSection.id &&
                                                "text-foreground"
                                            )}
                                          >
                                            {subSection.geminiOrder}{" "}
                                            {subSection.head}
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
                              {mainSection.geminiOrder} {mainSection.head}
                            </span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }
                )}
                <SidebarMenuItem key="figures-section">
                  <SidebarMenuButton
                    asChild
                    isActive={activeSectionId === "figures-section"}
                    className={cn(
                      activeSectionId === "figures-section" &&
                        "!bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent",
                      "bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                    )}
                  >
                    <button
                      onClick={() => handleSectionClick("figures-section")}
                      className="w-full text-left py-2 text-[1rem] hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group"
                    >
                      <span
                        className={cn(
                          "truncate overflow-hidden whitespace-nowrap w-full block text-muted-foreground",
                          activeSectionId === "figures-section" &&
                            "text-foreground"
                        )}
                      >
                        Figures
                      </span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem key="references-section">
                  <SidebarMenuButton
                    asChild
                    isActive={activeSectionId === "references-section"}
                    className={cn(
                      activeSectionId === "references-section" &&
                        "!bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent",
                      "bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                    )}
                  >
                    <button
                      onClick={() => handleSectionClick("references-section")}
                      className="w-full text-left py-2 text-[1rem] hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group"
                    >
                      <span
                        className={cn(
                          "truncate overflow-hidden whitespace-nowrap w-full block text-muted-foreground",
                          activeSectionId === "references-section" &&
                            "text-foreground"
                        )}
                      >
                        References
                      </span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem key="paper-notes">
                  <SidebarMenuButton
                    asChild
                    isActive={activeSectionId === "paper-notes"}
                    className={cn(
                      activeSectionId === "paper-notes" &&
                        "!bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent",
                      "bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                    )}
                  >
                    <button
                      onClick={() => handleSectionClick("paper-notes")}
                      className="w-full text-left py-2 text-[1rem] hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group"
                    >
                      <span
                        className={cn(
                          "truncate overflow-hidden whitespace-nowrap w-full block text-muted-foreground",
                          activeSectionId === "paper-notes" && "text-foreground"
                        )}
                      >
                        Paper Notes
                      </span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>{" "}
              </SidebarMenu>
            )}
          </SidebarContent>
        </Sidebar>
      </CollapsibleContent>
    </Collapsible>
  );
}
