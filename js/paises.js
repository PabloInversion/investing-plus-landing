// Lista de países con código de marcado, usada en el selector del formulario de captura.
const PAISES = [
  { code: "CR", dial: "+506", name: "Costa Rica" },
  { code: "MX", dial: "+52", name: "México" },
  { code: "GT", dial: "+502", name: "Guatemala" },
  { code: "HN", dial: "+504", name: "Honduras" },
  { code: "SV", dial: "+503", name: "El Salvador" },
  { code: "NI", dial: "+505", name: "Nicaragua" },
  { code: "PA", dial: "+507", name: "Panamá" },
  { code: "CO", dial: "+57", name: "Colombia" },
  { code: "VE", dial: "+58", name: "Venezuela" },
  { code: "EC", dial: "+593", name: "Ecuador" },
  { code: "PE", dial: "+51", name: "Perú" },
  { code: "BO", dial: "+591", name: "Bolivia" },
  { code: "CL", dial: "+56", name: "Chile" },
  { code: "AR", dial: "+54", name: "Argentina" },
  { code: "UY", dial: "+598", name: "Uruguay" },
  { code: "PY", dial: "+595", name: "Paraguay" },
  { code: "DO", dial: "+1", name: "República Dominicana" },
  { code: "CU", dial: "+53", name: "Cuba" },
  { code: "PR", dial: "+1", name: "Puerto Rico" },
  { code: "ES", dial: "+34", name: "España" },
  { code: "US", dial: "+1", name: "Estados Unidos" },
  { code: "BR", dial: "+55", name: "Brasil" },
  { code: "CA", dial: "+1", name: "Canadá" },
  { code: "GQ", dial: "+240", name: "Guinea Ecuatorial" },
  { code: "OT", dial: "", name: "Otro país" },
];

// Convierte un codigo ISO de 2 letras en su emoji de bandera (sin tener que
// guardar el emoji a mano por cada pais).
function paisFlag(code) {
  if (!code || code === "OT") return "🌐";
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}
