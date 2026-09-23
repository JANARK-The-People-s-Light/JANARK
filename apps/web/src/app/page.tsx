import { LandingPage } from "@/components/LandingPage";
import { fill, templates } from "@/lib/config";
import {
  BRAND_TAGLINE,
  PUBLIC_LAUNCH_LABEL,
} from "@/lib/launch";

const brand = templates.brand();
const landing = templates.landing();

export const metadata = {
  title: fill(landing.metaTitle, { name: brand.name }),
  description: fill(landing.metaDescription, {
    tagline: BRAND_TAGLINE,
    launchLabel: PUBLIC_LAUNCH_LABEL,
  }),
};

export default function ComingSoonPage() {
  return <LandingPage />;
}
