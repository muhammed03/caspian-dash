/**
 * The Academy's sections.
 *
 * Deliberately NOT in the shell component: that file is `"use client"`, and a
 * value imported from a client module into a server function like
 * `generateStaticParams` arrives as a client-reference proxy rather than the
 * array itself. Keeping the list in a plain module lets both sides read it.
 */
export const ACADEMY_SECTIONS = [
  "journey",
  "lessons",
  "quiz",
  "missions",
  "achievements",
  "simulator",
  "community",
] as const;

export type AcademySection = (typeof ACADEMY_SECTIONS)[number];
