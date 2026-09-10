import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { FirebaseSession } from "@/lib/firebase/session";
import { ClientHydrate } from "@/components/client-hydrate";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { QueryProvider } from "@/components/query-provider";
import { HOUSE_BIO_LINE, publicUrl } from "@/lib/site-url";
import appCss from "../styles.css?url";

const APP_NAME = "BINTI DESIGNS";
const OG = publicUrl("/og.jpg");
const HOME = publicUrl("/");

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: HOUSE_BIO_LINE },
      { name: "theme-color", content: "#090909" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: APP_NAME },
      { property: "og:title", content: APP_NAME },
      { property: "og:description", content: HOUSE_BIO_LINE },
      { property: "og:url", content: HOME },
      { property: "og:image", content: OG },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: APP_NAME },
      { name: "twitter:description", content: HOUSE_BIO_LINE },
      { name: "twitter:image", content: OG },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "canonical", href: HOME },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <FirebaseSession>
            <ClientHydrate />
            <QueryProvider>
              <Outlet />
            </QueryProvider>
          </FirebaseSession>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
