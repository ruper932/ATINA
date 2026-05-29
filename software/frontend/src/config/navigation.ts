import {
  LayoutDashboard,
  Users,
  Cpu,
  CloudRain,
  BarChart3,
  Leaf,
  MapPin,
  Droplets,
  Activity,
  Link2,
  ClipboardList,
} from "lucide-react";
import type { UserRole } from "@/context/AuthContext";

export type NavItem = {
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
};

export const dashboardNavItems: NavItem[] = [
  {
    title: "Resumen",
    to: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["admin", "docente", "tecnico", "estudiante", "invitado"],
  },
  {
    title: "Usuarios",
    to: "/dashboard/usuarios",
    icon: Users,
    allowedRoles: ["admin"],
  },
  {
    title: "Dispositivos",
    to: "/dashboard/dispositivos",
    icon: Cpu,
    allowedRoles: ["admin", "tecnico"],
  },
  {
    title: "Sensores",
    to: "/dashboard/sensores",
    icon: Activity,
    allowedRoles: ["admin", "tecnico"],
  },
  {
    title: "Ubicaciones",
    to: "/dashboard/ubicaciones",
    icon: MapPin,
    allowedRoles: ["admin", "tecnico"],
  },
  {
    title: "Invernaderos",
    to: "/dashboard/invernaderos",
    icon: Leaf,
    allowedRoles: ["admin", "tecnico"],
  },
  {
    title: "Atrapanieblas",
    to: "/dashboard/atrapanieblas",
    icon: CloudRain,
    allowedRoles: ["admin", "tecnico"],
  },
  {
    title: "Fuentes de Agua",
    to: "/dashboard/fuentes-agua",
    icon: Droplets,
    allowedRoles: ["admin", "tecnico"],
  },
  {
    title: "Atrapaniebla - Fuente",
    to: "/dashboard/fuentes-agua-atrapanieblas",
    icon: Link2,
    allowedRoles: ["admin", "tecnico"],
  },
  {
    title: "Solicitudes",
    to: "/dashboard/solicitudes",
    icon: ClipboardList,
    allowedRoles: ["admin", "tecnico", "docente"],
  },
  {
    title: "Reportes",
    to: "/dashboard/reportes",
    icon: BarChart3,
    allowedRoles: ["admin", "docente", "tecnico", "estudiante"],
  },
];