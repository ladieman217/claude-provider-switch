import { Globe, Check } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { supportedLocales, type Locale, getLocaleDisplayName } from "../lib/i18n";

interface LanguageSwitchProps {
  locale: Locale;
  onChange: (locale: Locale) => void;
}

export function LanguageSwitch({ locale, onChange }: LanguageSwitchProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-sand-200/60 hover:text-sand-100 hover:bg-sand-200/10"
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs font-medium">
            {getLocaleDisplayName(locale)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLocales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => onChange(loc)}
            className="flex items-center justify-between gap-3"
          >
            <span>{getLocaleDisplayName(loc)}</span>
            {locale === loc && (
              <Check className="w-4 h-4 text-mint-400" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
