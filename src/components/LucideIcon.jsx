import {
  ArrowLeft,
  ArrowRight,
  BusFront,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Download,
  HelpCircle,
  Info,
  Map,
  MapPin,
  MapPinned,
  Phone,
  Printer,
  SendHorizontal,
  Shield,
  Star,
  Ticket,
  User,
  Users,
  Wifi
} from "lucide-react";

const icons = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "bus-front": BusFront,
  bus: BusFront,
  "calendar-days": CalendarDays,
  calendar: CalendarDays,
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  circle: Circle,
  clock: Clock,
  download: Download,
  help: HelpCircle,
  "help-circle": HelpCircle,
  info: Info,
  map: Map,
  "map-pin": MapPin,
  "map-pinned": MapPinned,
  phone: Phone,
  printer: Printer,
  "send-horizontal": SendHorizontal,
  shield: Shield,
  star: Star,
  ticket: Ticket,
  user: User,
  users: Users,
  wifi: Wifi
};

export default function LucideIcon({ name, ...props }) {
  const Icon = icons[name] || Circle;
  return <Icon aria-hidden="true" strokeWidth={2} {...props} />;
}
