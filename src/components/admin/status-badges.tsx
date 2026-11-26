import { Badge } from '@/components/ui/misc';
import { RESERVATION_STATUS_LABEL, SALE_STATUS_LABEL } from '@/lib/format';

export function SaleStatusBadge({ status }: { status: keyof typeof SALE_STATUS_LABEL }) {
  const tone = status === 'completed' ? 'success' : status === 'cancelled' ? 'danger' : 'warning';
  return <Badge tone={tone}>{SALE_STATUS_LABEL[status]}</Badge>;
}

export function ReservationStatusBadge({ status }: { status: keyof typeof RESERVATION_STATUS_LABEL }) {
  const tone =
    status === 'completed' ? 'success' : status === 'cancelled' || status === 'expired' ? 'neutral' : status === 'confirmed' ? 'sale' : 'warning';
  return <Badge tone={tone}>{RESERVATION_STATUS_LABEL[status]}</Badge>;
}
