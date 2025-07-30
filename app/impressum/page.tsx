"use client";

import Link from "next/link";

export default function ImpressumPage() {
  return (
    <div className="min-h-screen w-full flex mt-[10rem] bg-background text-foreground">
      <div className="w-xl max-w-[90%] mx-auto">
        <h1 className="text-3xl font-bold mb-8">Impressum</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">
              Service Provider Information
            </h2>
            <div className="space-y-2">
              <p>
                <strong>Service Provider:</strong>
              </p>
              <p>Read Papers Fast UG</p>
              
              <p>Königstraße 10</p>
              <p>10117 Berlin</p>
              <p>Germany</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-2">
              <p>
                <strong>Email:</strong> elias@acta.so
              </p>
              <p>
                <strong>Phone:</strong> +49 (0) 176 200 00 000
              </p>
            </div>
          </section>

        

       
          <section>
            <h2 className="text-xl font-semibold mb-4">Important Disclaimer</h2>
            <div className=" border-l-4 border-[#C5C8FF] p-4 mb-4">
              <p className="text-[#C5C8FF] font-medium">
                Accuracy Disclaimer
              </p>
              <p className="text-[#C5C8FF] mt-2">
                While we strive to provide accurate and reliable fact-checking
                results, we cannot guarantee 100% accuracy of our analyses. Our
                service uses AI-powered tools and automated processes that may
                occasionally produce errors or incomplete information. Users
                should always verify results independently and consult multiple
                sources for critical decisions.
              </p>
            </div>
           
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">
              Liability for Links and Sources
            </h2>
            <p>
              Our service contains links to external third-party websites and
              sources, over whose content we have no influence. Therefore, we
              cannot assume any guarantee for these external contents. The
              respective provider or operator of the linked pages is always
              responsible for the content of the linked pages. The linked pages
              were checked for possible legal violations at the time of linking.
              Illegal content was not recognizable at the time of linking.
            </p>
            <p>
              A permanent content control of the linked pages is not reasonable
              without concrete evidence of a legal violation. Upon becoming
              aware of legal violations, we will remove such links immediately.
            </p>
            <p>
              <strong>Source Reliability:</strong> We aggregate information from
              various academic and scientific sources, but we do not guarantee
              the accuracy, completeness, or reliability of any information
              provided. Users should exercise their own judgment and verify
              information from primary sources when making important decisions.
            </p>
          </section>

         

        
        </div>

        <div className="mt-12">
          <Link href="/" className="text-[#C5C8FF] hover:underline">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
