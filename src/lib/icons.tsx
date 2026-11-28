import { Gem, Glasses, Shirt, Tag, Watch, type LucideProps, Icon } from 'lucide-react';
import {
  bagHand,
  belt,
  coatHanger,
  dress,
  hatBeanie,
  highHeel,
  jacketSports,
  scarf,
  shirtFoldedButtons,
  shirtLongSleeve,
  shirtTVNeck,
  shorts,
  skirt,
  sneaker,
  socks,
  sweater,
  tie,
  trousers,
  vest,
} from '@lucide/lab';
import type { ComponentType } from 'react';

/**
 * Íconos de categorías y colecciones. Lucide + @lucide/lab (mismo trazo).
 * La clave se guarda en categories.icon; si no existe, se usa un ícono genérico.
 */
type IconComponent = ComponentType<LucideProps>;

type LabNode = Parameters<typeof Icon>[0] extends infer P ? (P extends { iconNode: infer N } ? NonNullable<N> : never) : never;

const lab = (node: LabNode): IconComponent => {
  function LabIcon(props: LucideProps) {
    return <Icon iconNode={node} {...props} />;
  }
  return LabIcon;
};

export const CATEGORY_ICONS: Record<string, { label: string; Icon: IconComponent }> = {
  'shirt-v-neck': { label: 'Blusa', Icon: lab(shirtTVNeck) },
  shirt: { label: 'Playera', Icon: Shirt },
  'shirt-buttons': { label: 'Camisa', Icon: lab(shirtFoldedButtons) },
  sweater: { label: 'Suéter', Icon: lab(sweater) },
  'shirt-long-sleeve': { label: 'Manga larga', Icon: lab(shirtLongSleeve) },
  jacket: { label: 'Chamarra', Icon: lab(jacketSports) },
  vest: { label: 'Chaleco', Icon: lab(vest) },
  dress: { label: 'Vestido', Icon: lab(dress) },
  skirt: { label: 'Falda', Icon: lab(skirt) },
  trousers: { label: 'Pantalón', Icon: lab(trousers) },
  shorts: { label: 'Short', Icon: lab(shorts) },
  sneaker: { label: 'Tenis', Icon: lab(sneaker) },
  'high-heel': { label: 'Tacón', Icon: lab(highHeel) },
  socks: { label: 'Calcetines', Icon: lab(socks) },
  bag: { label: 'Bolsa', Icon: lab(bagHand) },
  belt: { label: 'Cinturón', Icon: lab(belt) },
  scarf: { label: 'Bufanda', Icon: lab(scarf) },
  hat: { label: 'Gorro', Icon: lab(hatBeanie) },
  tie: { label: 'Corbata', Icon: lab(tie) },
  glasses: { label: 'Lentes', Icon: Glasses },
  watch: { label: 'Reloj', Icon: Watch },
  jewelry: { label: 'Joyería', Icon: Gem },
  hanger: { label: 'Gancho', Icon: lab(coatHanger) },
};

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS);

export function CategoryIcon({ icon, ...props }: LucideProps & { icon: string | null | undefined }) {
  const Cmp = (icon && CATEGORY_ICONS[icon]?.Icon) || Tag;
  return <Cmp aria-hidden strokeWidth={1.5} {...props} />;
}

export type AudienceKey = 'women' | 'men' | 'unisex';

export const AUDIENCES: Record<AudienceKey, { label: string; Icon: IconComponent; hint: string }> = {
  women: { label: 'Mujer', Icon: lab(dress), hint: 'Aparece en Mujer' },
  men: { label: 'Hombre', Icon: lab(shirtFoldedButtons), hint: 'Aparece en Hombre' },
  unisex: { label: 'Unisex', Icon: Shirt, hint: 'Aparece en ambas' },
};

export function AudienceIcon({ audience, ...props }: LucideProps & { audience: AudienceKey }) {
  const Cmp = AUDIENCES[audience].Icon;
  return <Cmp aria-hidden strokeWidth={1.5} {...props} />;
}
