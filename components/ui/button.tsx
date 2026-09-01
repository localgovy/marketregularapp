import { Pressable, Text, type PressableProps } from "react-native";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "secondary" | "ghost" | "destructive";

export function Button({
  title,
  variant = "default",
  className,
  textClassName,
  ...props
}: PressableProps & {
  title: string;
  variant?: Variant;
  className?: string;
  textClassName?: string;
}) {
  return (
    <Pressable
      className={cn(
        "h-10 items-center justify-center border px-3",
        variant === "default" && "border-transparent bg-primary",
        variant === "outline" && "border-border bg-background",
        variant === "secondary" && "border-transparent bg-secondary",
        variant === "ghost" && "border-transparent bg-transparent",
        variant === "destructive" && "border-transparent bg-stamp/15",
        props.disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <Text
        className={cn(
          "text-sm font-medium",
          variant === "default" && "text-primary-foreground",
          variant === "outline" && "text-foreground",
          variant === "secondary" && "text-secondary-foreground",
          variant === "ghost" && "text-foreground",
          variant === "destructive" && "text-stamp",
          textClassName,
        )}
      >
        {title}
      </Text>
    </Pressable>
  );
}
