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
import { ChevronDown, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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
  // id: string;
  className?: string;
  id?: string; // Added optional id prop
}

const sortSectionsByOrder = (sections: Section[]) => {
  return [...sections].sort((a, b) => {
    if (!a.geminiOrder) return 1;
    if (!b.geminiOrder) return -1;

    const aParts = a.geminiOrder.split(".").map(Number);
    const bParts = b.geminiOrder.split(".").map(Number);

    if (aParts[0] !== bParts[0]) {
      return aParts[0] - bParts[0];
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
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                <span className="ml-2 text-sm text-gray-500">
                  Loading sections...
                </span>
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-red-500">{error}</div>
            ) : (
              <SidebarMenu>
                {Object.entries(hierarchy).map(
                  ([mainNumber, { section: mainSection, subsections }]) => {
                    const hasSubsections = Object.keys(subsections).length > 0;

                    if (!hasSubsections) {
                      return (
                        <SidebarMenuItem key={mainNumber}>
                          <SidebarMenuButton
                            asChild
                            className="bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                          >
                            <a
                              href={`#${mainSection.id}`}
                              className="w-full text-left py-2 text-[1rem] hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group"
                            >
                              <span className="truncate overflow-hidden whitespace-nowrap w-full block text-muted-foreground">
                                {mainSection.geminiOrder} {mainSection.head}
                              </span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <Collapsible
                        key={mainNumber}
                        defaultOpen={false}
                        className="group/main text-[1rem]"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              asChild
                              className="bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                            >
                              <a
                                href={`#${mainSection.id}`}
                                className="flex items-center justify-between w-full hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group"
                              >
                                <span className="truncate text-[1rem] overflow-hidden whitespace-nowrap w-[calc(100%-2rem)] text-muted-foreground">
                                  {mainSection.geminiOrder} {mainSection.head}
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/main:rotate-180" />
                              </a>
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
                                  const hasSubSubSections =
                                    subSubsections.length > 0;

                                  if (!hasSubSubSections) {
                                    return (
                                      <SidebarMenuSubItem key={subNumber}>
                                        <SidebarMenuButton
                                          asChild
                                          className="bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                                        >
                                          <a
                                            href={`#${subSection.id}`}
                                            className="w-full text-left py-2 pl-[1rem] pr-6 text-[1rem] hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group"
                                          >
                                            <span className="truncate overflow-hidden whitespace-nowrap w-full block text-muted-foreground">
                                              {subSection.geminiOrder}{" "}
                                              {subSection.head}
                                            </span>
                                          </a>
                                        </SidebarMenuButton>
                                      </SidebarMenuSubItem>
                                    );
                                  }

                                  return (
                                    <Collapsible
                                      key={subNumber}
                                      defaultOpen={false}
                                      className="group/sub"
                                    >
                                      <SidebarMenuSubItem>
                                        <CollapsibleTrigger asChild>
                                          <SidebarMenuButton
                                            asChild
                                            className="bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                                          >
                                            <a
                                              href={`#${subSection.id}`}
                                              className="flex items-center justify-between w-full text-[1rem] pl-[1rem] pr-6 py-2 hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group"
                                            >
                                              <span className="truncate overflow-hidden whitespace-nowrap w-[calc(100%-2rem)] text-muted-foreground">
                                                {subSection.geminiOrder}{" "}
                                                {subSection.head}
                                              </span>
                                              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/sub:rotate-180" />
                                            </a>
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
                                                    className="bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                                                  >
                                                    <a
                                                      href={`#${subSubSection.id}`}
                                                      className="w-full text-left py-2 pl-[1rem] text-[1rem] hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group"
                                                    >
                                                      <span className="truncate overflow-hidden whitespace-nowrap w-full block text-muted-foreground">
                                                        {
                                                          subSubSection.geminiOrder
                                                        }{" "}
                                                        {subSubSection.head}
                                                      </span>
                                                    </a>
                                                  </SidebarMenuButton>
                                                </SidebarMenuSubItem>
                                              )
                                            )}
                                          </SidebarMenuSub>
                                        </CollapsibleContent>
                                      </SidebarMenuSubItem>
                                    </Collapsible>
                                  );
                                }
                              )}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }
                )}

                {/* Static menu items */}
                <SidebarMenuItem key="figures-section">
                  <SidebarMenuButton
                    asChild
                    className="bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                  >
                    <a
                      href="#figures-section"
                      className="w-full text-left py-2 text-[1rem] hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group"
                    >
                      <span className="truncate overflow-hidden whitespace-nowrap w-full block text-muted-foreground">
                        Figures
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem key="references-section">
                  <SidebarMenuButton
                    asChild
                    className="bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                  >
                    <a
                      href="#references-section"
                      className="w-full text-left py-2 text-[1rem] hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group"
                    >
                      <span className="truncate overflow-hidden whitespace-nowrap w-full block text-muted-foreground">
                        References
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem key="paper-notes">
                  <SidebarMenuButton
                    asChild
                    className="bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                  >
                    <a
                      href="#paper-notes"
                      className="w-full text-left py-2 text-[1rem] hover:bg-transparent active:bg-transparent focus:bg-transparent bg-transparent group"
                    >
                      <span className="truncate overflow-hidden whitespace-nowrap w-full block text-muted-foreground">
                        Paper Notes
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </SidebarContent>
        </Sidebar>
      </CollapsibleContent>
    </Collapsible>
  );
}
