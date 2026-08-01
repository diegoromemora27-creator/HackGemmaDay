"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookOpen, 
  Settings, 
  User, 
  Heart, 
  BarChart2, 
  MessageSquare, 
  Camera,
  GraduationCap,
  Bot
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { name: "Perfil", path: "/perfil", icon: User },
  { name: "Temario", path: "/temario", icon: BookOpen },
  { name: "Apuntes", path: "/apuntes", icon: Camera },
  { name: "Favoritos", path: "/favoritos", icon: Heart },
  { name: "Progreso", path: "/progreso", icon: BarChart2 },
  { name: "Preguntar", path: "/preguntar", icon: MessageSquare },
  { name: "Asistente", path: "/assistant", icon: Bot },
  { name: "Configuración", path: "/configuracion", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const { baseUrl } = useStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  // Don't show sidebar on config page if no base URL is set
  const storedUrl = localStorage.getItem("scq_base_url");
  if (!storedUrl && pathname === "/configuracion") {
    return null;
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          StudyCompanion
        </span>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-indigo-500/10 text-indigo-400 font-medium"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${baseUrl ? 'bg-green-500' : 'bg-rose-500'}`} />
          {baseUrl ? 'Conectado a Kaggle' : 'Backend no configurado'}
        </div>
      </div>
    </aside>
  );
}
