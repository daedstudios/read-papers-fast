"use client";

import { useState, useRef } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ChevronUp } from "lucide-react";

type PhoneDrawerProps = {
  paperSummary: {
    grobidContent: { id: string; head_n: string; head: string }[];
  };
  activeSectionId?: string;
};

export default function PhoneDrawer({
  paperSummary,
  activeSectionId,
}: PhoneDrawerProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <div className="fixed bottom-0 items-start h-[4.5rem] left-0 w-full z-50 flex bg-transparent  justify-start md:hidden px-[1rem]">
          <Button className="flex flex-row justify-between hover:bg-muted text-foreground bg-background w-auto h-auto border rounded-[2rem] text-[1rem] cursor-pointer">
            Menu
            <ChevronUp />
          </Button>
        </div>
      </DrawerTrigger>

      <DrawerContent className="fixed rounded-t-[1rem] bottom-0 left-0 w-full h-[70%] bg-background z-50 px-[1rem]">
        <div className="w-full h-full pt-[1rem]">
          <ScrollArea className="h-full w-full" ref={menuRef}>
            <div className="w-full">
              <div className="relative space-y-1 w-full pb-[4rem]">
                {paperSummary?.grobidContent?.map((section) => (
                  <div key={section.id} className="list-none space-y-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(section.id)?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                        setOpen(false);
                      }}
                      className={
                        "w-full bg-transparent hover:text-foreground text-muted-foreground hover:bg-transparent cursor-pointer p-2 text-left truncate text-wrap text-[1rem]" +
                        (activeSectionId === section.id
                          ? " text-primary ml-2"
                          : "")
                      }
                    >
                      {section.head_n} {section.head}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
