"use client";
import {
  Sidebar,
  SidebarContent,
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
  head: string | null;
  head_n: string | null;
  geminiOrder: string | null;
}

interface SectionHierarchy {
  section: Section;
  subsections: Record<
    string,
    {
      section: Section;
      subsections: Section[];
    }
  >;
}

interface SidebarNavProps {
  id: string;
  className?: string;
}

export default function SidebarNav({
  sections,
  activeSectionId,
  onSectionClick,
  className,
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

    if (aParts.length > 1 && bParts.length > 1) {
      return aParts[1] - bParts[1];
    }

    return aParts.length - bParts.length;
  });
};

const buildSectionHierarchy = (sections: Section[]) => {
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

  const sortedSections = sortSectionsByOrder(sections);

  sortedSections.forEach((section) => {
    if (!section.geminiOrder) return;

    const parts = section.geminiOrder.split(".");
    const [main, sub, subSub] = parts;

    // Handle level 1 sections
    if (parts.length === 1) {
      if (!hierarchy[main]) {
        hierarchy[main] = { section, subsections: {} };
      }
      return;
    }

    // Ensure main section exists for levels 2 and 3
    if (!hierarchy[main]) {
      const mainSection = sortedSections.find((s) => s.geminiOrder === main);
      hierarchy[main] = {
        section: mainSection || section,
        subsections: {},
      };
    }

    // Handle level 2 sections
    if (parts.length === 2) {
      if (!hierarchy[main].subsections[sub]) {
        hierarchy[main].subsections[sub] = { section, subsections: [] };
      }
      return;
    }

    // Handle level 3 sections
    if (parts.length === 3) {
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
      hierarchy[main].subsections[sub].subsections.push(section);
    }
  });

  return hierarchy;
};

export default function SidebarNav({ id, className }: SidebarNavProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/paper-data/sidebar?id=${id}`);

        if (!response.ok) {
          throw new Error(
            `Error fetching sidebar data: ${response.statusText}`
          );
        }

        const data = await response.json();
        setSections(data.grobidContent);
      } catch (err) {
        console.error("Failed to fetch sidebar data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load sidebar data"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSections();
    }
  }, [id]);

  // Build hierarchy after data is fetched
  const hierarchy = buildSectionHierarchy(sections);
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
