/** Une clases condicionales. Sin dependencias: las clases en conflicto se evitan por diseño. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
