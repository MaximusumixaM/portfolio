import type { ImageMetadata } from "astro";

import adonisThumb from "../assets/images/projects/adonis-thumb.png";
import adonis1 from "../assets/images/projects/adonis-1.png";
import adonis2 from "../assets/images/projects/adonis-2.png";
import adonis3 from "../assets/images/projects/adonis-3.png";

import musicLicensingThumb from "../assets/images/projects/music-licensing-thumb.png";
import musicLicensing1 from "../assets/images/projects/music-licensing-1.png";
import musicLicensing2 from "../assets/images/projects/music-licensing-2.png";
import musicLicensing3 from "../assets/images/projects/music-licensing-3.png";
import musicLicensing4 from "../assets/images/projects/music-licensing-4.png";
import musicLicensing5 from "../assets/images/projects/music-licensing-5.png";

import modelingThumb from "../assets/images/projects/3d-modeling-thumb.png";
import modeling1 from "../assets/images/projects/3d-modeling-1.png";
import modeling2 from "../assets/images/projects/3d-modeling-2.png";
import modeling3 from "../assets/images/projects/3d-modeling-3.png";
import modeling4 from "../assets/images/projects/3d-modeling-4.png";
import modeling5 from "../assets/images/projects/3d-modeling-5.png";

import icrewThumb from "../assets/images/projects/icrew-thumb.png";
import icrew1 from "../assets/images/projects/icrew-1.png";
import icrew2 from "../assets/images/projects/icrew-2.png";
import icrew3 from "../assets/images/projects/icrew-3.png";

import roboSwarmThumb from "../assets/images/projects/robo-swarm-thumb.png";
import roboSwarm1 from "../assets/images/projects/robo-swarm-1.png";
import roboSwarm2 from "../assets/images/projects/robo-swarm-2.png";

import gradProjectThumb from "../assets/images/projects/grad-project-thumb.png";
import gradProject1 from "../assets/images/projects/grad-project-1.png";

export interface ProjectDetailImage {
  src: ImageMetadata;
  alt: string;
}

export interface ProjectNote {
  label: string;
  text: string;
}

export interface Project {
  slug: string;
  title: string;
  thumbnail: ImageMetadata;
  about: string;
  notes: ProjectNote[];
  images: ProjectDetailImage[];
  /** YouTube embed URL for projects with video documentation. */
  videoEmbedUrl?: string;
}

export const projects: Project[] = [
  {
    slug: "adonis",
    title: "Adonis",
    thumbnail: adonisThumb,
    about:
      "Critical design project based on a possible vision of climate catastrophe in the year 2050. The human body now takes damage simply from being outside, and people must now clean their organs every week in order to live healthily. This society avoids solving the root problem, and people live in blissful ignorance.",
    notes: [
      {
        label: "Technical",
        text: "Adobe, Filmaking, 3D modeling, 3D printing w/ plaster, Animation, Branding, Arduino",
      },
      {
        label: "Vimeo",
        text: "Product demonstration video available on vimeo at: https://vimeo.com/397061649",
      },
    ],
    images: [
      { src: adonis1, alt: "Adonis project photo 1" },
      { src: adonis2, alt: "Adonis project photo 2" },
      { src: adonis3, alt: "Adonis project photo 3" },
    ],
  },
  {
    slug: "music-licensing",
    title: "B2B Music Licensing Service",
    thumbnail: musicLicensingThumb,
    about:
      "This is a B2B music licensing service for American record labels that I designed with the Vancouver studio, Design for Humans. Building on the preliminary concept, I created the general design system as well as several central interactions. I began with a competitive analysis, then moved on to brainstorming, wireframes, creating components, maturing the design, high fidelity mockups, and a mobile version.",
    notes: [{ label: "Technical", text: "Made using Figma" }],
    images: [
      { src: musicLicensing1, alt: "Music licensing service mockup 1" },
      { src: musicLicensing2, alt: "Music licensing service mockup 2" },
      { src: musicLicensing3, alt: "Music licensing service mockup 3" },
      { src: musicLicensing4, alt: "Music licensing service mockup 4" },
      { src: musicLicensing5, alt: "Music licensing service mockup 5" },
    ],
  },
  {
    slug: "3d-modeling",
    title: "3D Modeling",
    thumbnail: modelingThumb,
    about:
      "I've done two 3D modelling projects, the first is a conceptual rendition of a modern, furnished kitchen, where I sought to push the limits of my 3D modelling capabilities. My goal was to create a variety of different objects and furniture that aligned with the overall aesthetic. The second project is a futuristic motorcycle with a spherical back wheel and a front hover pad. The rider is meant to lie down flat inside of the motorcycle and hold onto the red handlebars to drive. It also features wings, air intake, and headlights.",
    notes: [
      {
        label: "Technical",
        text: "Entirely designed, built, and rendered using Modo software",
      },
    ],
    images: [
      { src: modeling1, alt: "3D model render 1" },
      { src: modeling2, alt: "3D model render 2" },
      { src: modeling3, alt: "3D model render 3" },
      { src: modeling4, alt: "3D model render 4" },
      { src: modeling5, alt: "3D model render 5" },
    ],
  },
  {
    slug: "icrew",
    title: "iCrew",
    thumbnail: icrewThumb,
    about:
      "Our team created an app based on the idea of integrating the different components and consumer services of an airplane into one app in order to facilitate the work of cabin crew members. We chose a smartwatch as our device because of its glanceability and subtle nature.",
    notes: [{ label: "Technical", text: "Made using Figma" }],
    images: [
      { src: icrew1, alt: "iCrew smartwatch app mockup 1" },
      { src: icrew2, alt: "iCrew smartwatch app mockup 2" },
      { src: icrew3, alt: "iCrew smartwatch app mockup 3" },
    ],
  },
  {
    slug: "robo-swarm",
    title: "Robo-Swarm",
    thumbnail: roboSwarmThumb,
    about:
      "I wanted to create an interactive and dynamic environment that completely absorbed the user, by putting them in a room surrounded by beams of light that move away as the user got closer. The minimum viable product was to make an RPi capable of detecting motion and altering its behaviour.",
    notes: [
      {
        label: "Technical",
        text: "Created using RPi, Python, SimpleCV library, Adobe, cardboard, wood, and plastic",
      },
    ],
    images: [
      { src: roboSwarm1, alt: "Robo-Swarm installation photo 1" },
      { src: roboSwarm2, alt: "Robo-Swarm installation photo 2" },
    ],
  },
  {
    slug: "grad-project",
    title: "Grad Project",
    thumbnail: gradProjectThumb,
    about:
      "Materializing an evolving shape from a surface: The user draws a shape in the air with their finger on one half of the device, and that same shape will appear physically on the other half of the device. Each time a shape is drawn, a new layer is added. As the user keeps drawing shapes with their finger, more layers are being added, thus creating a progressively more complex shape. It could be used as a simple method of prototyping in 3D, or as a game between friends.",
    notes: [
      {
        label: "Technical",
        text: "Still in ideation, plan to use motion detection, RPi to compute inputs, and actuators to push objects",
      },
      { label: "Process Book", text: "https://maxgradproject.blogspot.com/" },
    ],
    images: [{ src: gradProject1, alt: "Grad project reference photo" }],
    videoEmbedUrl: "https://www.youtube.com/embed/5BrcSmQ-dvA",
  },
];
