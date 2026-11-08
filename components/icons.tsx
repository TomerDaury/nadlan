import {
  BedDouble,
  Bell,
  Building2,
  Car,
  ChevronDown,
  ChevronRight,
  Heart,
  Image as ImageIcon,
  List,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Pencil,
  Plus,
  Search,
  SquareDashed,
  Trash2,
  Upload,
  User,
  House,
  type LucideIcon,
} from "lucide-react";

// Icon set from DESIGN.md §2.3 / style-guide.png, keyed by the style-guide names.
// Line icons, 24px default size; render with ICON_STROKE for the 1.75px stroke.
export const ICON_STROKE = 1.75;

export const icons = {
  home: House,
  rooms: BedDouble,
  area: SquareDashed,
  floor: Building2,
  parking: Car,
  search: Search,
  mail: Mail,
  bell: Bell,
  favorite: Heart,
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  image: ImageIcon,
  upload: Upload,
  user: User,
  location: MapPin,
  logout: LogOut,
  chevron: ChevronDown,
  // Points right: "back" in an RTL interface.
  back: ChevronRight,
  message: MessageSquare,
  phone: Phone,
  list: List,
  spinner: LoaderCircle,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

type IconProps = React.ComponentProps<LucideIcon> & { name: IconName };

export function Icon({ name, strokeWidth = ICON_STROKE, ...props }: IconProps) {
  const Component = icons[name];
  return <Component aria-hidden strokeWidth={strokeWidth} {...props} />;
}
