export const COLORS = {
  primary: '#F06292',
  primaryDark: '#D81B60',
  primaryLight: '#F8BBD0',
  secondary: '#EC407A',
  success: '#00C853',
  successLight: '#E8F5E9',
  warning: '#FF9100',
  warningLight: '#FFF3E0',
  error: '#FF1744',
  errorLight: '#FFEBEE',
  info: '#2979FF',
  infoLight: '#E3F2FD',
  background: '#F5F5F7',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  divider: '#F3F4F6',
} as const;

export const STATUS_COLORS = {
  scheduled: { bg: '#E3F2FD', text: '#2979FF', border: '#90CAF9' },
  pre_op: { bg: '#FFF3E0', text: '#FF9100', border: '#FFCC80' },
  in_surgery: { bg: '#F8BBD0', text: '#D81B60', border: '#F48FB1' },
  recovery: { bg: '#E8F5E9', text: '#00C853', border: '#A5D6A7' },
  completed: { bg: '#E8F5E9', text: '#00B050', border: '#81C784' },
  cancelled: { bg: '#FFEBEE', text: '#FF1744', border: '#EF9A9A' },
  emergency: { bg: '#FFEBEE', text: '#C62828', border: '#EF5350' },
} as const;

export const STATUS_LABELS = {
  scheduled: 'Scheduled',
  pre_op: 'Pre-Operation',
  in_surgery: 'In Surgery',
  recovery: 'Recovery',
  completed: 'Completed',
  cancelled: 'Cancelled',
  emergency: 'Emergency',
} as const;

export const DEPARTMENTS = [
  'General Surgery', 'Orthopedic', 'Cardiac', 'Neurosurgery', 'Urology',
  'Gynecology', 'ENT', 'Ophthalmology', 'Pediatric Surgery', 'Plastic Surgery',
  'Dental Surgery', 'Emergency', 'Other'
] as const;

export const FONTS = {
  thin: 'Poppins-Thin',
  extraLight: 'Poppins-ExtraLight',
  light: 'Poppins-Light',
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  extraBold: 'Poppins-ExtraBold',
  black: 'Poppins-Black',
} as const;