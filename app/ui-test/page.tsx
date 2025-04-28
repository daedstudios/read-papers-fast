"use client";
import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  topic: string;
  description: string;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const TaskDrawer = () => {
  const [open, setOpen] = React.useState(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    error,
    setData,
    data,
    setMessages,
    setInput,
    stop,
    status,
  } = useChat({
    api: "/api/vertex",
  });

  return (
    <Drawer
      modal={false}
      open={open}
      onOpenChange={setOpen}
      onClose={() => {
        console.log("close drawer");
        console.log("data", data);
        setData([]);
        setMessages([]);
        setInput("");
        stop();
      }}
    >
      <DrawerTrigger asChild>
        <Button
          className=" w-[7.5rem] bg-secondary border-muted-foreground dark:bg-primary border  text-primary text-[1rem] hover:bg-muted-foreground hover:text-background dark:hover:bg-background dark:text-card-foreground rounded-[2rem] cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          tasks
        </Button>
      </DrawerTrigger>
      <DrawerContent className="top-0  min-h-screen h-auto">
        <DrawerHeader className=" flex  gap-2 md:w-[42rem] w-[90%] mx-auto">
          <DrawerTitle className="text-[2rem] justify-start text-left font-medium">
            {/* {topic} task */}
          </DrawerTitle>
          <DrawerDescription className="text-primary pt-4 text-[1rem]">
            {/* {description} */}
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="md:w-[42rem] w-[90%] mb-40 mx-auto overflow-y-auto mt-3">
          {
            <div className="h-auto w-full p-4">
              {messages.map((message) =>
                message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <ReactMarkdown
                          key={i}
                          components={{
                            pre: ({ children }) => (
                              <pre className="overflow-auto rounded-md bg-foreground text-background text-sm p-4 my-4 max-w-full">
                                {children}
                              </pre>
                            ),
                            code: ({ className, children }) => (
                              <code
                                className={`${className} break-words whitespace-pre-wrap`}
                              >
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {part.text}
                        </ReactMarkdown>
                      );
                    case "source":
                      return <p key={i}>{part.source.url}</p>;
                    case "reasoning":
                      return <div key={i}>{part.reasoning}</div>;
                    case "tool-invocation":
                      return <div key={i}>{part.toolInvocation.toolName}</div>;
                    case "file":
                      return <div key={i}>image</div>;
                  }
                })
              )}
              {status === "submitted" && (
                <div className="flex items-center justify-center my-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3">Thinking...</span>
                </div>
              )}
            </div>
          }
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap gap-4 items-center justify-between  p-4 mx-auto"
          >
            <textarea
              className="border-none focus:outline-none py-[0.5rem] md:w-[16rem] w-full "
              name="prompt"
              value={input}
              placeholder="ask a question"
              onChange={handleInputChange}
            />
            <button
              className="md:w-[7.25rem] w-full hover:bg-foreground border py-[0.5rem] bg-primary text-secondary cursor-pointer rounded-[2rem]"
              type="submit"
            >
              ask
            </button>
          </form>

          <div className="flex items-start px-4 flex-row w-full gap-4 ">
            <Button
              className=" w-[7.5rem] bg-secondary hover:bg-muted-foreground hover:text-background dark:bg-primary border border-muted-foreground text-primary text-[1rem]  dark:hover:bg-background dark:text-card-foreground rounded-[2rem] cursor-pointer"
              onClick={() => setOpen(!open)}
            >
              more info
            </Button>
            <Button
              className=" w-[7.5rem]  bg-secondary dark:bg-primary border border-muted-foreground text-primary text-[1rem] hover:bg-muted-foreground hover:text-background dark:hover:bg-background dark:text-card-foreground rounded-[2rem] cursor-pointer"
              onClick={() => setOpen(!open)}
            >
              topics
            </Button>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};

export default TaskDrawer;
