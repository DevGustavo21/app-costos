const ROUTE_TITLES: Record<string, string> = {
  ingresos: "Registro de ingresos",
  costos: "Registro de costos",
  configuracion: "Configuración",
  "categorias-ingresos": "Categorías de ingresos",
  "categorias-costos": "Categorías de costos",
  productos: "Catálogo de productos",
  unidad: "Unidad de negocio",
  plantas: "Catálogo de productos",
};

export function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Panel principal";
  if (pathname === "/unidades/nueva") return "Nueva unidad de negocio";
  if (pathname === "/usuarios") return "Usuarios";

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 1) return "Estadísticas";

  const last = segments[segments.length - 1];
  if (last === "configuracion") return "Configuración";

  return ROUTE_TITLES[last] ?? "Multinegocios";
}
