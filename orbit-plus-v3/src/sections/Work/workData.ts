// src/sections/Work/workData.ts
// Work project data with Step 2/3 bridge-ready fields

// Import local placeholder images for projects without live URLs
import projectGammaImg from '@/assets/placeholders/project-gamma.png';
import projectDeltaImg from '@/assets/placeholders/project-delta.png';
import heartseedLogo from '@/assets/New-Heartseed-logo.png';
import naturalroadLogo from '@/assets/naturalroad.png';
import lbgtqLogo from '@/assets/lbgtq.png';
import placeholderLogo from '@/assets/react.svg';

export type WorkProject = {
  id: string;
  title: string;
  category?: string; // Optional - not in spec but useful for UI
  description: string;
  href?: string; // Optional per spec

  // Screenshot for card display (thum.io or static)
  screenshotUrl: string;

  // Bridge readiness (Step 3 exposure windows)
  previewImageUrl: string;
  previewFocalPoint?: string;
  logoUrl: string;

  // Watermark slice highlight (Step 2)
  sliceIndex?: number; // 0..31
};

// Generate screenshot URL from site URL using thum.io service
export const getScreenshotUrl = (url: string) =>
  `https://image.thum.io/get/width/600/crop/400/${url}`;

// Higher resolution for preview images
export const getPreviewUrl = (url: string) =>
  `https://image.thum.io/get/width/1600/${url}`;

export const PROJECTS: WorkProject[] = [
  {
    id: 'project-1',
    title: 'Native Heartseed',
    category: 'Coaching Platform',
    description: 'Minimalist landing page for personal and professional coaching services.',
    href: 'https://heartseed-gift.lovable.app/',
    screenshotUrl: getScreenshotUrl('https://heartseed-gift.lovable.app/'),
    previewImageUrl: getPreviewUrl('https://heartseed-gift.lovable.app/'),
    previewFocalPoint: '50% 40%',
    logoUrl: heartseedLogo,
    sliceIndex: 2,
  },
  {
    id: 'project-2',
    title: 'Natural Road to Health',
    category: 'Wellness Site',
    description: 'Personalized nutrition and wellness platform with holistic health focus.',
    href: 'https://thenaturalroadtohealth.com/',
    screenshotUrl: getScreenshotUrl('https://thenaturalroadtohealth.com/'),
    previewImageUrl: getPreviewUrl('https://thenaturalroadtohealth.com/'),
    previewFocalPoint: '50% 45%',
    logoUrl: naturalroadLogo,
    sliceIndex: 10,
  },
  {
    id: 'project-3',
    title: 'Project Gamma',
    category: 'Web Experience',
    description: 'Immersive web experience with award-winning design.',
    // href omitted - no URL available
    screenshotUrl: projectGammaImg,
    previewImageUrl: projectGammaImg,
    previewFocalPoint: '50% 50%',
    logoUrl: lbgtqLogo,
    sliceIndex: 18,
  },
  {
    id: 'project-4',
    title: 'Project Delta',
    category: 'Mobile App',
    description: 'Native app reaching 1M+ downloads in first year.',
    // href omitted - no URL available
    screenshotUrl: projectDeltaImg,
    previewImageUrl: projectDeltaImg,
    previewFocalPoint: '50% 50%',
    logoUrl: placeholderLogo,
    sliceIndex: 26,
  },
];
