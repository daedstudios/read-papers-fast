"use client";

import * as React from "react";
import { Send, MessageCircle, X } from "lucide-react";
import { useChat } from "ai/react";
import { usePostHog } from "posthog-js/react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatDrawerProps {
  shareableId: string;
  triggerText?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
}

export function ChatDrawer({
  shareableId,
  triggerText = "Ask Questions",
  variant = "outline",
}: ChatDrawerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [factCheckData, setFactCheckData] = React.useState<any>(null);
  const [isLoadingData, setIsLoadingData] = React.useState(false);
  const [dataError, setDataError] = React.useState<string | null>(null);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const posthog = usePostHog();

  // Fetch fact-check data when component mounts or shareableId changes
  React.useEffect(() => {
    if (shareableId && isOpen) {
      // Track chat drawer opened
      posthog.capture("chat_drawer_opened", {
        shareableId,
        triggerText,
      });

      setIsLoadingData(true);
      setDataError(null);

      fetch(`/api/fact-check/db-save?shareableId=${shareableId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch fact-check data");
          }
          return response.json();
        })
        .then((result) => {
          if (result.success) {
            setFactCheckData(result.data);
            // Track successful data load
            posthog.capture("chat_data_loaded", {
              shareableId,
              papersCount: result.data.papers?.length || 0,
              hasStatement: !!result.data.statement,
              hasKeywords: !!result.data.keywords?.length,
            });
          } else {
            throw new Error(result.error || "Unknown error");
          }
        })
        .catch((error) => {
          console.error("Error fetching fact-check data:", error);
          setDataError(error.message);
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    }
  }, [shareableId, isOpen]);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/fact-check/chat-interface",
      body: {
        shareableId,
      },
    });

  // Custom submit handler without keeping the input
  const handleFormSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      // Track message sent
      posthog.capture("chat_message_sent", {
        shareableId,
        messageLength: input.trim().length,
        messageNumber: messages.length + 1,
        hasFactCheckData: !!factCheckData,
      });

      handleSubmit(e);
    },
    [
      input,
      isLoading,
      handleSubmit,
      posthog,
      shareableId,
      messages.length,
      factCheckData,
    ]
  );

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Track when assistant responds
  React.useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        posthog.capture("chat_response_received", {
          shareableId,
          responseLength: lastMessage.content.length,
          conversationLength: messages.length,
          responseTime: lastMessage.createdAt
            ? new Date().getTime() - new Date(lastMessage.createdAt).getTime()
            : null,
        });
      }
    }
  }, [messages, posthog, shareableId]);

  // Track when drawer is closed
  const handleDrawerChange = React.useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open && messages.length > 0) {
        posthog.capture("chat_drawer_closed", {
          shareableId,
          conversationLength: messages.length,
          sessionDuration: null, // Could track this with a start time if needed
        });
      }
    },
    [messages.length, posthog, shareableId]
  );

  // Show the drawer if we have shareableId
  if (!shareableId) {
    return null;
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleDrawerChange}>
      <DrawerTrigger asChild>
        <Button variant={variant} className="gap-2">
          <MessageCircle className="h-4 w-4" />
          {triggerText}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh] overflow-hidden">
        <div className="mx-auto w-full max-w-4xl flex flex-col h-full">
          <DrawerHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle>Research Assistant Chat</DrawerTitle>
                <DrawerDescription>
                  Ask questions about this fact-check session and the analyzed
                  papers
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="flex-1 flex flex-col min-h-0">
            {isLoadingData && (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading fact-check data...
                  </p>
                </div>
              </div>
            )}

            {dataError && (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center text-red-600">
                  <p className="text-lg font-medium">Error loading data</p>
                  <p className="text-sm">{dataError}</p>
                </div>
              </div>
            )}

            {!isLoadingData && !dataError && factCheckData && (
              <ScrollArea className="flex-1 overflow-auto" ref={scrollAreaRef}>
                <div className="p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="mx-auto h-12 w-12 opacity-50 mb-4" />
                      <p className="text-lg font-medium">
                        Start a conversation
                      </p>
                      <p className="text-sm">
                        Ask questions about this fact-check session and the
                        analyzed papers
                      </p>
                      <div className="mt-4 text-xs space-y-1">
                        <p>
                          • "What are the key findings from the analyzed
                          papers?"
                        </p>
                        <p>• "How confident are the results?"</p>
                        <p>• "What are the limitations of this research?"</p>
                      </div>
                      <div className="mt-4 p-3 bg-muted rounded-lg text-left">
                        <p className="text-sm font-medium mb-2">
                          Current fact-check session:
                        </p>
                        <p className="text-xs text-muted-foreground">
                          "{factCheckData.statement.substring(0, 150)}
                          {factCheckData.statement.length > 150 ? "..." : ""}"
                        </p>
                        <p className="text-xs mt-2">
                          {factCheckData.papers.length} papers analyzed
                        </p>
                      </div>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(
                            message.createdAt || Date.now()
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <div className="animate-pulse flex space-x-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-current rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-current rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Thinking...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Input form - always visible when data is loaded and no errors */}
            {!isLoadingData && !dataError && factCheckData && (
              <div className="border-t p-4 bg-background mb-8">
                <form onSubmit={handleFormSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask a question about this research..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
