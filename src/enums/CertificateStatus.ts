export enum CertificateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export const CERTIFICATE_STATUS_LABELS = {
  [CertificateStatus.PENDING]: 'На модерации',
  [CertificateStatus.APPROVED]: 'Одобрен',
  [CertificateStatus.REJECTED]: 'Отклонен'
} as const;
