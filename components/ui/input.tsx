import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor="#5e5a53"
      className={cn(
        "h-10 border border-input bg-card px-3 text-base text-foreground",
        className,
      )}
      {...props}
    />
  );
}
