import Image from "next/image";

export function RybbitLogo({ width = 32, height = 32 }: { width?: number; height?: number }) {
  return <Image src="/rybbit.svg" alt="Rybbit" width={width} height={height} className="invert dark:invert-0" />;
}
