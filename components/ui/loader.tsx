import { cn } from "@/lib/utils";
import "./loader.css";

interface LoaderProps {
  className?: string;
}

export function Loader({ className }: LoaderProps) {
  return <div className={cn("loader", className)} />;
}
