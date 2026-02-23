import KreasiLogo from "./icon/kreasi";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
  size?: number;
  width?: number;
  height?: number;
}

const LogoMark = ({ className, size, width, height }: LogoMarkProps) => {
  return (
    <KreasiLogo
      width={size ?? width ?? 24}
      height={size ?? height ?? 24}
      className={className}
    />
  );
};

interface LogoTypeProps {
  className?: string;
  style?: CSSProperties;
  logoSize?: number;
  textSize?: string;
  text?: string;
  gap?: number;
  textClassName?: string;
}

const LogoType = ({
  className,
  style,
  logoSize,
  textSize,
  text = "kreeasi",
  gap = 2,
  textClassName,
}: LogoTypeProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-xl font-medium text-black",
        className,
      )}
      style={style}
    >
      <KreasiLogo width={logoSize ?? 24} height={logoSize ?? 24} />
      <span
        className={cn("relative top-0.5 text-2xl font-heading", textClassName)}
        style={textSize ? { fontSize: textSize } : undefined}
      >
        {text}
      </span>
    </div>
  );
};

interface LogoStudioSidebarProps {
  className?: string;
  logoSize?: number;
  textSize?: string;
  text?: string;
  gap?: number;
  textClassName?: string;
}

const LogoStudioSidebar = ({
  className,
  logoSize,
  textSize,
  text = "Studio",
  gap = 1,
  textClassName,
}: LogoStudioSidebarProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1 text-xl font-medium",
        className,
      )}
    >
      <KreasiLogo width={logoSize ?? 30} height={logoSize ?? 30} />
      <span
        className={cn("relative top-0.5 text-3xl font-heading", textClassName)}
        style={textSize ? { fontSize: textSize } : undefined}
      >
        {text}
      </span>
    </div>
  );
};

export { LogoMark, LogoType, LogoStudioSidebar };
