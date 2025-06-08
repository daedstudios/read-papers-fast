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
};

export default function PhoneDrawer({ paperSummary }: PhoneDrawerProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <div className="fixed bottom-0 items-start h-[4.5rem] left-0 w-full z-50 flex bg-transparent  justify-start md:hidden px-[1rem]">
          <Button className="flex flex-row justify-between hover:bg-muted text-foreground bg-background w-auto h-auto border rounded-[2rem] text-[1rem] cursor-pointer">
            Table of Content
            <ChevronUp />
          </Button>
        </div>
      </DrawerTrigger>

      <DrawerContent className="fixed rounded-t-[1rem] bottom-0 left-0 w-full h-[70%] bg-background z-50 px-[1rem] overflow-auto">
        <div className="bg-background w-full h-full pt-[1rem]">
          <ScrollArea className="h-full w-full" ref={menuRef}>
            <div className="bg-background w-full h-full">
              <div className="relative space-y-2 w-full">
                {paperSummary?.grobidContent?.map((section) => (
                  <div key={section.id} className="list-none">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(section.id)?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                        setOpen(false);
                      }}
                      className="w-full hover:bg-[url('/LANDING-2.png')] rounded-sm cursor-pointer p-2 text-left truncate text-wrap overflow-hidden text-[1rem]"
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
