"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/components/AppContext";
import Image from "next/image";
import { ArrowUp, ArrowUpRight, Plus, Video } from "lucide-react";
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
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setSubmitted(true);
      setEmail("");
    } catch (err) {
      console.error("Waitlist signup error:", err);
      // Optionally show an error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-full md:h-screen overflow-hidden items-center">
      {/* <Image
        src="/LANDING-2.png"
        alt="Background"
        fill
        priority
        className="object-cover z-[-1]"
      /> */}

      <div className="flex flex-col items-center justify-center h-full mx-auto max-w-[90%] md:max-w-[42rem] pt-[12rem] md:pt-[6rem]">
        {/* <div className="bg-background/10 backdrop-blur-lg shadow-xl py-2 px-4 border border-muted rounded-[2rem]">
          v0.1 coming soon
        </div> */}
        <div className="text-[2.5rem] text-center pt-[1rem]">
          Read Papers 10x Faster
        </div>
        <p className="text-[1rem] max-w-[32rem] text-muted-foreground text-center pt-[1rem] pb-[2rem]">
          Upload academic papers, get references and definitions – understand
          more in less time. Sign up for early access.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col sm:flex-row gap-2 border p-[1rem]  shadow-sm rounded-[2rem] "
        >
          <Input
            type="email"
            placeholder="Your Email"
            value={email}
            disabled={loading || submitted}
            onChange={(e) => setEmail(e.target.value)}
            className="flex h-[2.25rem] rounded-[2rem] shadow-none text-black"
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

        <Link
          href="/paperG?id=8915e476-ea87-4540-b7bb-ac766e61a0fe"
          className="px-1 text-[1rem] pt-[1rem] font-medium underline flex flex-row gap-1 items-center"
        >
          See example
          <ArrowUpRight className="w-5 h-5" />
        </Link>

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
