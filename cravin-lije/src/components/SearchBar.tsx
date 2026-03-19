import { Search, X, Leaf } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  sugarFreeOnly: boolean;
  onSugarFreeToggle: (value: boolean) => void;
}

const SearchBar = ({ value, onChange, sugarFreeOnly, onSugarFreeToggle }: SearchBarProps) => {
  return (
    <div className="sticky top-[56px] z-40 bg-background px-4 py-3 shadow-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search menu..."
          className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div
        className={cn(
          "mt-2.5 flex items-center justify-between rounded-lg px-4 py-2.5 border transition-all duration-300",
          sugarFreeOnly
            ? "border-success bg-success/10 shadow-[0_0_12px_hsl(var(--success)/0.25)]"
            : "border-input bg-card"
        )}
      >
        <div className="flex items-center gap-2">
          <Leaf
            className={cn(
              "h-4 w-4 transition-colors duration-300",
              sugarFreeOnly ? "text-success" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-sm font-medium transition-colors duration-300",
              sugarFreeOnly ? "text-success" : "text-card-foreground"
            )}
          >
            {sugarFreeOnly ? "Sugar Free Mode ON" : "Sugar Free"}
          </span>
        </div>
        <Switch
          checked={sugarFreeOnly}
          onCheckedChange={onSugarFreeToggle}
          className="data-[state=checked]:bg-success"
        />
      </div>
    </div>
  );
};

export default SearchBar;
