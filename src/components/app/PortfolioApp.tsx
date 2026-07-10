import { useState } from "react";

import { AboutView, type AboutSocialLink } from "@/components/app/AboutView";
import { ProjectGrid } from "@/components/app/ProjectGrid";
import { ProjectModal } from "@/components/app/ProjectModal";
import { SiteNav } from "@/components/app/SiteNav";
import { Tabs, TabsContent } from "@/components/peduncle/Tabs";
import type { Award } from "@/data/site";
import type { ResolvedProject } from "@/types/project";

export interface PortfolioAppProps {
  projects: ResolvedProject[];
  bio: string;
  awards: Award[];
  socialLinks: AboutSocialLink[];
  photoSrc: string;
}

export function PortfolioApp({
  projects,
  bio,
  awards,
  socialLinks,
  photoSrc,
}: PortfolioAppProps) {
  const [activeProjectSlug, setActiveProjectSlug] = useState<string | null>(
    null,
  );
  const activeProject = projects.find(
    (project) => project.slug === activeProjectSlug,
  );

  return (
    <Tabs defaultValue="projects">
      <SiteNav />
      <main>
        <TabsContent value="projects">
          <ProjectGrid
            projects={projects}
            onSelectProject={setActiveProjectSlug}
          />
          <ProjectModal
            project={activeProject}
            onOpenChange={(isOpen) => {
              if (!isOpen) setActiveProjectSlug(null);
            }}
          />
        </TabsContent>
        <TabsContent value="about">
          <AboutView
            bio={bio}
            awards={awards}
            socialLinks={socialLinks}
            photoSrc={photoSrc}
          />
        </TabsContent>
      </main>
    </Tabs>
  );
}
