"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/components/AppContext";
import Image from "next/image";
import { Plus, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { initiateRequests } from "@/utilities/PromptChain";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Loader2 } from "lucide-react";

const Waitlist = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitted(false);

    try {
      await new Promise((res) => setTimeout(res, 1500));

      // Normally you'd send to your backend here
      // await fetch("/api/waitlist", { method: "POST", body: JSON.stringify({ email }) });

      setSubmitted(true);
      setEmail("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-full md:h-screen overflow-hidden items-center">
      <Image
        src="/LANDING-2.png"
        alt="Background"
        fill
        priority
        className="object-cover z-[-1]"
      />

      <div className="flex flex-col items-center justify-center h-full mx-auto max-w-[90%] md:max-w-[42rem] pt-[8rem] md:pt-[3rem]">
        <div className="bg-background/10 backdrop-blur-lg shadow-xl py-2 px-4 border border-muted rounded-[2rem]">
          coming soon
        </div>
        <div className="text-[3rem] md:text-[4rem] text-center font-medium pt-[1rem]">
          Read Papers 10x Faster
        </div>
        <p className="text-[1.25rem] text-center pt-[1rem] pb-[2rem]">
          Upload academic papers, get references and definitions – understand
          more in less time.
        </p>
        {submitted && (
          <p className="mt-3 text-foreground text-[3rem] z-10">
            Thanks! You’re on the list 🚀
          </p>
        )}
        <form className="flex w-full flex-col sm:flex-row gap-2 border p-[1rem] bg-background/10 backdrop-blur-lg shadow shadow-foreground/30 border-muted rounded-[2rem] ">
          <Input
            type="email"
            placeholder="Your Email"
            value={email}
            disabled={loading || submitted}
            onChange={(e) => setEmail(e.target.value)}
            className="flex h-[2.25rem] rounded-[2rem] bg-white/80 backdrop-blur-md text-black"
          />
          <Button
            type="submit"
            disabled={loading || submitted || !email}
            className="h-[2.25rem] rounded-[2rem] px-auto text-[1rem] cursor-pointer"
          >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            {submitted ? <CheckCircle2 className="w-4 h-4" /> : "join waitlist"}
          </Button>
        </form>
        <div className="flex w-full z-4 flex-col text-foreground opacity-60 items-center pt-[6rem] text-[1rem]">
          trusted by students of
          <div className="relative md:w-[42rem] overflow-hidden py-[3rem]">
            <div className="flex gap-[8rem] animate-marquee whitespace-nowrap">
              <Image
                src="/maastricht3.svg"
                alt="maastricht"
                width={280}
                height={36}
                className="opacity-100"
              />
              <Image
                src="/passau3.svg"
                alt="passau"
                width={240}
                height={36}
                className="opacity-100"
              />
              <Image
                src="/uci3.svg"
                alt="uci"
                width={64}
                height={36}
                className="opacity-100"
              />

              <Image
                src="/maastricht3.svg"
                alt="maastricht"
                width={280}
                height={36}
                className="opacity-100"
              />
              <Image
                src="/passau3.svg"
                alt="passau"
                width={240}
                height={36}
                className="opacity-100"
              />
              <Image
                src="/uci3.svg"
                alt="uci"
                width={64}
                height={36}
                className="opacity-100"
              />
            </div>

            <style jsx>{`
              .animate-marquee {
                display: inline-flex;
                animation: scroll-left 25s linear infinite;
              }

              @keyframes scroll-left {
                0% {
                  transform: translateX(0);
                }
                100% {
                  transform: translateX(-50%);
                }
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Waitlist;
