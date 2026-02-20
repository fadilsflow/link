import { cn } from "@/lib/utils";

const LogoMark = ({ className }: { className?: string }) => {
  return (
    <img
      src="/logo-black.svg"
      alt=""
      width={24}
      height={24}
      className={cn(className)}
    />
  );
};
const LogoType = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-xl font-medium ",
        className,
      )}
    >
      <img src="/logo-black.svg" alt="Logo" width={24} height={24} />
      <span className="relative top-0.5 text-2xl font-heading">kreeasi</span>
    </div>
  );
};

export { LogoMark, LogoType };
