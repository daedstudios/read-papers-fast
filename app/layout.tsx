import type { Metadata } from "next";
import "./globals.css";
import { AppContextProvider } from "@/components/AppContext";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import Script from "next/script";
import { PostHogProvider } from "@/components/Posthog";
import SurveyPopup from "@/components/survey-popup";

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex flex-row absolute p-[1rem] w-screen justify-between bg-transparent z-100">
        <Link href="/" passHref>
          <button className="text-[1.25rem] pt-1 cursor-pointer text-foreground font-medium">
            FindPapersFast
          </button>
        </Link>
        <div className="flex flex-row gap-2">
          <SignedOut>
            <SignInButton>
              <Button className="bg-background/30 w-auto p-4 text-foreground cursor-pointer rounded-[3rem] border border-muted/30 hover:bg-background/10 hover:text-background">
                Log In
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button className="bg-foreground w-auto p-4 text-background cursor-pointer rounded-[3rem]  hover:bg-foreground/30">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>
        </div>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      <AppContextProvider>
        {children}
        <SurveyPopup />
      </AppContextProvider>
    </>
  );
}

export const metadata: Metadata = {
  title: "FindPapersFast",
  description: "Find research papers 10x faster",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <PostHogProvider>
        <html lang="en">
          <head>
            <Script
              id="posthog-script"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
              !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init Ee Ps Rs xe ks Is capture We calculateEventProperties Cs register register_once register_for_session unregister unregister_for_session Ds getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty Fs Ms createPersonProfile As Es opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing Ts debug Os getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
              posthog.init('phc_CRm6GRarv0pCSrIveM6g7hZ4AbNxdT5kcsPkfkhAUDO', {
                api_host: 'https://us.i.posthog.com',
                defaults: '2025-05-24',
                person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
                });
                `,
              }}
            />
          </head>
          <body className="antialiased">
            <LayoutContent>{children}</LayoutContent>
          </body>
        </html>
      </PostHogProvider>
    </ClerkProvider>
  );
}
