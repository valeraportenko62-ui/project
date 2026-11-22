import type { ReactNode } from 'react'

type IconProps = { className?: string; size?: number }

function Svg({ children, className, size = 20 }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  )
}

export function SearchIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Svg>
  )
}

export function SunIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Svg>
  )
}

export function MoonIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Svg>
  )
}

export function ArrowRightIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </Svg>
  )
}

export function ArrowDownIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 5v14M5 12l7 7 7-7" />
    </Svg>
  )
}

export function ExternalLinkIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </Svg>
  )
}

export function ChevronRightIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  )
}

export function HomeIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </Svg>
  )
}

export function DatabaseIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
      <path d="M3 12a9 3 0 0 0 18 0" />
    </Svg>
  )
}

export function LayersIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </Svg>
  )
}

export function BookIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </Svg>
  )
}

export function GraduationIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5" />
    </Svg>
  )
}

export function GlobeIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </Svg>
  )
}

export function CatalogIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Svg>
  )
}

export function FlaskIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
      <path d="M7.5 14h9" />
    </Svg>
  )
}

export function ClockIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Svg>
  )
}

export function TagIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 2H2v10l9.6 9.6a2 2 0 0 0 2.8 0l5.2-5.2a2 2 0 0 0 0-2.8L12 2Z" />
      <circle cx="7" cy="7" r="1.5" />
    </Svg>
  )
}

export function SparklesIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </Svg>
  )
}

export function FileTextIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </Svg>
  )
}

export function SettingsIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </Svg>
  )
}

export function CornerDownLeftIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m9 10-5 5 5 5" />
      <path d="M20 4v7a4 4 0 0 1-4 4H4" />
    </Svg>
  )
}

const VERTICAL_ICONS: Record<string, (p: IconProps) => ReactNode> = {
  informational: (p) => <BookIcon {...p} />,
  reference: (p) => <LayersIcon {...p} />,
  educational: (p) => <GraduationIcon {...p} />,
  encyclopedic: (p) => <GlobeIcon {...p} />,
  catalogs: (p) => <CatalogIcon {...p} />,
  scientific: (p) => <FlaskIcon {...p} />,
}

export function VerticalIcon({ slug, className, size }: IconProps & { slug: string }) {
  const Cmp = VERTICAL_ICONS[slug]
  return Cmp ? <Cmp className={className} size={size} /> : <DatabaseIcon className={className} size={size} />
}
