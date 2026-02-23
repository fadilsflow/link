import KreasiLogo from "./icon/kreasi";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const LogoMark = ({ className }: { className?: string }) => {
  return (
    <KreasiLogo width={24} height={24} className={className} />
  );
};
const LogoType = ({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-xl font-medium text-black",
        className,
      )}
      style={style}
    >
      <KreasiLogo width={24} height={24} />
      <span className="relative top-0.5 text-2xl font-heading">kreeasi</span>
    </div>
  );
};

const LogoStudioSidebar = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1 text-xl font-medium ",
        className,
      )}
    >
      <KreasiLogo width={30} height={30} />
      <span className="relative top-0.5 text-3xl font-heading">Studio</span>
    </div>
  );
};

export { LogoMark, LogoType, LogoStudioSidebar };
